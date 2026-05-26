import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getPool, query } from "../../../../lib/db.js";
import {
  shortId,
  type TeamSessionRow,
} from "../../../../lib/mappers.js";
import { readCaptainClaims, requireCaptain } from "../../../_lib/auth.js";
import { loadPollForTeam } from "../../../_lib/poll.js";

const MIN_CANDIDATES = 2;
const MAX_CANDIDATES = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const teamId = req.query.id as string | undefined;
    if (!teamId) return res.status(400).json({ error: "Thiếu team id." });

    const { rows: teamRows } = await query<TeamSessionRow>(
      `SELECT * FROM team_sessions WHERE id = $1`,
      [teamId],
    );
    if (teamRows.length === 0) return res.status(404).json({ error: "Team không tồn tại." });
    const team = teamRows[0];

    if (req.method === "GET") {
      const voterToken =
        (req.headers["x-voter-token"] as string | undefined) ?? null;
      const poll = await loadPollForTeam(team.id, voterToken);
      return res.json({ poll });
    }

    // POST / PATCH / DELETE → captain-only
    const captain = readCaptainClaims(req);
    if (!captain || captain.email !== team.captain_email) {
      const claims = requireCaptain(req, res);
      if (!claims) return;
      if (claims.email !== team.captain_email) {
        return res.status(403).json({ error: "Bạn không phải captain của team này." });
      }
    }

    if (req.method === "POST") return await createPoll(req, res, team.id);
    if (req.method === "PATCH") return await finalizePoll(req, res, team.id);
    if (req.method === "DELETE") return await deletePoll(req, res, team.id);

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/teams/:id/poll] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createPoll(req: VercelRequest, res: VercelResponse, teamId: string) {
  const body = (req.body ?? {}) as { candidateJerseyIds?: unknown };
  const raw = Array.isArray(body.candidateJerseyIds) ? body.candidateJerseyIds : [];
  const ids = Array.from(
    new Set(
      raw
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  );

  if (ids.length < MIN_CANDIDATES || ids.length > MAX_CANDIDATES) {
    return res.status(400).json({
      error: `Vui lòng chọn ${MIN_CANDIDATES}-${MAX_CANDIDATES} mẫu áo làm ứng cử.`,
    });
  }

  const { rows: jerseyRows } = await query<{ id: string }>(
    `SELECT id FROM shop_jerseys WHERE id = ANY($1::text[]) AND is_active = TRUE`,
    [ids],
  );
  if (jerseyRows.length !== ids.length) {
    return res.status(400).json({ error: "Có mẫu áo không tồn tại hoặc đã ẩn." });
  }

  const { rows: existing } = await query<{ id: string }>(
    `SELECT id FROM team_polls WHERE team_id = $1`,
    [teamId],
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: "Team đã có poll. Xoá poll cũ trước khi tạo mới." });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pollId = shortId("poll");
    await client.query(
      `INSERT INTO team_polls (id, team_id) VALUES ($1, $2)`,
      [pollId, teamId],
    );
    for (let i = 0; i < ids.length; i++) {
      await client.query(
        `INSERT INTO team_poll_candidates (id, poll_id, jersey_id, position)
         VALUES ($1, $2, $3, $4)`,
        [shortId("pollcand"), pollId, ids[i], i],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const poll = await loadPollForTeam(teamId, null);
  return res.status(201).json({ poll });
}

async function finalizePoll(req: VercelRequest, res: VercelResponse, teamId: string) {
  const body = (req.body ?? {}) as { winnerJerseyId?: string };
  const winnerJerseyId = (body.winnerJerseyId ?? "").trim();
  if (!winnerJerseyId) {
    return res.status(400).json({ error: "Thiếu winnerJerseyId." });
  }

  const { rows: pollRows } = await query<{ id: string }>(
    `SELECT id FROM team_polls WHERE team_id = $1`,
    [teamId],
  );
  if (pollRows.length === 0) {
    return res.status(404).json({ error: "Team chưa có poll." });
  }
  const pollId = pollRows[0].id;

  const { rows: candRows } = await query<{ jersey_id: string }>(
    `SELECT jersey_id FROM team_poll_candidates WHERE poll_id = $1 AND jersey_id = $2`,
    [pollId, winnerJerseyId],
  );
  if (candRows.length === 0) {
    return res.status(400).json({ error: "Mẫu áo này không có trong danh sách ứng cử." });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE team_polls
         SET winner_jersey_id = $1, closed_at = now(), updated_at = now()
       WHERE id = $2`,
      [winnerJerseyId, pollId],
    );
    await client.query(
      `UPDATE team_sessions
         SET default_product_id = $1, updated_at = now()
       WHERE id = $2`,
      [winnerJerseyId, teamId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const poll = await loadPollForTeam(teamId, null);
  return res.json({ poll });
}

async function deletePoll(_req: VercelRequest, res: VercelResponse, teamId: string) {
  await query(`DELETE FROM team_polls WHERE team_id = $1`, [teamId]);
  return res.json({ ok: true });
}
