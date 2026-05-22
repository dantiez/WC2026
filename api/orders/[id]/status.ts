import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../../lib/db";
import { mapOrder } from "../../../lib/mappers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const { status, paymentStatus } = req.body ?? {};
    if (!status && !paymentStatus) {
      return res.status(400).json({ error: "Không có trường nào để cập nhật." });
    }

    const sets: string[] = ["updated_at = now()"];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      sets.push(`status = $${params.length}`);
    }

    if (paymentStatus) {
      const patch: Record<string, string> = { status: paymentStatus };
      if (paymentStatus === "paid") patch.paidAt = new Date().toISOString();
      params.push(JSON.stringify(patch));
      sets.push(`payment = COALESCE(payment, '{}'::jsonb) || $${params.length}::jsonb`);
    }

    params.push(id);
    const { rows } = await query(
      `UPDATE orders SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy đơn đặt hàng." });
    return res.json(mapOrder(rows[0] as never));
  } catch (err) {
    console.error("[/api/orders/:id/status] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
