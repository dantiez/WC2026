import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db";
import { mapOrder } from "../../lib/mappers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { orderId, paymentStatus } = req.body ?? {};
    if (!orderId || !paymentStatus) {
      return res.status(400).json({ error: "Thiếu orderId hoặc paymentStatus." });
    }

    const patch: Record<string, string> = { status: paymentStatus };
    if (paymentStatus === "paid") {
      patch.paidAt = new Date().toISOString();
      patch.transactionId = "TXN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    const advanceStatus = paymentStatus === "paid";

    const { rows } = await query(
      `UPDATE orders
       SET payment = COALESCE(payment, '{}'::jsonb) || $1::jsonb,
           status  = CASE WHEN $2::boolean AND status = 'pending' THEN 'processing' ELSE status END,
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(patch), advanceStatus, orderId]
    );

    if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy đơn đặt hàng." });
    return res.json({ success: true, order: mapOrder(rows[0] as never) });
  } catch (err) {
    console.error("[/api/payments/simulate] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
