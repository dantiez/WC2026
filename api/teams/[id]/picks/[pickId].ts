import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../../../lib/db.js";
import {
  mapTeamPick,
  type TeamPickRow,
  type TeamSessionRow,
} from "../../../../lib/mappers.js";
import { readCaptainClaims } from "../../../_lib/auth.js";
import { autoFinalizeIfExpired } from "../../../_lib/poll.js";
import { notifyTeam } from "../../../_lib/realtime.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const teamId = req.query.id as string | undefined;
    const pickId = req.query.pickId as string | undefined;
    if (!teamId || !pickId) return res.status(400).json({ error: "Thiếu team id hoặc pickId." });

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

    let lockedJerseyId: string | null = null;
    let memberInVoting = false;
    if (!isCaptain) {
      await autoFinalizeIfExpired(teamId);
      const { rows: pollRows } = await query<{ winner_jersey_id: string | null }>(
        `SELECT winner_jersey_id FROM team_polls WHERE team_id = $1`,
        [teamId],
      );
      if (pollRows.length > 0) {
        if (pollRows[0].winner_jersey_id) {
          lockedJerseyId = pollRows[0].winner_jersey_id;
        } else {
          memberInVoting = true;
        }
      } else {
        lockedJerseyId = team.default_product_id;
      }
      if (!memberInVoting && !lockedJerseyId) {
        return res.status(423).json({
          error: "Captain chưa chọn mẫu áo cho team.",
        });
      }
    }

    if (req.method === "PUT")
      return await updatePick(req, res, pick, lockedJerseyId, memberInVoting);
    if (req.method === "DELETE") {
      await query(`DELETE FROM team_picks WHERE id = $1`, [pickId]);
      await notifyTeam(teamId, "pick:deleted");
      return res.json({ ok: true });
    }

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/teams/pick] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updatePick(
  req: VercelRequest,
  res: VercelResponse,
  pick: TeamPickRow,
  lockedJerseyId: string | null,
  memberInVoting: boolean,
) {
  const body = (req.body ?? {}) as {
    memberName?: string;
    jerseyId?: string;
    size?: string;
    jerseyNumber?: string | number | null;
    nickname?: string | null;
  };

  const sets: string[] = [];
  const params: unknown[] = [];
  const fieldErrors: Record<string, string> = {};

  if (body.memberName !== undefined) {
    const v = body.memberName.trim();
    if (!v) fieldErrors.memberName = "Vui lòng nhập tên của bạn.";
    params.push(v);
    sets.push(`member_name = $${params.length}`);
  }
  if (memberInVoting) {
    // jersey stays NULL while voting is open; ignore any incoming jerseyId
    if (pick.jersey_id !== null) {
      params.push(null);
      sets.push(`jersey_id = $${params.length}`);
    }
  } else if (body.jerseyId !== undefined) {
    const v = lockedJerseyId ? lockedJerseyId : body.jerseyId.trim();
    if (!v) fieldErrors.jerseyId = "Vui lòng chọn mẫu áo.";
    params.push(v);
    sets.push(`jersey_id = $${params.length}`);
  } else if (lockedJerseyId && pick.jersey_id !== lockedJerseyId) {
    params.push(lockedJerseyId);
    sets.push(`jersey_id = $${params.length}`);
  }
  if (body.size !== undefined) {
    const v = body.size.trim();
    if (!v) fieldErrors.size = "Vui lòng chọn size.";
    params.push(v);
    sets.push(`size = $${params.length}`);
  }
  if (body.jerseyNumber !== undefined) {
    const v =
      body.jerseyNumber === null ? "" : String(body.jerseyNumber).trim();
    if (!v) fieldErrors.jerseyNumber = "Vui lòng nhập số áo.";
    params.push(v);
    sets.push(`jersey_number = $${params.length}`);
  }
  if (body.nickname !== undefined) {
    params.push(body.nickname);
    sets.push(`nickname = $${params.length}`);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({
      error: "Vui lòng điền đầy đủ các trường bắt buộc.",
      fieldErrors,
    });
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
  await notifyTeam(pick.team_id, "pick:updated");
  return res.json(mapTeamPick(rows[0]));
}
