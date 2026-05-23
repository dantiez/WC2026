import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readCaptainClaims } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const claims = readCaptainClaims(req);
  if (!claims) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, email: claims.email });
}
