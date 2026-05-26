import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../../../lib/db.js";
import {
  randomToken,
  shortId,
  type TeamSessionRow,
} from "../../../../lib/mappers.js";
import { loadPollForTeam } from "../../../_lib/poll.js";

const MIN_NAME = 1;
const MAX_NAME = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const teamId = req.query.id as string | undefined;
    if (!teamId) return res.status(400).json({ error: "Thiếu team id." });

    const { rows: teamRows } = await query<TeamSessionRow>(
      `SELECT * FROM team_sessions WHERE id = $1`,
      [teamId],
    );
    if (teamRows.length === 0) return res.status(404).json({ error: "Team không tồn tại." });

    const body = (req.body ?? {}) as {
      candidateId?: string;
      voterName?: string;
    };
    const candidateId = (body.candidateId ?? "").trim();
    const voterName = (body.voterName ?? "").trim();

    const fieldErrors: Record<string, string> = {};
    if (!voterName) fieldErrors.voterName = "Vui lòng nhập tên của bạn.";
    else if (voterName.length > MAX_NAME)
      fieldErrors.voterName = `Tên tối đa ${MAX_NAME} ký tự.`;
    if (!candidateId) fieldErrors.candidateId = "Vui lòng chọn 1 mẫu.";
    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        error: "Vui lòng điền đầy đủ thông tin.",
        fieldErrors,
      });
    }

    const { rows: pollRows } = await query<{
      id: string;
      winner_jersey_id: string | null;
    }>(
      `SELECT id, winner_jersey_id FROM team_polls WHERE team_id = $1`,
      [teamId],
    );
    if (pollRows.length === 0) {
      return res.status(404).json({ error: "Team chưa mở voting." });
    }
    const poll = pollRows[0];
    if (poll.winner_jersey_id) {
      return res.status(423).json({ error: "Poll đã chốt, không thể đổi vote." });
    }

    const { rows: candRows } = await query<{ id: string }>(
      `SELECT id FROM team_poll_candidates WHERE id = $1 AND poll_id = $2`,
      [candidateId, poll.id],
    );
    if (candRows.length === 0) {
      return res.status(400).json({ error: "Ứng cử viên không hợp lệ." });
    }

    const incomingToken = (req.headers["x-voter-token"] as string | undefined)?.trim();
    const voterToken =
      incomingToken && incomingToken.length >= 16 && incomingToken.length <= 64
        ? incomingToken
        : randomToken(28);

    if (voterName.length < MIN_NAME) {
      return res.status(400).json({ error: "Tên không hợp lệ." });
    }

    await query(
      `INSERT INTO team_poll_votes (id, poll_id, candidate_id, voter_token, voter_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (poll_id, voter_token)
       DO UPDATE SET
         candidate_id = EXCLUDED.candidate_id,
         voter_name   = EXCLUDED.voter_name,
         updated_at   = now()`,
      [shortId("pollvote"), poll.id, candidateId, voterToken, voterName],
    );

    const pollDto = await loadPollForTeam(teamId, voterToken);
    return res.status(200).json({ poll: pollDto, voterToken });
  } catch (err) {
    console.error("[/api/teams/:id/poll/vote] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
