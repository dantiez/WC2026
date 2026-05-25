import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";
import { mapProduct, shortId } from "../lib/mappers.js";

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
  try {
    const id = (req.query.id as string | undefined)?.trim() || undefined;

    if (!id) {
      if (req.method === "GET") return await listProducts(req, res);
      if (req.method === "POST") return await createProduct(req, res);
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (req.method === "PUT") return await updateProduct(id, req, res);
    if (req.method === "DELETE") return await softDelete(id, res);
    res.setHeader("Allow", "PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/products] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listProducts(req: VercelRequest, res: VercelResponse) {
  const isAdmin = req.query.isAdmin === "true";
  const search = ((req.query.search as string) || "").trim().toLowerCase();
  const type = req.query.type as string | undefined;

  const where: string[] = [];
  const params: unknown[] = [];

  if (!isAdmin) where.push("is_active = TRUE");

  if (search) {
    params.push(`%${search}%`);
    where.push(`(LOWER(name) LIKE $${params.length} OR LOWER(team_country) LIKE $${params.length})`);
  }

  if (type && type !== "all") {
    params.push(type);
    where.push(`jersey_type = $${params.length}`);
  }

  const sql = `SELECT * FROM products ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at ASC`;
  const { rows } = await query(sql, params);
  return res.json(rows.map((r) => mapProduct(r as never)));
}

async function createProduct(req: VercelRequest, res: VercelResponse) {
  const body = req.body ?? {};
  if (!body.name || !body.teamCountry || !body.price) {
    return res.status(400).json({ error: "Thừa thiếu thông tin sản phẩm. Tên, Quốc gia và Giá là bắt buộc." });
  }

  const id = shortId("prod");
  const imageUrl =
    body.imageUrl || `https://placehold.co/400x500/111/FFD700?text=${encodeURIComponent(body.name)}`;

  const { rows } = await query(
    `INSERT INTO products (id, name, team_country, jersey_type, glb_url, image_url, price, stock, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      body.name,
      body.teamCountry,
      body.jerseyType || "home",
      body.glbUrl ?? null,
      imageUrl,
      Number(body.price),
      Number(body.stock) || 0,
      body.isActive !== undefined ? Boolean(body.isActive) : true,
    ]
  );

  return res.status(201).json(mapProduct(rows[0] as never));
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
