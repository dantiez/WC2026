import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, query } from "../../lib/db.js";
import { mapShop, type ShopRow } from "../../lib/mappers.js";
import { requireCaptain } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    if (!requireCaptain(req, res)) return;

    const id = req.query.id as string | undefined;
    if (!id) return res.status(400).json({ error: "Thiếu shop id." });

    if (req.method === "PUT") return await updateShop(id, req, res);
    if (req.method === "DELETE") return await deleteShop(id, res);

    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/shops/:id] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateShop(id: string, req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Tên shop không được trống." });

  const { rows } = await query<ShopRow>(
    `UPDATE shops SET name = $1 WHERE id = $2 RETURNING *`,
    [name, id],
  );
  if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy shop." });
  return res.json(mapShop(rows[0]));
}

async function deleteShop(id: string, res: VercelResponse) {
  const { rows: jerseys } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM shop_jerseys WHERE shop_id = $1`,
    [id],
  );
  if (Number(jerseys[0].count) > 0) {
    return res.status(409).json({
      error: "Shop vẫn còn áo. Hãy xoá hoặc chuyển áo trước khi xoá shop.",
    });
  }

  const { rowCount } = await query(`DELETE FROM shops WHERE id = $1`, [id]);
  if (!rowCount) return res.status(404).json({ error: "Không tìm thấy shop." });
  return res.json({ ok: true });
}
