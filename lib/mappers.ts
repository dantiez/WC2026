import type { Order, OrderItem, Payment, Product } from "../src/types";

type ProductRow = {
  id: string;
  name: string;
  team_country: string;
  jersey_type: string;
  glb_url: string | null;
  image_url: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  status: string;
  total_amount: number;
  items: OrderItem[];
  payment: Payment | null;
  created_at: Date;
  updated_at: Date;
};

export function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    teamCountry: r.team_country,
    jerseyType: r.jersey_type as Product["jerseyType"],
    glbUrl: r.glb_url,
    imageUrl: r.image_url,
    price: Number(r.price),
    stock: Number(r.stock),
    isActive: r.is_active,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export function mapOrder(r: OrderRow): Order {
  return {
    id: r.id,
    orderCode: r.order_code,
    customerName: r.customer_name,
    phone: r.phone,
    address: r.address,
    notes: r.notes,
    status: r.status as Order["status"],
    totalAmount: Number(r.total_amount),
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
    items: r.items ?? [],
    payment: r.payment ?? undefined,
  };
}

export function shortId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}
