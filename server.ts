// Dev: Vite middleware + Express bridging Vercel-style handlers in api/.
// Prod (Render/Node host): serves built dist/ + same API routes.
// Vercel deploys still use file-based serverless functions and ignore this file.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express, { type Request, type RequestHandler } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import products from "./api/products.js";
import health from "./api/health.js";
import authHandler from "./api/auth/index.js";
import teamsIndex from "./api/teams/index.js";
import teamById from "./api/teams/[id]/index.js";
import teamByToken from "./api/teams/by-token.js";
import teamPicks from "./api/teams/[id]/picks/index.js";
import teamPick from "./api/teams/[id]/picks/[pickId].js";
import teamAggregate from "./api/teams/[id]/aggregate.js";
import teamPoll from "./api/teams/[id]/poll/index.js";
import shops from "./api/shops.js";
import jerseys from "./api/jerseys.js";

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

app.get("/api/products", wrap(products));
app.post("/api/products", wrap(products));
app.put("/api/products/:id", wrap(products));
app.delete("/api/products/:id", wrap(products));

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
app.get("/api/teams/:id/poll", wrap(teamPoll));
app.post("/api/teams/:id/poll", wrap(teamPoll));
app.patch("/api/teams/:id/poll", wrap(teamPoll));
app.delete("/api/teams/:id/poll", wrap(teamPoll));

app.get("/api/shops", wrap(shops));
app.post("/api/shops", wrap(shops));
app.put("/api/shops/:id", wrap(shops));
app.delete("/api/shops/:id", wrap(shops));

app.get("/api/jerseys", wrap(jerseys));
app.post("/api/jerseys", wrap(jerseys));
app.put("/api/jerseys/:id", wrap(jerseys));
app.delete("/api/jerseys/:id", wrap(jerseys));

const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  if (isProd) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath, { index: false, maxAge: "1h" }));
    app.get(/^(?!\/api\/).+/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running at http://0.0.0.0:${PORT} (${isProd ? "production" : "dev"})`,
    );
    if (!isProd) {
      console.log(`(Vercel deploys ignore this file and use api/* as functions)`);
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start dev server:", err);
  process.exit(1);
});
