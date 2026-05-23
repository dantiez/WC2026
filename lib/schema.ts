import type { Pool } from "pg";

const DDL = `
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  team_country  TEXT NOT NULL,
  jersey_type   TEXT NOT NULL,
  glb_url       TEXT,
  image_url     TEXT NOT NULL,
  price         NUMERIC NOT NULL,
  stock         INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_active_type_idx ON products (is_active, jersey_type);

CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  order_code    TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address       TEXT NOT NULL,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  total_amount  NUMERIC NOT NULL,
  items         JSONB NOT NULL,
  payment       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_phone_idx       ON orders (phone);
CREATE INDEX IF NOT EXISTS orders_status_idx      ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx  ON orders (created_at DESC);
`;

type SeedProduct = {
  id: string;
  name: string;
  team_country: string;
  jersey_type: "home" | "away" | "third";
  glb_url: string | null;
  image_url: string;
  price: number;
  stock: number;
};

const SEED_PRODUCTS: SeedProduct[] = [
  { id: "prod-arg-home", name: "Argentina Home Jersey 2026", team_country: "Argentina 🇦🇷", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1551279880-03041531948f?w=500&auto=format&fit=crop&q=60", price: 420000, stock: 45 },
  { id: "prod-arg-away", name: "Argentina Away Jersey 2026", team_country: "Argentina 🇦🇷", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop&q=60", price: 390000, stock: 30 },
  { id: "prod-bra-home", name: "Brazil Home Jersey 2026", team_country: "Brazil 🇧🇷", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60", price: 420000, stock: 50 },
  { id: "prod-bra-away", name: "Brazil Away Jersey 2026", team_country: "Brazil 🇧🇷", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=500&auto=format&fit=crop&q=60", price: 390000, stock: 25 },
  { id: "prod-fra-home", name: "France Home Jersey 2026", team_country: "France 🇫🇷", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&auto=format&fit=crop&q=60", price: 450000, stock: 35 },
  { id: "prod-fra-away", name: "France Away Jersey 2026", team_country: "France 🇫🇷", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&auto=format&fit=crop&q=60", price: 420000, stock: 20 },
  { id: "prod-ger-home", name: "Germany Home Jersey 2026", team_country: "Germany 🇩🇪", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=500&auto=format&fit=crop&q=60", price: 410000, stock: 30 },
  { id: "prod-ger-away", name: "Germany Away Jersey 2026", team_country: "Germany 🇩🇪", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=500&auto=format&fit=crop&q=60", price: 390000, stock: 15 },
  { id: "prod-jap-home", name: "Japan Home Jersey 2026", team_country: "Japan 🇯🇵", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60", price: 430000, stock: 40 },
  { id: "prod-jap-away", name: "Japan Away Jersey 2026", team_country: "Japan 🇯🇵", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=500&auto=format&fit=crop&q=60", price: 400000, stock: 30 },
  { id: "prod-eng-home", name: "England Home Jersey 2026", team_country: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=60", price: 410000, stock: 32 },
  { id: "prod-eng-away", name: "England Away Jersey 2026", team_country: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=500&auto=format&fit=crop&q=60", price: 380000, stock: 22 },
  { id: "prod-spa-home", name: "Spain Home Jersey 2026", team_country: "Spain 🇪🇸", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=500&auto=format&fit=crop&q=60", price: 430000, stock: 30 },
  { id: "prod-spa-away", name: "Spain Away Jersey 2026", team_country: "Spain 🇪🇸", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=500&auto=format&fit=crop&q=60", price: 400000, stock: 18 },
  { id: "prod-por-home", name: "Portugal Home Jersey 2026", team_country: "Portugal 🇵🇹", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=60", price: 420000, stock: 45 },
  { id: "prod-por-away", name: "Portugal Away Jersey 2026", team_country: "Portugal 🇵🇹", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1553126593-7036cd0a382e?w=500&auto=format&fit=crop&q=60", price: 390000, stock: 28 },
  { id: "prod-kor-home", name: "South Korea Home Jersey 2026", team_country: "South Korea 🇰🇷", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=60", price: 430000, stock: 30 },
  { id: "prod-kor-away", name: "South Korea Away Jersey 2026", team_country: "South Korea 🇰🇷", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=500&auto=format&fit=crop&q=60", price: 400000, stock: 20 },
  { id: "prod-vie-home", name: "Vietnam Home Jersey 2026", team_country: "Vietnam 🇻🇳", jersey_type: "home", glb_url: null, image_url: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=500&auto=format&fit=crop&q=60", price: 350000, stock: 120 },
  { id: "prod-vie-away", name: "Vietnam Away Jersey 2026", team_country: "Vietnam 🇻🇳", jersey_type: "away", glb_url: null, image_url: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=500&auto=format&fit=crop&q=60", price: 350000, stock: 80 },
];

export async function initSchema(pool: Pool): Promise<void> {
  await pool.query(DDL);
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
  if (Number(rows[0].count) > 0) return;

  const values: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  for (const p of SEED_PRODUCTS) {
    values.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
    params.push(p.id, p.name, p.team_country, p.jersey_type, p.glb_url, p.image_url, p.price, p.stock);
  }
  await pool.query(
    `INSERT INTO products (id, name, team_country, jersey_type, glb_url, image_url, price, stock)
     VALUES ${values.join(", ")}
     ON CONFLICT (id) DO NOTHING`,
    params
  );
}
