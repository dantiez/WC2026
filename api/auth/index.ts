import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRequire } from "module";
import {
  clearCaptainCookie,
  readCaptainClaims,
  setCaptainCookie,
  signCaptainToken,
} from "../_lib/auth.js";

type BcryptModule = { compare: (data: string, hash: string) => Promise<boolean> };
const requireCjs = createRequire(import.meta.url);
const bcrypt: BcryptModule = requireCjs("bcryptjs") as BcryptModule;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const action = (req.query.action as string | undefined) ?? "";

    if (req.method === "GET" && action === "me") return me(req, res);
    if (req.method === "POST" && action === "login") return await login(req, res);
    if (req.method === "POST" && action === "logout") return logout(res);

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/auth] error", err);
    return res.status(500).json({ error: "Lỗi server, thử lại sau." });
  }
}

function me(req: VercelRequest, res: VercelResponse) {
  const claims = readCaptainClaims(req);
  if (!claims) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, email: claims.email });
}

async function login(req: VercelRequest, res: VercelResponse) {
  const expectedEmail = process.env.CAPTAIN_EMAIL;
  const hash = process.env.CAPTAIN_PASSWORD_HASH;
  if (!expectedEmail || !hash) {
    return res.status(500).json({
      error: "Server chưa cấu hình CAPTAIN_EMAIL / CAPTAIN_PASSWORD_HASH.",
    });
  }

  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Thiếu email hoặc mật khẩu." });
  }

  if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) {
    return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
  }

  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
  }

  const token = signCaptainToken(expectedEmail);
  setCaptainCookie(res, token);
  return res.json({ email: expectedEmail });
}

function logout(res: VercelResponse) {
  clearCaptainCookie(res);
  return res.json({ ok: true });
}
