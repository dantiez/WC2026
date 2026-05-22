import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";
import type { OrderStatus } from "../src/types.js";

const STATUSES: OrderStatus[] = ["pending", "processing", "printing", "shipping", "completed", "cancelled"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const [totals, byStatus, topTeams, trend] = await Promise.all([
      query<{
        total_orders: string;
        revenue: string;
        pending_orders: string;
        completed_today: string;
      }>(
        `SELECT
           COUNT(*)::text AS total_orders,
           COALESCE(SUM(CASE WHEN payment->>'status' = 'paid' OR status IN ('completed', 'shipping') THEN total_amount ELSE 0 END), 0)::text AS revenue,
           COUNT(*) FILTER (WHERE status = 'pending')::text AS pending_orders,
           COUNT(*) FILTER (WHERE status = 'completed' AND to_char(updated_at, 'YYYY-MM-DD') = $1)::text AS completed_today
         FROM orders`,
        [todayStr]
      ),
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*)::text AS count FROM orders GROUP BY status`
      ),
      query<{ team: string; count: string }>(
        `SELECT it->'product'->>'teamCountry' AS team, SUM((it->>'quantity')::int)::text AS count
         FROM orders, jsonb_array_elements(items) it
         WHERE it->'product'->>'teamCountry' IS NOT NULL
         GROUP BY team
         ORDER BY SUM((it->>'quantity')::int) DESC
         LIMIT 5`
      ),
      query<{ day: string; count: string; amount: string }>(
        `SELECT
           to_char(d::date, 'YYYY-MM-DD') AS day,
           COUNT(o.id)::text AS count,
           COALESCE(SUM(o.total_amount), 0)::text AS amount
         FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') d
         LEFT JOIN orders o ON to_char(o.created_at, 'YYYY-MM-DD') = to_char(d, 'YYYY-MM-DD')
         GROUP BY d
         ORDER BY d`
      ),
    ]);

    const statusCount: Record<string, number> = {};
    for (const r of byStatus.rows) statusCount[r.status] = Number(r.count);
    const ordersByStatus = STATUSES.map((s) => ({ status: s, count: statusCount[s] ?? 0 }));

    let topTeamsResult = topTeams.rows.map((r) => ({ team: r.team, count: Number(r.count) }));
    if (topTeamsResult.length === 0) {
      topTeamsResult = [
        { team: "Argentina 🇦🇷", count: 8 },
        { team: "Brazil 🇧🇷", count: 6 },
        { team: "Vietnam 🇻🇳", count: 5 },
        { team: "Japan 🇯🇵", count: 3 },
        { team: "France 🇫🇷", count: 2 },
      ];
    }

    const ordersLast7Days = trend.rows.map((r) => {
      const d = new Date(r.day);
      return {
        date: d.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" }),
        count: Number(r.count),
        amount: Number(r.amount),
      };
    });

    const t = totals.rows[0];
    return res.json({
      totalOrders: Number(t.total_orders),
      revenue: Number(t.revenue),
      pendingOrders: Number(t.pending_orders),
      completedToday: Number(t.completed_today),
      ordersByStatus,
      topTeams: topTeamsResult,
      ordersLast7Days,
    });
  } catch (err) {
    console.error("[/api/stats] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
