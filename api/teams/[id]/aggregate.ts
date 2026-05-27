import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../../lib/db.js";
import {
  mapShop,
  mapShopJersey,
  mapTeamPick,
  mapTeamSession,
  type ShopJerseyRow,
  type ShopRow,
  type TeamPickRow,
  type TeamSessionRow,
} from "../../../lib/mappers.js";
import { requireCaptain } from "../../_lib/auth.js";
import { loadPollForTeam } from "../../_lib/poll.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const claims = requireCaptain(req, res);
    if (!claims) return;
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const teamId = req.query.id as string | undefined;
    if (!teamId) return res.status(400).json({ error: "Thiếu team id." });

    const { rows: teamRows } = await query<TeamSessionRow>(
      `SELECT * FROM team_sessions WHERE id = $1`,
      [teamId],
    );
    if (teamRows.length === 0) return res.status(404).json({ error: "Team không tồn tại." });
    if (teamRows[0].captain_email !== claims.email) {
      return res.status(403).json({ error: "Bạn không phải captain của team này." });
    }
    const team = mapTeamSession(teamRows[0]);

    // Single round-trip: ship picks + poll + ALL jerseys (admin view incl.
    // inactive) + shops together. Saves 2 extra requests on captain init.
    const [pickRowsRes, pollRes, jerseyRowsRes, shopRowsRes] = await Promise.all([
      query<TeamPickRow>(
        `SELECT * FROM team_picks WHERE team_id = $1 ORDER BY created_at ASC`,
        [teamId],
      ),
      loadPollForTeam(team.id, null),
      query<ShopJerseyRow>(
        `SELECT * FROM shop_jerseys ORDER BY created_at ASC`,
      ),
      query<ShopRow>(`SELECT * FROM shops ORDER BY created_at ASC`),
    ]);

    const sizeBreakdown: Record<string, number> = {};
    const jerseyBreakdown: Record<string, number> = {};
    for (const p of pickRowsRes.rows) {
      sizeBreakdown[p.size] = (sizeBreakdown[p.size] ?? 0) + 1;
      const jKey = p.jersey_id ?? "__pending__";
      jerseyBreakdown[jKey] = (jerseyBreakdown[jKey] ?? 0) + 1;
    }

    return res.json({
      team,
      picks: pickRowsRes.rows.map(mapTeamPick),
      total: pickRowsRes.rows.length,
      sizeBreakdown,
      jerseyBreakdown,
      poll: pollRes,
      jerseys: jerseyRowsRes.rows.map(mapShopJersey),
      shops: shopRowsRes.rows.map(mapShop),
    });
  } catch (err) {
    console.error("[/api/teams/aggregate] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
