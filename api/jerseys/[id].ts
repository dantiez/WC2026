import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import { mapShopJersey, type ShopJerseyRow } from "../../lib/mappers.js";
import { requireCaptain } from "../_lib/auth.js";

const CAMEL_TO_SNAKE: Record<string, string> = {
  shopId: "shop_id",
  name: "name",
  imageUrl: "image_url",
  isActive: "is_active",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    if (!requireCaptain(req, res)) return;

    const id = req.query.id as string | undefined;
    if (!id) return res.status(400).json({ error: "Thiếu jersey id." });

    if (req.method === "PUT") return await updateJersey(id, req, res);
    if (req.method === "DELETE") return await deleteJersey(id, res);

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/jerseys/:id] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateJersey(id: string, req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of Object.entries(CAMEL_TO_SNAKE)) {
    const value = body[key];
    if (value === undefined) continue;
    if ((key === "name" || key === "imageUrl" || key === "shopId") && typeof value === "string" && value.trim() === "") {
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
    // Soft-delete: keep historical picks valid but hide the jersey from selection.
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
