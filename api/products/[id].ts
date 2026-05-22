import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../../lib/db.js";
import { mapProduct } from "../../lib/mappers.js";

const CAMEL_TO_SNAKE: Record<string, string> = {
  name: "name",
  teamCountry: "team_country",
  jerseyType: "jersey_type",
  glbUrl: "glb_url",
  imageUrl: "image_url",
  price: "price",
  stock: "stock",
  isActive: "is_active",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    if (req.method === "PUT") return await updateProduct(id, req, res);
    if (req.method === "DELETE") return await softDelete(id, res);
    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/products/:id] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateProduct(id: string, req: VercelRequest, res: VercelResponse) {
  const body = req.body ?? {};
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of Object.entries(CAMEL_TO_SNAKE)) {
    if (body[key] === undefined) continue;
    params.push(body[key]);
    sets.push(`${column} = $${params.length}`);
  }

  if (sets.length === 0) {
    const { rows } = await query("SELECT * FROM products WHERE id = $1", [id]);
    if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
    return res.json(mapProduct(rows[0] as never));
  }

  sets.push(`updated_at = now()`);
  params.push(id);
  const { rows } = await query(
    `UPDATE products SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (!rows[0]) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
  return res.json(mapProduct(rows[0] as never));
}

async function softDelete(id: string, res: VercelResponse) {
  const { rowCount } = await query(
    `UPDATE products SET is_active = FALSE, updated_at = now() WHERE id = $1`,
    [id]
  );
  if (!rowCount) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
  return res.json({ success: true, message: "Sản phẩm đã được dừng hoạt động." });
}
