import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { env } from "../config/env";
import { prisma } from "../db/prisma";

export interface AccessPayload {
  sub: string;
  role: "USER" | "ADMIN";
}

export function signAccessToken(userId: string, role: "USER" | "ADMIN"): string {
  return jwt.sign({ sub: userId, role }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;
  return { sub: String(decoded.sub), role: (decoded.role as "USER" | "ADMIN") ?? "USER" };
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Refresh tokens are opaque random strings; only their hash is stored, so a DB
// leak does not expose usable tokens. Not derived from the JWT secret.
export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  );
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt },
  });
  return raw;
}

export async function rotateRefreshToken(
  raw: string,
): Promise<{ userId: string; token: string } | null> {
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!existing || existing.expiresAt < new Date()) {
    if (existing) {
      await prisma.refreshToken.delete({ where: { id: existing.id } }).catch(() => {});
    }
    return null;
  }
  // Single-use rotation: delete the old, mint a new one.
  await prisma.refreshToken.delete({ where: { id: existing.id } });
  const token = await issueRefreshToken(existing.userId);
  return { userId: existing.userId, token };
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  await prisma.refreshToken
    .delete({ where: { tokenHash: hashToken(raw) } })
    .catch(() => {});
}
