import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../../lib/db.js";
import { mapTeamSession, type TeamSessionRow } from "../../../lib/mappers.js";
import { requireCaptain } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const claims = requireCaptain(req, res);
    if (!claims) return;

    const id = req.query.id as string | undefined;
    if (!id) return res.status(400).json({ error: "Thiếu team id." });

    const { rows: existing } = await query<TeamSessionRow>(
      `SELECT * FROM team_sessions WHERE id = $1`,
      [id],
    );
    if (existing.length === 0) return res.status(404).json({ error: "Team không tồn tại." });
    if (existing[0].captain_email !== claims.email) {
      return res.status(403).json({ error: "Bạn không phải captain của team này." });
    }

    if (req.method === "GET") {
      return res.json(mapTeamSession(existing[0]));
    }
    if (req.method === "PATCH") {
      return await patchTeam(req, res, id);
    }
    if (req.method === "DELETE") {
      await query(`DELETE FROM team_sessions WHERE id = $1`, [id]);
      return res.json({ ok: true });
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/teams/:id] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function patchTeam(req: VercelRequest, res: VercelResponse, id: string) {
  const body = (req.body ?? {}) as {
    name?: string;
    deadlineAt?: string | null;
    status?: "open" | "locked";
    defaultProductId?: string | null;
  };

  const sets: string[] = [];
  const params: unknown[] = [];

  if (body.name !== undefined) {
    params.push(body.name.trim());
    sets.push(`name = $${params.length}`);
  }
  if (body.deadlineAt !== undefined) {
    if (body.deadlineAt === null) {
      sets.push(`deadline_at = NULL`);
    } else {
      const d = new Date(body.deadlineAt);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: "Hạn chốt đơn không hợp lệ." });
      }
      params.push(d.toISOString());
      sets.push(`deadline_at = $${params.length}`);
    }
  }
  if (body.status !== undefined) {
    if (body.status !== "open" && body.status !== "locked") {
      return res.status(400).json({ error: "Trạng thái phải là open hoặc locked." });
    }
    params.push(body.status);
    sets.push(`status = $${params.length}`);
  }
  if (body.defaultProductId !== undefined) {
    params.push(body.defaultProductId);
    sets.push(`default_product_id = $${params.length}`);
  }

  if (sets.length === 0) {
    return res.status(400).json({ error: "Không có gì để cập nhật." });
  }
  sets.push(`updated_at = now()`);
  params.push(id);

  const { rows } = await query<TeamSessionRow>(
    `UPDATE team_sessions SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return res.json(mapTeamSession(rows[0]));
}
