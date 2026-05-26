import { query } from "../../lib/db.js";
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
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export async function loadPollForTeam(
  teamId: string,
  voterToken: string | null,
): Promise<TeamPollDTO | null> {
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
    closedAt: poll.closed_at ? poll.closed_at.toISOString() : null,
    createdAt: poll.created_at.toISOString(),
    updatedAt: poll.updated_at.toISOString(),
    candidates,
    totalVotes,
    myVoteCandidateId,
  };
}
