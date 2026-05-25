import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import { mapShop, shortId, type ShopRow } from "../../lib/mappers.js";
import { requireCaptain } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();

    if (req.method === "GET") return await listShops(res);
    if (req.method === "POST") {
      if (!requireCaptain(req, res)) return;
      return await createShop(req, res);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/shops] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listShops(res: VercelResponse) {
  const { rows } = await query<ShopRow>(
    `SELECT * FROM shops ORDER BY created_at ASC`,
  );
  return res.json(rows.map(mapShop));
}

async function createShop(req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Tên shop không được trống." });

  const id = shortId("shop");
  const { rows } = await query<ShopRow>(
    `INSERT INTO shops (id, name) VALUES ($1, $2) RETURNING *`,
    [id, name],
  );
  return res.status(201).json(mapShop(rows[0]));
}
