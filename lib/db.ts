import { Pool, types } from "pg";
import type { QueryResultRow } from "pg";

types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

declare global {
  var __pgPool: Pool | undefined;
  var __dbInitPromise: Promise<void> | undefined;
}

function buildPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
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
