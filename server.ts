// Local development server: mounts Vite middleware + bridges the Vercel
// serverless handlers in api/ as Express routes. NOT used in production —
// Vercel runs each file under api/ as its own function.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express, { type Request, type RequestHandler } from "express";
import { createServer as createViteServer } from "vite";

import productsList from "./api/products/index.js";
import productById from "./api/products/[id].js";
import ordersList from "./api/orders/index.js";
import orderTrack from "./api/orders/track.js";
import orderBulkStatus from "./api/orders/bulk-status.js";
import orderStatus from "./api/orders/[id]/status.js";
import customers from "./api/customers.js";
import stats from "./api/stats.js";
import paymentsSimulate from "./api/payments/simulate.js";

type VercelHandler = (req: any, res: any) => unknown | Promise<unknown>;

const wrap =
  (handler: VercelHandler): RequestHandler =>
  (req, res, next) => {
    const merged = req as Request & { query: Record<string, unknown> };
    merged.query = { ...req.query, ...req.params };
    Promise.resolve(handler(merged as never, res as never)).catch(next);
  };

const PORT = Number(process.env.PORT) || 3010;
const app = express();
app.use(express.json());

app.get("/api/products", wrap(productsList));
app.post("/api/products", wrap(productsList));
app.put("/api/products/:id", wrap(productById));
app.delete("/api/products/:id", wrap(productById));

app.get("/api/orders", wrap(ordersList));
app.post("/api/orders", wrap(ordersList));
app.get("/api/orders/track", wrap(orderTrack));
app.put("/api/orders/bulk-status", wrap(orderBulkStatus));
app.put("/api/orders/:id/status", wrap(orderStatus));

app.get("/api/customers", wrap(customers));
app.get("/api/stats", wrap(stats));
app.post("/api/payments/simulate", wrap(paymentsSimulate));

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dev server running at http://0.0.0.0:${PORT}`);
    console.log(`(production uses Vercel serverless functions — this file is dev-only)`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start dev server:", err);
  process.exit(1);
});
