import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import {
  mapTeamSession,
  mapTeamPick,
  type TeamPickRow,
  type TeamSessionRow,
} from "../../lib/mappers.js";
import { loadPollForTeam } from "../_lib/poll.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const token = (req.query.token as string | undefined)?.trim();
    if (!token) return res.status(400).json({ error: "Thiếu share token." });

    const { rows } = await query<TeamSessionRow>(
      `SELECT * FROM team_sessions WHERE share_token = $1`,
      [token],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy team với link này." });
    }
    const team = mapTeamSession(rows[0]);

    const { rows: pickRows } = await query<TeamPickRow>(
      `SELECT * FROM team_picks WHERE team_id = $1 ORDER BY created_at ASC`,
      [team.id],
    );

    const voterToken =
      (req.headers["x-voter-token"] as string | undefined) ?? null;
    const poll = await loadPollForTeam(team.id, voterToken);

    return res.json({
      team,
      picks: pickRows.map(mapTeamPick),
      poll,
    });
  } catch (err) {
    console.error("[/api/teams/by-token] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
