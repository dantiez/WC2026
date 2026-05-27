import { getPool, query } from "../../lib/db.js";
import type {
  TeamPollCandidateDTO,
  TeamPollDTO,
} from "../../lib/mappers.js";

type CandidateAggRow = {
  id: string;
  poll_id: string;
  jersey_id: string;
  position: number;
  vote_count: string | number;
  voter_names: string[] | null;
};

type PollRow = {
  id: string;
  team_id: string;
  winner_jersey_id: string | null;
  deadline_at: Date | null;
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

/**
 * Lazy auto-finalize: if a poll's deadline has passed and there is at least
 * one vote, pick the top-voted candidate (tie-break by position) and set it
 * as the winner. Idempotent + concurrency-safe via `winner_jersey_id IS NULL`.
 */
export async function autoFinalizeIfExpired(teamId: string): Promise<void> {
  const { rows } = await query<{
    id: string;
    deadline_at: Date | null;
    winner_jersey_id: string | null;
  }>(
    `SELECT id, deadline_at, winner_jersey_id FROM team_polls WHERE team_id = $1`,
    [teamId],
  );
  if (rows.length === 0) return;
  const poll = rows[0];
  if (poll.winner_jersey_id) return;
  if (!poll.deadline_at) return;
  if (poll.deadline_at.getTime() > Date.now()) return;

  const { rows: topRows } = await query<{ jersey_id: string; vote_count: string }>(
    `SELECT c.jersey_id, COUNT(v.id)::int AS vote_count
     FROM team_poll_candidates c
     LEFT JOIN team_poll_votes v ON v.candidate_id = c.id
     WHERE c.poll_id = $1
     GROUP BY c.id
     ORDER BY COUNT(v.id) DESC, c.position ASC
     LIMIT 1`,
    [poll.id],
  );
  if (topRows.length === 0) return;
  if (Number(topRows[0].vote_count) === 0) return; // need at least one vote
  const winnerJerseyId = topRows[0].jersey_id;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE team_polls
         SET winner_jersey_id = $1, closed_at = now(), updated_at = now()
       WHERE id = $2 AND winner_jersey_id IS NULL`,
      [winnerJerseyId, poll.id],
    );
    await client.query(
      `UPDATE team_sessions
         SET default_product_id = $1, updated_at = now()
       WHERE id = $2`,
      [winnerJerseyId, teamId],
    );
    await client.query(
      `UPDATE team_picks
         SET jersey_id = $1, updated_at = now()
       WHERE team_id = $2 AND jersey_id IS NULL`,
      [winnerJerseyId, teamId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function loadPollForTeam(
  teamId: string,
  voterToken: string | null,
): Promise<TeamPollDTO | null> {
  await autoFinalizeIfExpired(teamId);

  const { rows: pollRows } = await query<PollRow>(
    `SELECT * FROM team_polls WHERE team_id = $1`,
    [teamId],
  );
  if (pollRows.length === 0) return null;
  const poll = pollRows[0];

  const { rows: candidateRows } = await query<CandidateAggRow>(
    `SELECT
       c.id,
       c.poll_id,
       c.jersey_id,
       c.position,
       COUNT(v.id)::int  AS vote_count,
       COALESCE(
         array_agg(v.voter_name ORDER BY v.created_at)
           FILTER (WHERE v.id IS NOT NULL),
         '{}'
       ) AS voter_names
     FROM team_poll_candidates c
     LEFT JOIN team_poll_votes v ON v.candidate_id = c.id
     WHERE c.poll_id = $1
     GROUP BY c.id
     ORDER BY c.position ASC, c.id ASC`,
    [poll.id],
  );

  const candidates: TeamPollCandidateDTO[] = candidateRows.map((r) => ({
    id: r.id,
    pollId: r.poll_id,
    jerseyId: r.jersey_id,
    position: r.position,
    voteCount: Number(r.vote_count),
    voters: r.voter_names ?? [],
  }));

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  let myVoteCandidateId: string | null = null;
  if (voterToken) {
    const { rows } = await query<{ candidate_id: string }>(
      `SELECT candidate_id FROM team_poll_votes WHERE poll_id = $1 AND voter_token = $2`,
      [poll.id, voterToken],
    );
    if (rows.length > 0) myVoteCandidateId = rows[0].candidate_id;
  }

  return {
    id: poll.id,
    teamId: poll.team_id,
    winnerJerseyId: poll.winner_jersey_id,
    deadlineAt: poll.deadline_at ? poll.deadline_at.toISOString() : null,
    closedAt: poll.closed_at ? poll.closed_at.toISOString() : null,
    createdAt: poll.created_at.toISOString(),
    updatedAt: poll.updated_at.toISOString(),
    candidates,
    totalVotes,
    myVoteCandidateId,
  };
}
