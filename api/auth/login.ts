import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as bcryptjsNs from "bcryptjs";
import { setCaptainCookie, signCaptainToken } from "../_lib/auth.js";

type BcryptModule = { compare: (data: string, hash: string) => Promise<boolean> };
const bcrypt: BcryptModule =
  ((bcryptjsNs as unknown as { default?: BcryptModule }).default ??
    (bcryptjsNs as unknown as BcryptModule));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
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
  } catch (err) {
    console.error("[/api/auth/login] error", err);
    return res.status(500).json({ error: "Lỗi server, thử lại sau." });
  }
}
