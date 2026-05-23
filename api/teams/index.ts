import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import {
  mapTeamSession,
  randomToken,
  shortId,
  type TeamSessionRow,
} from "../../lib/mappers.js";
import { requireCaptain } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const claims = requireCaptain(req, res);
    if (!claims) return;

    if (req.method === "GET") return await listTeams(req, res, claims.email);
    if (req.method === "POST") return await createTeam(req, res, claims.email);

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/teams] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listTeams(_req: VercelRequest, res: VercelResponse, captainEmail: string) {
  const { rows } = await query<TeamSessionRow>(
    `SELECT * FROM team_sessions WHERE captain_email = $1 ORDER BY created_at DESC`,
    [captainEmail],
  );
  return res.json(rows.map(mapTeamSession));
}

async function createTeam(req: VercelRequest, res: VercelResponse, captainEmail: string) {
  const body = (req.body ?? {}) as {
    name?: string;
    defaultProductId?: string | null;
    deadlineAt?: string | null;
  };

  const name = (body.name ?? "").trim();
  if (!name) {
    return res.status(400).json({ error: "Tên team không được trống." });
  }
  const deadline = body.deadlineAt ? new Date(body.deadlineAt) : null;
  if (deadline && Number.isNaN(deadline.getTime())) {
    return res.status(400).json({ error: "Hạn chốt đơn không hợp lệ." });
  }

  const id = shortId("team");
  const shareToken = randomToken(22);
  const { rows } = await query<TeamSessionRow>(
    `INSERT INTO team_sessions (id, name, captain_email, share_token, default_product_id, deadline_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      id,
      name,
      captainEmail,
      shareToken,
      body.defaultProductId ?? null,
      deadline ? deadline.toISOString() : null,
    ],
  );
  return res.status(201).json(mapTeamSession(rows[0]));
}
