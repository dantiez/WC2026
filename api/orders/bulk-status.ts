import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { orderIds, status } = req.body ?? {};
    if (!orderIds || !Array.isArray(orderIds) || !status) {
      return res.status(400).json({ error: "Dữ liệu cập nhật số lượng lớn không hợp lệ." });
    }

    const { rowCount } = await query(
      `UPDATE orders SET status = $1, updated_at = now() WHERE id = ANY($2::text[])`,
      [status, orderIds]
    );
    return res.json({ success: true, updatedCount: rowCount ?? 0 });
  } catch (err) {
    console.error("[/api/orders/bulk-status] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
