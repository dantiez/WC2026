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
import health from "./api/health.js";
import authHandler from "./api/auth/index.js";
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

app.get("/api/health", wrap(health));

app.get("/api/auth", wrap(authHandler));
app.post("/api/auth", wrap(authHandler));

app.get("/api/teams", wrap(teamsIndex));
app.post("/api/teams", wrap(teamsIndex));
app.get("/api/teams/by-token", wrap(teamByToken));
app.get("/api/teams/:id", wrap(teamById));
app.patch("/api/teams/:id", wrap(teamById));
app.delete("/api/teams/:id", wrap(teamById));
app.get("/api/teams/:id/picks", wrap(teamPicks));
app.post("/api/teams/:id/picks", wrap(teamPicks));
app.put("/api/teams/:id/picks/:pickId", wrap(teamPick));
app.delete("/api/teams/:id/picks/:pickId", wrap(teamPick));
app.get("/api/teams/:id/aggregate", wrap(teamAggregate));

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
