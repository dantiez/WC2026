import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getPool } from "../../lib/db";
import { mapOrder, mapProduct, shortId } from "../../lib/mappers";
import type { OrderItem, Payment } from "../../src/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    if (req.method === "GET") return await listOrders(req, res);
    if (req.method === "POST") return await createOrder(req, res);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/orders] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listOrders(req: VercelRequest, res: VercelResponse) {
  const search = ((req.query.search as string) || "").trim().toLowerCase();
  const status = req.query.status as string | undefined;
  const paymentMethod = req.query.paymentMethod as string | undefined;

  const where: string[] = [];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(
      `(LOWER(order_code) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR phone LIKE $${params.length} OR EXISTS (SELECT 1 FROM jsonb_array_elements(items) it WHERE LOWER(it->>'nickname') LIKE $${params.length}))`
    );
  }

  if (status && status !== "all") {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  if (paymentMethod && paymentMethod !== "all") {
    params.push(paymentMethod);
    where.push(`payment->>'method' = $${params.length}`);
  }

  const sql = `SELECT * FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC`;
  const { rows } = await getPool().query(sql, params);
  return res.json(rows.map((r) => mapOrder(r as never)));
}

async function createOrder(req: VercelRequest, res: VercelResponse) {
  const { customerName, phone, address, notes, paymentMethod, items } = req.body ?? {};

  if (!customerName || !phone || !address || !items || !items.length) {
    return res.status(400).json({ error: "Thông tin đơn hàng không hợp lệ. Vui lòng nhập đầy đủ thông tin gửi hàng." });
  }

  const orderId = shortId("ord");
  const orderCode = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const totalQty = items.reduce((sum: number, it: { quantity?: number }) => sum + (Number(it.quantity) || 1), 0);
  const isTeamDiscount = totalQty >= 20;

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const productIds = items.map((it: { productId: string }) => it.productId);
    const { rows: productRows } = await client.query(
      `SELECT * FROM products WHERE id = ANY($1::text[]) FOR UPDATE`,
      [productIds]
    );
    const productMap = new Map(productRows.map((r) => [r.id as string, r]));

    let totalAmount = 0;
    const resolvedItems: OrderItem[] = [];

    for (const item of items) {
      const row = productMap.get(item.productId);
      if (!row) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Không tìm thấy mẫu áo phối hợp (ID: ${item.productId})` });
      }
      const quantity = Number(item.quantity) || 1;
      if (Number(row.stock) < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Sản phẩm ${row.name} chỉ còn ${row.stock} trong kho.` });
      }

      await client.query(
        `UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2`,
        [quantity, row.id]
      );

      const originalPrice = Number(row.price);
      const unitPrice = isTeamDiscount ? Math.round(originalPrice * 0.85) : originalPrice;
      const subtotal = unitPrice * quantity;
      totalAmount += subtotal;

      const productSnapshot = mapProduct({ ...row, stock: Number(row.stock) - quantity });

      resolvedItems.push({
        id: shortId("item"),
        orderId,
        productId: item.productId,
        product: productSnapshot,
        nickname: (item.nickname || "").toUpperCase(),
        jerseyNumber: Number(item.jerseyNumber) || 10,
        size: item.size || "M",
        colorHex: item.colorHex || "#ffffff",
        quantity,
        unitPrice,
      });
    }

    const payment: Payment = {
      id: shortId("pay"),
      orderId,
      method: paymentMethod || "cod",
      status: "pending",
      amount: totalAmount,
      createdAt: new Date().toISOString(),
    };

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (id, order_code, customer_name, phone, address, notes, status, total_amount, items, payment)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8::jsonb, $9::jsonb)
       RETURNING *`,
      [
        orderId,
        orderCode,
        customerName,
        phone,
        address,
        notes ?? null,
        totalAmount,
        JSON.stringify(resolvedItems),
        JSON.stringify(payment),
      ]
    );

    await client.query("COMMIT");
    return res.status(201).json(mapOrder(orderRows[0] as never));
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
