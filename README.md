# WC2026 Jersey Customizer

App full-stack: React 19 + Vite (frontend) + Vercel serverless functions ở `api/` (backend) + Postgres (DB).

## 1. Yêu cầu

- Node.js 18+ (khuyên 20+)
- Một Postgres instance — local (Docker) hoặc managed (Neon / Supabase / Vercel Postgres). Hướng dẫn ở mục 3.

## 2. Cài đặt

```bash
npm install
cp .env.example .env.local
# sau đó điền DATABASE_URL + GEMINI_API_KEY vào .env.local
```

## 3. Setup Postgres

Schema (2 bảng: `products`, `orders`) và seed 20 sản phẩm mặc định được **tự tạo** lần đầu API chạy — không cần migration thủ công. Bạn chỉ cần cung cấp một connection string.

### Cách A — Docker local (nhanh nhất cho dev)

```bash
docker run -d --name wc2026-pg \
  -p 5544:5432 \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=wc2026 \
  postgres:16-alpine
```

Trong `.env.local`:

```
DATABASE_URL=postgresql://postgres:test@localhost:5544/wc2026
```

Stop / xóa khi không cần:

```bash
docker rm -f wc2026-pg
```

### Cách B — Postgres managed (free tier)

Chọn 1 trong các provider này (đều có free tier, cho ra connection string sẵn sàng dùng):

| Provider | Free tier | Connection string |
| --- | --- | --- |
| **Neon** ([neon.tech](https://neon.tech)) | Không giới hạn thời gian, 0.5 GB storage | Dashboard → Project → **Connection Details** → copy `Connection string` |
| **Supabase** ([supabase.com](https://supabase.com)) | 500 MB, pause sau 7d không dùng | Project Settings → Database → **Transaction pooler URI** |
| **Vercel Postgres** | Tích hợp sẵn Vercel (Neon-backed) | Vercel dashboard → Storage → Create → Postgres → tự inject `DATABASE_URL` vào project |

Dán URL vào `.env.local`. **Lưu ý: connection string phải có `?sslmode=require`** với managed Postgres (Neon/Supabase tự thêm sẵn).

### Cách C — Postgres tự cài (Homebrew / pgAdmin)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb wc2026
```

Trong `.env.local`:

```
DATABASE_URL=postgresql://$(whoami)@localhost:5432/wc2026
PGSSL=false
```

## 4. Chạy local

```bash
npm run dev
```

Mở http://localhost:3010. Vite middleware serve frontend (HMR bật sẵn), Express ở `server.ts` bridge các handler trong `api/` thành route — **giả lập** đúng môi trường Vercel serverless production.

Lần đầu request `/api/products`, schema + seed tự chạy. Có thể mất 1–2 giây cho lần đầu.

### Scripts

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Dev server + HMR (port 3010) |
| `npm run build` | Vite build → `dist/` (chỉ frontend; backend không cần build, chạy qua Vercel functions) |
| `npm run lint` | TypeScript type check |
| `npm run clean` | Xóa `dist/` + `.vercel/output` |

## 5. Connect DB bằng SQL client

Dùng client (TablePlus / DBeaver / pgAdmin / psql) với cùng `DATABASE_URL`.

**Local Docker:**
```
Host:     localhost
Port:     5544
User:     postgres
Password: test
DB:       wc2026
```

**Managed (Neon/Supabase/Vercel):** parse từ connection string — `postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`.

Hai bảng chính:

- `products` — danh sách áo đấu (id, name, team_country, jersey_type, price, stock, is_active, image_url, …)
- `orders` — đơn hàng (id, order_code, customer_name, phone, status, total_amount, **items** JSONB, **payment** JSONB, …)

`items` và `payment` lưu dạng JSONB (snapshot tại thời điểm đặt) để giữ giá / thông tin product không bị ảnh hưởng khi sản phẩm được sửa sau này.

## 6. Deploy lên Vercel

1. **Provision Postgres production** — chọn 1 trong 3 provider ở mục 3-B.
2. Push code lên Git (GitHub/GitLab/Bitbucket).
3. Vercel dashboard → **Add New Project** → import repo.
4. **Environment Variables** — thêm:
   - `DATABASE_URL` = connection string production (có `?sslmode=require`)
   - `GEMINI_API_KEY` = key Gemini của bạn
5. **Deploy.** Vercel tự:
   - Detect framework Vite → build `dist/`
   - Discover 9 file trong `api/` → tạo 9 serverless functions
   - Áp `vercel.json` rewrite cho SPA routing
6. Lần đầu mở app sẽ tự tạo bảng + seed sản phẩm.

Nếu dùng Vercel Postgres, bước 1 và 4 (set `DATABASE_URL`) được Vercel tự xử lý — chỉ cần bấm Connect.

## 7. Cấu trúc project

```
api/                  Vercel serverless functions (one per route group)
  products/
    index.ts          GET list, POST create
    [id].ts           PUT update, DELETE soft-delete
  orders/
    index.ts          GET admin list, POST create (transaction + stock lock)
    track.ts          GET by orderCode/phone
    bulk-status.ts    PUT bulk update
    [id]/status.ts    PUT single status / paymentStatus
  payments/
    simulate.ts       POST simulate IPN
  customers.ts        GET aggregate from orders
  stats.ts            GET dashboard
lib/
  db.ts               pg Pool singleton + lazy ensureSchema()
  schema.ts           DDL + idempotent product seed
  mappers.ts          DB row ↔ API shape
src/                  React app (entry: src/main.tsx)
public/images/        Static jersey PNGs (copy vào dist/images khi build)
server.ts             Local dev only — Express adapter mounts api/ handlers
vercel.json           Framework + SPA rewrite config
```

## 8. Troubleshooting

- **`DATABASE_URL is not set`** → chưa điền vào `.env.local` (dev) hoặc Vercel env (prod).
- **`SSL/TLS required` / `connection requires SSL`** → managed Postgres bắt SSL, thêm `?sslmode=require` vào URL.
- **Connection refused localhost:5544** → container Postgres chưa chạy. `docker ps` kiểm tra; restart bằng `docker start wc2026-pg`.
- **Ảnh sản phẩm không hiển thị sau deploy** → check `GET /api/products` trên prod URL trả về 20 sản phẩm. Nếu trả HTML/404 nghĩa là `DATABASE_URL` chưa set hoặc functions chưa được Vercel detect.
