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
import health from "./api/health.js";
import authLogin from "./api/auth/login.js";
import authLogout from "./api/auth/logout.js";
import authMe from "./api/auth/me.js";
import teamsIndex from "./api/teams/index.js";
import teamById from "./api/teams/[id]/index.js";
import teamByToken from "./api/teams/by-token.js";
import teamPicks from "./api/teams/[id]/picks/index.js";
import teamPick from "./api/teams/[id]/picks/[pickId].js";
import teamAggregate from "./api/teams/[id]/aggregate.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
app.get("/api/health", wrap(health));

app.post("/api/auth/login", wrap(authLogin));
app.post("/api/auth/logout", wrap(authLogout));
app.get("/api/auth/me", wrap(authMe));

app.get("/api/teams", wrap(teamsIndex));
app.post("/api/teams", wrap(teamsIndex));
app.get("/api/teams/by-token", wrap(teamByToken));
app.get("/api/teams/:id", wrap(teamById));
app.patch("/api/teams/:id", wrap(teamById));
app.delete("/api/teams/:id", wrap(teamById));
app.get("/api/teams/:teamId/picks", wrap(teamPicks));
app.post("/api/teams/:teamId/picks", wrap(teamPicks));
app.put("/api/teams/:teamId/picks/:pickId", wrap(teamPick));
app.delete("/api/teams/:teamId/picks/:pickId", wrap(teamPick));
app.get("/api/teams/:teamId/aggregate", wrap(teamAggregate));

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
