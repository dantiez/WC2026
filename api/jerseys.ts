import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../lib/db.js";
import { mapShopJersey, shortId, type ShopJerseyRow } from "../lib/mappers.js";
import { requireCaptain } from "./_lib/auth.js";

const CAMEL_TO_SNAKE: Record<string, string> = {
  shopId: "shop_id",
  name: "name",
  imageUrl: "image_url",
  isActive: "is_active",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const id = (req.query.id as string | undefined)?.trim() || undefined;

    if (!id) {
      if (req.method === "GET") return await listJerseys(req, res);
      if (req.method === "POST") {
        if (!requireCaptain(req, res)) return;
        return await createJersey(req, res);
      }
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!requireCaptain(req, res)) return;
    if (req.method === "PUT") return await updateJersey(id, req, res);
    if (req.method === "DELETE") return await deleteJersey(id, res);

    res.setHeader("Allow", "PUT, DELETE");
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
  // Public list cached at the edge (admin view always bypasses for fresh data).
  if (!isAdmin) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    );
  }
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

async function updateJersey(id: string, req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of Object.entries(CAMEL_TO_SNAKE)) {
    const value = body[key];
    if (value === undefined) continue;
    if (
      (key === "name" || key === "imageUrl" || key === "shopId") &&
      typeof value === "string" &&
      value.trim() === ""
    ) {
      return res.status(400).json({ error: `Trường ${key} không được trống.` });
    }
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }

  if (sets.length === 0) {
    const { rows } = await query<ShopJerseyRow>(
      `SELECT * FROM shop_jerseys WHERE id = $1`,
      [id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy áo." });
    return res.json(mapShopJersey(rows[0]));
  }

  params.push(id);
  const { rows } = await query<ShopJerseyRow>(
    `UPDATE shop_jerseys SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy áo." });
  return res.json(mapShopJersey(rows[0]));
}

async function deleteJersey(id: string, res: VercelResponse) {
  const { rows: refs } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM team_picks WHERE jersey_id = $1`,
    [id],
  );
  if (Number(refs[0].count) > 0) {
    const { rows } = await query<ShopJerseyRow>(
      `UPDATE shop_jerseys SET is_active = FALSE WHERE id = $1 RETURNING *`,
      [id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy áo." });
    return res.json({ ok: true, softDeleted: true, jersey: mapShopJersey(rows[0]) });
  }

  const { rowCount } = await query(`DELETE FROM shop_jerseys WHERE id = $1`, [id]);
  if (!rowCount) return res.status(404).json({ error: "Không tìm thấy áo." });
  return res.json({ ok: true, softDeleted: false });
}
