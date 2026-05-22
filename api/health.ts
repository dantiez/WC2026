import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rawQuery } from "../lib/db.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.DATABASE_URL ?? "";
  let host: string | null = null;
  try {
    if (url) host = new URL(url).hostname;
  } catch {
    host = "<invalid-url>";
  }

  try {
    const { rows } = await rawQuery<{ now: string }>("SELECT NOW()::text AS now");
    return res.json({
      ok: true,
      databaseUrlSet: Boolean(url),
      host,
      now: rows[0].now,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      ok: false,
      databaseUrlSet: Boolean(url),
      host,
      error: message,
    });
  }
}
