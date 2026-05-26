import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../../../lib/db.js";
import {
  mapTeamPick,
  randomToken,
  shortId,
  type TeamPickRow,
  type TeamSessionRow,
} from "../../../../lib/mappers.js";
import { readCaptainClaims } from "../../../_lib/auth.js";

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
    const captain = readCaptainClaims(req);
    const isCaptain = captain?.email === team.captain_email;

    if (req.method === "GET") {
      const { rows } = await query<TeamPickRow>(
        `SELECT * FROM team_picks WHERE team_id = $1 ORDER BY created_at ASC`,
        [teamId],
      );
      return res.json(rows.map(mapTeamPick));
    }

    if (req.method === "POST") {
      return await createPick(req, res, team, isCaptain);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/teams/picks] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createPick(
  req: VercelRequest,
  res: VercelResponse,
  team: TeamSessionRow,
  isCaptain: boolean,
) {
  if (team.status === "locked" && !isCaptain) {
    return res.status(423).json({ error: "Team đã chốt đơn, không thể thêm pick mới." });
  }

  const { rows: pollRows } = await query<{ winner_jersey_id: string | null }>(
    `SELECT winner_jersey_id FROM team_polls WHERE team_id = $1`,
    [team.id],
  );
  const hasPoll = pollRows.length > 0;
  const winnerJerseyId = hasPoll ? pollRows[0].winner_jersey_id : null;
  if (hasPoll && !winnerJerseyId && !isCaptain) {
    return res
      .status(423)
      .json({ error: "Đang voting chọn mẫu áo, chưa thể pick. Vui lòng chờ captain chốt." });
  }

  const body = (req.body ?? {}) as {
    memberName?: string;
    jerseyId?: string;
    size?: string;
    jerseyNumber?: string | number | null;
    nickname?: string | null;
  };

  const memberName = (body.memberName ?? "").trim();
  let jerseyId = (body.jerseyId ?? "").trim();
  if (winnerJerseyId && !isCaptain) {
    jerseyId = winnerJerseyId;
  }
  const size = (body.size ?? "").trim();
  const jerseyNumber =
    body.jerseyNumber !== null && body.jerseyNumber !== undefined
      ? String(body.jerseyNumber).trim()
      : "";

  const fieldErrors: Record<string, string> = {};
  if (!memberName) fieldErrors.memberName = "Vui lòng nhập tên của bạn.";
  if (!jerseyId) fieldErrors.jerseyId = "Vui lòng chọn mẫu áo.";
  if (!size) fieldErrors.size = "Vui lòng chọn size.";
  if (!jerseyNumber) fieldErrors.jerseyNumber = "Vui lòng nhập số áo.";

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({
      error: "Vui lòng điền đầy đủ các trường bắt buộc.",
      fieldErrors,
    });
  }

  const id = shortId("pick");
  const memberToken = randomToken(28);
  const { rows } = await query<TeamPickRow>(
    `INSERT INTO team_picks (id, team_id, member_name, member_token, jersey_id, size, jersey_number, nickname)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      id,
      team.id,
      memberName,
      memberToken,
      jerseyId,
      size,
      jerseyNumber,
      body.nickname ?? null,
    ],
  );
  return res.status(201).json({ pick: mapTeamPick(rows[0]), memberToken });
}
