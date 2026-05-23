import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as jsonwebtokenNs from "jsonwebtoken";
import { parse as parseCookies, serialize as serializeCookie } from "cookie";

type JwtModule = {
  sign: (payload: object, secret: string, opts?: { expiresIn?: number }) => string;
  verify: (token: string, secret: string) => unknown;
};

const jwt: JwtModule =
  ((jsonwebtokenNs as unknown as { default?: JwtModule }).default ??
    (jsonwebtokenNs as unknown as JwtModule));

const COOKIE_NAME = "wc2026_captain";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface CaptainClaims {
  email: string;
  iat?: number;
  exp?: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is not set or too short (need ≥16 chars).");
  }
  return secret;
}

export function signCaptainToken(email: string): string {
  return jwt.sign({ email }, getSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyCaptainToken(token: string): CaptainClaims {
  return jwt.verify(token, getSecret()) as CaptainClaims;
}

export function setCaptainCookie(res: VercelResponse, token: string): void {
  const cookie = serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearCaptainCookie(res: VercelResponse): void {
  const cookie = serializeCookie(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function readCaptainClaims(req: VercelRequest): CaptainClaims | null {
  const header = req.headers.cookie;
  if (!header) return null;
  const cookies = parseCookies(header);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return verifyCaptainToken(token);
  } catch {
    return null;
  }
}

export function requireCaptain(req: VercelRequest, res: VercelResponse): CaptainClaims | null {
  const claims = readCaptainClaims(req);
  if (!claims) {
    res.status(401).json({ error: "Yêu cầu đăng nhập captain." });
    return null;
  }
  return claims;
}
