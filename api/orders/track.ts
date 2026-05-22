import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db";
import { mapOrder } from "../../lib/mappers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const raw = ((req.query.query as string) || "").trim();
    if (!raw) {
      return res.status(400).json({ error: "Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu." });
    }

    const normalizedPhone = raw.replace(/[\s\-()]/g, "");
    const upper = raw.toUpperCase();

    const { rows } = await query(
      `SELECT * FROM orders
       WHERE UPPER(order_code) = $1
          OR regexp_replace(phone, '[\\s\\-()]', '', 'g') = $2
       ORDER BY created_at DESC`,
      [upper, normalizedPhone]
    );
    return res.json(rows.map((r) => mapOrder(r as never)));
  } catch (err) {
    console.error("[/api/orders/track] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
