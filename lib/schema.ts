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

CREATE TABLE IF NOT EXISTS team_sessions (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  captain_email       TEXT NOT NULL,
  share_token         TEXT UNIQUE NOT NULL,
  default_product_id  TEXT REFERENCES products(id),
  deadline_at         TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','locked')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_sessions_token_idx   ON team_sessions (share_token);
CREATE INDEX IF NOT EXISTS team_sessions_captain_idx ON team_sessions (captain_email);

CREATE TABLE IF NOT EXISTS team_picks (
  id             TEXT PRIMARY KEY,
  team_id        TEXT NOT NULL REFERENCES team_sessions(id) ON DELETE CASCADE,
  member_name    TEXT NOT NULL,
  member_token   TEXT NOT NULL,
  jersey_id      TEXT NOT NULL REFERENCES products(id),
  size           TEXT NOT NULL,
  jersey_number  TEXT,
  nickname       TEXT,
  accent_color   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_picks_team_idx  ON team_picks (team_id);
CREATE INDEX IF NOT EXISTS team_picks_token_idx ON team_picks (team_id, member_token);
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

  // Host nations (CONCACAF)
  { id: "prod-usa-home", name: "USA Home Jersey 2026",       team_country: "USA 🇺🇸",        jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/0a3161/ffffff?text=USA+Home",       price: 430000, stock: 40 },
  { id: "prod-usa-away", name: "USA Away Jersey 2026",       team_country: "USA 🇺🇸",        jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/b22234/ffffff?text=USA+Away",       price: 400000, stock: 25 },
  { id: "prod-can-home", name: "Canada Home Jersey 2026",    team_country: "Canada 🇨🇦",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/d52b1e/ffffff?text=Canada+Home",    price: 420000, stock: 30 },
  { id: "prod-can-away", name: "Canada Away Jersey 2026",    team_country: "Canada 🇨🇦",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/d52b1e?text=Canada+Away",    price: 390000, stock: 20 },
  { id: "prod-mex-home", name: "Mexico Home Jersey 2026",    team_country: "Mexico 🇲🇽",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/006847/ffffff?text=Mexico+Home",    price: 430000, stock: 45 },
  { id: "prod-mex-away", name: "Mexico Away Jersey 2026",    team_country: "Mexico 🇲🇽",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ce1126/ffffff?text=Mexico+Away",    price: 400000, stock: 25 },

  // UEFA additions
  { id: "prod-ita-home", name: "Italy Home Jersey 2026",       team_country: "Italy 🇮🇹",       jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/008c45/ffffff?text=Italy+Home",       price: 430000, stock: 35 },
  { id: "prod-ita-away", name: "Italy Away Jersey 2026",       team_country: "Italy 🇮🇹",       jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/008c45?text=Italy+Away",       price: 400000, stock: 22 },
  { id: "prod-ned-home", name: "Netherlands Home Jersey 2026", team_country: "Netherlands 🇳🇱", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ff6600/ffffff?text=Netherlands+Home", price: 420000, stock: 30 },
  { id: "prod-ned-away", name: "Netherlands Away Jersey 2026", team_country: "Netherlands 🇳🇱", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/21468b/ffffff?text=Netherlands+Away", price: 390000, stock: 20 },
  { id: "prod-bel-home", name: "Belgium Home Jersey 2026",     team_country: "Belgium 🇧🇪",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/c8102e/ffffff?text=Belgium+Home",     price: 410000, stock: 28 },
  { id: "prod-bel-away", name: "Belgium Away Jersey 2026",     team_country: "Belgium 🇧🇪",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/fdda24/000000?text=Belgium+Away",     price: 390000, stock: 18 },
  { id: "prod-cro-home", name: "Croatia Home Jersey 2026",     team_country: "Croatia 🇭🇷",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/c8102e/ffffff?text=Croatia+Home",     price: 420000, stock: 30 },
  { id: "prod-cro-away", name: "Croatia Away Jersey 2026",     team_country: "Croatia 🇭🇷",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/171796/ffffff?text=Croatia+Away",     price: 390000, stock: 20 },
  { id: "prod-sui-home", name: "Switzerland Home Jersey 2026", team_country: "Switzerland 🇨🇭", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/d52b1e/ffffff?text=Switzerland+Home", price: 410000, stock: 25 },
  { id: "prod-sui-away", name: "Switzerland Away Jersey 2026", team_country: "Switzerland 🇨🇭", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/d52b1e?text=Switzerland+Away", price: 390000, stock: 18 },
  { id: "prod-den-home", name: "Denmark Home Jersey 2026",     team_country: "Denmark 🇩🇰",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/c8102e/ffffff?text=Denmark+Home",     price: 410000, stock: 25 },
  { id: "prod-den-away", name: "Denmark Away Jersey 2026",     team_country: "Denmark 🇩🇰",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/c8102e?text=Denmark+Away",     price: 390000, stock: 18 },
  { id: "prod-aut-home", name: "Austria Home Jersey 2026",     team_country: "Austria 🇦🇹",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ef3340/ffffff?text=Austria+Home",     price: 400000, stock: 22 },
  { id: "prod-aut-away", name: "Austria Away Jersey 2026",     team_country: "Austria 🇦🇹",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/ef3340?text=Austria+Away",     price: 380000, stock: 15 },
  { id: "prod-pol-home", name: "Poland Home Jersey 2026",      team_country: "Poland 🇵🇱",      jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/dc143c?text=Poland+Home",      price: 400000, stock: 25 },
  { id: "prod-pol-away", name: "Poland Away Jersey 2026",      team_country: "Poland 🇵🇱",      jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/dc143c/ffffff?text=Poland+Away",      price: 380000, stock: 18 },
  { id: "prod-ukr-home", name: "Ukraine Home Jersey 2026",     team_country: "Ukraine 🇺🇦",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ffd700/0057b7?text=Ukraine+Home",     price: 410000, stock: 25 },
  { id: "prod-ukr-away", name: "Ukraine Away Jersey 2026",     team_country: "Ukraine 🇺🇦",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/0057b7/ffd700?text=Ukraine+Away",     price: 390000, stock: 18 },
  { id: "prod-hun-home", name: "Hungary Home Jersey 2026",     team_country: "Hungary 🇭🇺",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/c8102e/ffffff?text=Hungary+Home",     price: 390000, stock: 20 },
  { id: "prod-hun-away", name: "Hungary Away Jersey 2026",     team_country: "Hungary 🇭🇺",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/477050?text=Hungary+Away",     price: 370000, stock: 15 },
  { id: "prod-tur-home", name: "Turkey Home Jersey 2026",      team_country: "Turkey 🇹🇷",      jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/e30a17/ffffff?text=Turkey+Home",      price: 410000, stock: 25 },
  { id: "prod-tur-away", name: "Turkey Away Jersey 2026",      team_country: "Turkey 🇹🇷",      jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/e30a17?text=Turkey+Away",      price: 390000, stock: 18 },

  // CONMEBOL additions
  { id: "prod-uru-home", name: "Uruguay Home Jersey 2026",  team_country: "Uruguay 🇺🇾",  jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/4f9cd9/ffffff?text=Uruguay+Home",  price: 410000, stock: 25 },
  { id: "prod-uru-away", name: "Uruguay Away Jersey 2026",  team_country: "Uruguay 🇺🇾",  jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/4f9cd9?text=Uruguay+Away",  price: 390000, stock: 18 },
  { id: "prod-col-home", name: "Colombia Home Jersey 2026", team_country: "Colombia 🇨🇴", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/fcd116/0033a0?text=Colombia+Home", price: 420000, stock: 30 },
  { id: "prod-col-away", name: "Colombia Away Jersey 2026", team_country: "Colombia 🇨🇴", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ce1126/ffffff?text=Colombia+Away", price: 400000, stock: 22 },
  { id: "prod-ecu-home", name: "Ecuador Home Jersey 2026",  team_country: "Ecuador 🇪🇨",  jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ffd100/0072ce?text=Ecuador+Home",  price: 400000, stock: 22 },
  { id: "prod-ecu-away", name: "Ecuador Away Jersey 2026",  team_country: "Ecuador 🇪🇨",  jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/0072ce/ffd100?text=Ecuador+Away",  price: 380000, stock: 18 },
  { id: "prod-par-home", name: "Paraguay Home Jersey 2026", team_country: "Paraguay 🇵🇾", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/d52b1e/ffffff?text=Paraguay+Home", price: 390000, stock: 20 },
  { id: "prod-par-away", name: "Paraguay Away Jersey 2026", team_country: "Paraguay 🇵🇾", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/0038a8?text=Paraguay+Away", price: 370000, stock: 15 },

  // AFC additions
  { id: "prod-irn-home", name: "Iran Home Jersey 2026",         team_country: "Iran 🇮🇷",         jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/239f40?text=Iran+Home",         price: 410000, stock: 25 },
  { id: "prod-irn-away", name: "Iran Away Jersey 2026",         team_country: "Iran 🇮🇷",         jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/da0000/ffffff?text=Iran+Away",         price: 390000, stock: 18 },
  { id: "prod-ksa-home", name: "Saudi Arabia Home Jersey 2026", team_country: "Saudi Arabia 🇸🇦", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/006c35/ffffff?text=Saudi+Arabia+Home", price: 420000, stock: 25 },
  { id: "prod-ksa-away", name: "Saudi Arabia Away Jersey 2026", team_country: "Saudi Arabia 🇸🇦", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/006c35?text=Saudi+Arabia+Away", price: 400000, stock: 18 },
  { id: "prod-aus-home", name: "Australia Home Jersey 2026",    team_country: "Australia 🇦🇺",    jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ffcd00/006a4e?text=Australia+Home",    price: 420000, stock: 28 },
  { id: "prod-aus-away", name: "Australia Away Jersey 2026",    team_country: "Australia 🇦🇺",    jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/006a4e/ffcd00?text=Australia+Away",    price: 400000, stock: 20 },
  { id: "prod-qat-home", name: "Qatar Home Jersey 2026",        team_country: "Qatar 🇶🇦",        jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/8a1538/ffffff?text=Qatar+Home",        price: 410000, stock: 22 },
  { id: "prod-qat-away", name: "Qatar Away Jersey 2026",        team_country: "Qatar 🇶🇦",        jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/8a1538?text=Qatar+Away",        price: 390000, stock: 16 },
  { id: "prod-irq-home", name: "Iraq Home Jersey 2026",         team_country: "Iraq 🇮🇶",         jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ce1126/ffffff?text=Iraq+Home",         price: 380000, stock: 20 },
  { id: "prod-irq-away", name: "Iraq Away Jersey 2026",         team_country: "Iraq 🇮🇶",         jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/ce1126?text=Iraq+Away",         price: 360000, stock: 15 },

  // CAF (9 teams)
  { id: "prod-mar-home", name: "Morocco Home Jersey 2026",     team_country: "Morocco 🇲🇦",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/c1272d/ffffff?text=Morocco+Home",     price: 420000, stock: 35 },
  { id: "prod-mar-away", name: "Morocco Away Jersey 2026",     team_country: "Morocco 🇲🇦",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/006233?text=Morocco+Away",     price: 400000, stock: 25 },
  { id: "prod-sen-home", name: "Senegal Home Jersey 2026",     team_country: "Senegal 🇸🇳",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/00853f/ffffff?text=Senegal+Home",     price: 410000, stock: 25 },
  { id: "prod-sen-away", name: "Senegal Away Jersey 2026",     team_country: "Senegal 🇸🇳",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/00853f?text=Senegal+Away",     price: 390000, stock: 18 },
  { id: "prod-egy-home", name: "Egypt Home Jersey 2026",       team_country: "Egypt 🇪🇬",       jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ce1126/ffffff?text=Egypt+Home",       price: 400000, stock: 25 },
  { id: "prod-egy-away", name: "Egypt Away Jersey 2026",       team_country: "Egypt 🇪🇬",       jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/000000?text=Egypt+Away",       price: 380000, stock: 18 },
  { id: "prod-nga-home", name: "Nigeria Home Jersey 2026",     team_country: "Nigeria 🇳🇬",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/008753/ffffff?text=Nigeria+Home",     price: 410000, stock: 30 },
  { id: "prod-nga-away", name: "Nigeria Away Jersey 2026",     team_country: "Nigeria 🇳🇬",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/008753?text=Nigeria+Away",     price: 390000, stock: 22 },
  { id: "prod-alg-home", name: "Algeria Home Jersey 2026",     team_country: "Algeria 🇩🇿",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/006233/ffffff?text=Algeria+Home",     price: 400000, stock: 22 },
  { id: "prod-alg-away", name: "Algeria Away Jersey 2026",     team_country: "Algeria 🇩🇿",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/006233?text=Algeria+Away",     price: 380000, stock: 16 },
  { id: "prod-cmr-home", name: "Cameroon Home Jersey 2026",    team_country: "Cameroon 🇨🇲",    jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/007a5e/fcd116?text=Cameroon+Home",    price: 400000, stock: 22 },
  { id: "prod-cmr-away", name: "Cameroon Away Jersey 2026",    team_country: "Cameroon 🇨🇲",    jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ce1126/fcd116?text=Cameroon+Away",    price: 380000, stock: 16 },
  { id: "prod-civ-home", name: "Ivory Coast Home Jersey 2026", team_country: "Ivory Coast 🇨🇮", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/f77f00/009e60?text=Ivory+Coast+Home", price: 400000, stock: 22 },
  { id: "prod-civ-away", name: "Ivory Coast Away Jersey 2026", team_country: "Ivory Coast 🇨🇮", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/f77f00?text=Ivory+Coast+Away", price: 380000, stock: 16 },
  { id: "prod-tun-home", name: "Tunisia Home Jersey 2026",     team_country: "Tunisia 🇹🇳",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/e70013/ffffff?text=Tunisia+Home",     price: 390000, stock: 20 },
  { id: "prod-tun-away", name: "Tunisia Away Jersey 2026",     team_country: "Tunisia 🇹🇳",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/e70013?text=Tunisia+Away",     price: 370000, stock: 14 },
  { id: "prod-gha-home", name: "Ghana Home Jersey 2026",       team_country: "Ghana 🇬🇭",       jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/006b3f?text=Ghana+Home",       price: 400000, stock: 22 },
  { id: "prod-gha-away", name: "Ghana Away Jersey 2026",       team_country: "Ghana 🇬🇭",       jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ce1126/fcd116?text=Ghana+Away",       price: 380000, stock: 16 },

  // CONCACAF (non-host)
  { id: "prod-crc-home", name: "Costa Rica Home Jersey 2026", team_country: "Costa Rica 🇨🇷", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ce1126/ffffff?text=Costa+Rica+Home", price: 390000, stock: 20 },
  { id: "prod-crc-away", name: "Costa Rica Away Jersey 2026", team_country: "Costa Rica 🇨🇷", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/002b7f?text=Costa+Rica+Away", price: 370000, stock: 14 },
  { id: "prod-jam-home", name: "Jamaica Home Jersey 2026",    team_country: "Jamaica 🇯🇲",    jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/fed100/009b3a?text=Jamaica+Home",    price: 390000, stock: 18 },
  { id: "prod-jam-away", name: "Jamaica Away Jersey 2026",    team_country: "Jamaica 🇯🇲",    jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/000000/fed100?text=Jamaica+Away",    price: 370000, stock: 14 },
  { id: "prod-pan-home", name: "Panama Home Jersey 2026",     team_country: "Panama 🇵🇦",     jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/c8102e/ffffff?text=Panama+Home",     price: 380000, stock: 18 },
  { id: "prod-pan-away", name: "Panama Away Jersey 2026",     team_country: "Panama 🇵🇦",     jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/c8102e?text=Panama+Away",     price: 360000, stock: 14 },

  // OFC
  { id: "prod-nzl-home", name: "New Zealand Home Jersey 2026", team_country: "New Zealand 🇳🇿", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/000000/ffffff?text=New+Zealand+Home", price: 400000, stock: 18 },
  { id: "prod-nzl-away", name: "New Zealand Away Jersey 2026", team_country: "New Zealand 🇳🇿", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/000000?text=New+Zealand+Away", price: 380000, stock: 14 },

  // Inter-confederation playoff slots
  { id: "prod-bol-home", name: "Bolivia Home Jersey 2026", team_country: "Bolivia 🇧🇴", jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/007934/ffd700?text=Bolivia+Home", price: 380000, stock: 16 },
  { id: "prod-bol-away", name: "Bolivia Away Jersey 2026", team_country: "Bolivia 🇧🇴", jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffd700/007934?text=Bolivia+Away", price: 360000, stock: 12 },
  { id: "prod-nor-home", name: "Norway Home Jersey 2026",  team_country: "Norway 🇳🇴",  jersey_type: "home", glb_url: null, image_url: "https://placehold.co/400x500/ef2b2d/ffffff?text=Norway+Home",  price: 410000, stock: 22 },
  { id: "prod-nor-away", name: "Norway Away Jersey 2026",  team_country: "Norway 🇳🇴",  jersey_type: "away", glb_url: null, image_url: "https://placehold.co/400x500/ffffff/00205b?text=Norway+Away",  price: 390000, stock: 16 },
];

export async function initSchema(pool: Pool): Promise<void> {
  await pool.query(DDL);

  // Idempotent seed: ON CONFLICT DO NOTHING means existing rows keep their
  // current image_url / price / stock; only missing teams get inserted.
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
