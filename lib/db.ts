import { Pool, types } from "pg";
import type { QueryResultRow } from "pg";

types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

declare global {
  var __pgPool: Pool | undefined;
  var __dbInitPromise: Promise<void> | undefined;
}

const PLACEHOLDER_HOSTS = new Set([
  "base",
  "host",
  "hostname",
  "your-host",
  "your-db-host",
  "your-database-host",
  "example",
  "your-project-ref",
]);

function buildPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel project → Settings → Environment Variables, then redeploy."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error(
      `DATABASE_URL is not a valid URL. Expected: postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require`
    );
  }

  const host = parsed.hostname;
  const looksLikePlaceholder =
    !host ||
    PLACEHOLDER_HOSTS.has(host.toLowerCase()) ||
    host.startsWith("[") ||
    host.startsWith("<") ||
    (!host.includes(".") && host !== "localhost" && host !== "127.0.0.1" && host !== "host.docker.internal");

  if (looksLikePlaceholder) {
    throw new Error(
      `DATABASE_URL hostname "${host}" is not a real DNS name (looks like a placeholder). ` +
        `Get a real Postgres connection string from Supabase / Neon / Vercel Postgres dashboard, ` +
        `then paste the FULL string into Vercel env vars. ` +
        `Expected format: postgresql://USER:PASSWORD@HOST.region.provider.com:PORT/DBNAME?sslmode=require`
    );
  }

  console.log(`[db] connecting to host=${host} ssl=${parsed.searchParams.get("sslmode") ?? "auto"}`);

  const needsSsl =
    /sslmode=require/i.test(connectionString) ||
    process.env.PGSSL === "true" ||
    !/localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 3,
    idleTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalThis.__pgPool) {
    globalThis.__pgPool = buildPool();
  }
  return globalThis.__pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  await ensureSchema();
  return getPool().query<T>(text, params as never);
}

export async function rawQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params as never);
}

export async function ensureSchema(): Promise<void> {
  if (!globalThis.__dbInitPromise) {
    globalThis.__dbInitPromise = (async () => {
      const { initSchema } = await import("./schema.js");
      await initSchema(getPool());
    })().catch((err) => {
      globalThis.__dbInitPromise = undefined;
      throw err;
    });
  }
  return globalThis.__dbInitPromise;
}
