import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import {
  mapTeamPick,
  type TeamPickRow,
  type TeamSessionRow,
} from "../../lib/mappers.js";
import { readCaptainClaims } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const teamId = req.query.teamId as string | undefined;
    const pickId = req.query.pickId as string | undefined;
    if (!teamId || !pickId) return res.status(400).json({ error: "Thiếu teamId hoặc pickId." });

    const memberToken = (req.headers["x-member-token"] as string | undefined) ?? undefined;

    const { rows: teamRows } = await query<TeamSessionRow>(
      `SELECT * FROM team_sessions WHERE id = $1`,
      [teamId],
    );
    if (teamRows.length === 0) return res.status(404).json({ error: "Team không tồn tại." });
    const team = teamRows[0];

    const { rows: pickRows } = await query<TeamPickRow>(
      `SELECT * FROM team_picks WHERE id = $1 AND team_id = $2`,
      [pickId, teamId],
    );
    if (pickRows.length === 0) return res.status(404).json({ error: "Pick không tồn tại." });
    const pick = pickRows[0];

    const captain = readCaptainClaims(req);
    const isCaptain = captain?.email === team.captain_email;
    const isOwner = memberToken && pick.member_token === memberToken;
    if (!isCaptain && !isOwner) {
      return res.status(403).json({ error: "Bạn không có quyền sửa pick này." });
    }
    if (team.status === "locked" && !isCaptain) {
      return res.status(423).json({ error: "Team đã chốt đơn, không thể chỉnh sửa." });
    }

    if (req.method === "PUT") return await updatePick(req, res, pick);
    if (req.method === "DELETE") {
      await query(`DELETE FROM team_picks WHERE id = $1`, [pickId]);
      return res.json({ ok: true });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/teams/pick] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updatePick(req: VercelRequest, res: VercelResponse, pick: TeamPickRow) {
  const body = (req.body ?? {}) as {
    memberName?: string;
    jerseyId?: string;
    size?: string;
    jerseyNumber?: string | number | null;
    nickname?: string | null;
    accentColor?: string | null;
  };

  const sets: string[] = [];
  const params: unknown[] = [];

  if (body.memberName !== undefined) {
    params.push(body.memberName.trim());
    sets.push(`member_name = $${params.length}`);
  }
  if (body.jerseyId !== undefined) {
    params.push(body.jerseyId);
    sets.push(`jersey_id = $${params.length}`);
  }
  if (body.size !== undefined) {
    params.push(body.size);
    sets.push(`size = $${params.length}`);
  }
  if (body.jerseyNumber !== undefined) {
    params.push(body.jerseyNumber === null ? null : String(body.jerseyNumber));
    sets.push(`jersey_number = $${params.length}`);
  }
  if (body.nickname !== undefined) {
    params.push(body.nickname);
    sets.push(`nickname = $${params.length}`);
  }
  if (body.accentColor !== undefined) {
    params.push(body.accentColor);
    sets.push(`accent_color = $${params.length}`);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: "Không có gì để cập nhật." });
  }

  sets.push(`updated_at = now()`);
  params.push(pick.id);
  const { rows } = await query<TeamPickRow>(
    `UPDATE team_picks SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return res.json(mapTeamPick(rows[0]));
}
