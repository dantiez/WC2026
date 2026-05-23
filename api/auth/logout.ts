import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCaptainCookie } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  clearCaptainCookie(res);
  return res.json({ ok: true });
}
