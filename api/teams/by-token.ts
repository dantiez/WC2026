import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import {
  mapShop,
  mapShopJersey,
  mapTeamSession,
  mapTeamPick,
  type ShopJerseyRow,
  type ShopRow,
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

    const voterToken =
      (req.headers["x-voter-token"] as string | undefined) ?? null;

    // Single round-trip from the member's browser: ship picks + poll +
    // active jerseys + shops together. Saves 2 extra requests on init.
    const [pickRowsRes, pollRes, jerseyRowsRes, shopRowsRes] = await Promise.all([
      query<TeamPickRow>(
        `SELECT * FROM team_picks WHERE team_id = $1 ORDER BY created_at ASC`,
        [team.id],
      ),
      loadPollForTeam(team.id, voterToken),
      query<ShopJerseyRow>(
        `SELECT * FROM shop_jerseys WHERE is_active = TRUE ORDER BY created_at ASC`,
      ),
      query<ShopRow>(`SELECT * FROM shops ORDER BY created_at ASC`),
    ]);

    return res.json({
      team,
      picks: pickRowsRes.rows.map(mapTeamPick),
      poll: pollRes,
      jerseys: jerseyRowsRes.rows.map(mapShopJersey),
      shops: shopRowsRes.rows.map(mapShop),
    });
  } catch (err) {
    console.error("[/api/teams/by-token] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
