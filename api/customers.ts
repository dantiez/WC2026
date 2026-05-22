import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db";

type Row = {
  phone: string;
  name: string;
  total_orders: string;
  total_spent: string;
  first_order_date: Date;
  last_order_date: Date;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const search = ((req.query.search as string) || "").trim().toLowerCase();
    const params: unknown[] = [];
    let where = "";
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE LOWER(customer_name) LIKE $1 OR phone LIKE $1`;
    }

    const sql = `
      SELECT
        TRIM(phone) AS phone,
        MAX(customer_name) AS name,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_spent,
        MIN(created_at) AS first_order_date,
        MAX(created_at) AS last_order_date
      FROM orders
      ${where}
      GROUP BY TRIM(phone)
      ORDER BY last_order_date DESC
    `;
    const { rows } = await query<Row>(sql, params);

    return res.json(
      rows.map((r) => ({
        phone: r.phone,
        name: r.name,
        totalOrders: Number(r.total_orders),
        totalSpent: Number(r.total_spent),
        firstOrderDate: r.first_order_date.toISOString(),
        lastOrderDate: r.last_order_date.toISOString(),
      }))
    );
  } catch (err) {
    console.error("[/api/customers] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
