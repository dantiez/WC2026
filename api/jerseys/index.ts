import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import { mapShopJersey, shortId, type ShopJerseyRow } from "../../lib/mappers.js";
import { requireCaptain } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();

    if (req.method === "GET") return await listJerseys(req, res);
    if (req.method === "POST") {
      if (!requireCaptain(req, res)) return;
      return await createJersey(req, res);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/jerseys] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listJerseys(req: VercelRequest, res: VercelResponse) {
  const isAdmin = req.query.isAdmin === "true";
  const shopId = (req.query.shopId as string | undefined)?.trim();

  const where: string[] = [];
  const params: unknown[] = [];

  if (!isAdmin) where.push("is_active = TRUE");
  if (shopId) {
    params.push(shopId);
    where.push(`shop_id = $${params.length}`);
  }

  const sql = `SELECT * FROM shop_jerseys ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } ORDER BY created_at ASC`;
  const { rows } = await query<ShopJerseyRow>(sql, params);
  return res.json(rows.map(mapShopJersey));
}

async function createJersey(req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as {
    shopId?: string;
    name?: string;
    imageUrl?: string;
    isActive?: boolean;
  };

  const shopId = (body.shopId ?? "").trim();
  const name = (body.name ?? "").trim();
  const imageUrl = (body.imageUrl ?? "").trim();

  if (!shopId) return res.status(400).json({ error: "Thiếu shop." });
  if (!name) return res.status(400).json({ error: "Tên áo không được trống." });
  if (!imageUrl) return res.status(400).json({ error: "Cần ảnh áo (imageUrl)." });

  const { rows: shopRows } = await query<{ id: string }>(
    `SELECT id FROM shops WHERE id = $1`,
    [shopId],
  );
  if (shopRows.length === 0) {
    return res.status(400).json({ error: "Shop không tồn tại." });
  }

  const id = shortId("jrs");
  const { rows } = await query<ShopJerseyRow>(
    `INSERT INTO shop_jerseys (id, shop_id, name, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, shopId, name, imageUrl, body.isActive ?? true],
  );
  return res.status(201).json(mapShopJersey(rows[0]));
}
