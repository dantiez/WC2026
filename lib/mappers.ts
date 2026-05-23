import type { Order, OrderItem, Payment, Product } from "../src/types.js";

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

export type TeamSessionRow = {
  id: string;
  name: string;
  captain_email: string;
  share_token: string;
  default_product_id: string | null;
  deadline_at: Date | null;
  status: "open" | "locked";
  created_at: Date;
  updated_at: Date;
};

export type TeamSession = {
  id: string;
  name: string;
  captainEmail: string;
  shareToken: string;
  defaultProductId: string | null;
  deadlineAt: string | null;
  status: "open" | "locked";
  createdAt: string;
  updatedAt: string;
};

export function mapTeamSession(r: TeamSessionRow): TeamSession {
  return {
    id: r.id,
    name: r.name,
    captainEmail: r.captain_email,
    shareToken: r.share_token,
    defaultProductId: r.default_product_id,
    deadlineAt: r.deadline_at ? r.deadline_at.toISOString() : null,
    status: r.status,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export type TeamPickRow = {
  id: string;
  team_id: string;
  member_name: string;
  member_token: string;
  jersey_id: string;
  size: string;
  jersey_number: string | null;
  nickname: string | null;
  accent_color: string | null;
  created_at: Date;
  updated_at: Date;
};

export type TeamPick = {
  id: string;
  teamId: string;
  memberName: string;
  jerseyId: string;
  size: string;
  jerseyNumber: string | null;
  nickname: string | null;
  accentColor: string | null;
  createdAt: string;
  updatedAt: string;
};

export function mapTeamPick(r: TeamPickRow): TeamPick {
  return {
    id: r.id,
    teamId: r.team_id,
    memberName: r.member_name,
    jerseyId: r.jersey_id,
    size: r.size,
    jerseyNumber: r.jersey_number,
    nickname: r.nickname,
    accentColor: r.accent_color,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export function randomToken(len = 22): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
