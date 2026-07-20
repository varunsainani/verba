import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { env, LOCALES } from "../config/env";
import { t } from "../i18n/messages";
import { AppError, asyncHandler } from "../utils/http";
import { requireAuth } from "../middleware/auth";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken, signAccessToken } from "./tokens";

export const authRouter = Router();

// Throttle credential endpoints against brute-force and mass account creation.
// In-memory (best-effort per serverless instance), same approach as the widget.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: t(req.locale, "errors.rateLimited") });
  },
});

type PublicUser = {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: "USER" | "ADMIN";
};

function toPublicUser(u: {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: "USER" | "ADMIN";
}): PublicUser {
  return { id: u.id, email: u.email, name: u.name, locale: u.locale, role: u.role };
}

const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
  name: z.string().min(1).max(120),
  locale: z.enum(["en", "es", "pt"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

async function sessionResponse(userId: string, role: "USER" | "ADMIN") {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = await issueRefreshToken(userId);
  return { accessToken, refreshToken };
}

authRouter.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, "errors.emailInUse");
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: data.name,
        locale: data.locale ?? req.locale,
      },
    });
    const tokens = await sessionResponse(user.id, user.role);
    res.status(201).json({ user: toPublicUser(user), ...tokens });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const email = data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(401, "errors.invalidCredentials");
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) throw new AppError(401, "errors.invalidCredentials");
    const tokens = await sessionResponse(user.id, user.role);
    res.json({ user: toPublicUser(user), ...tokens });
  }),
);

// One-click demo login: authenticate as the seeded demo account.
authRouter.post(
  "/demo",
  asyncHandler(async (_req, res) => {
    const email = env.demoEmail.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(env.demoPassword, 10);
      user = await prisma.user.create({
        data: { email, passwordHash, name: "Demo User", locale: "en" },
      });
    }
    const tokens = await sessionResponse(user.id, user.role);
    res.json({ user: toPublicUser(user), ...tokens });
  }),
);

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) throw new AppError(401, "errors.tokenInvalid");
    const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
    if (!user) throw new AppError(401, "errors.tokenInvalid");
    const accessToken = signAccessToken(user.id, user.role);
    res.json({ user: toPublicUser(user), accessToken, refreshToken: rotated.token });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = (req.body as { refreshToken?: string })?.refreshToken;
    if (token) await revokeRefreshToken(token);
    res.status(204).end();
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError(401, "errors.tokenInvalid");
    res.json({ user: toPublicUser(user) });
  }),
);

const updateMeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  locale: z.enum(LOCALES as [string, ...string[]]).optional(),
});

authRouter.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = updateMeSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });
    res.json({ user: toPublicUser(user) });
  }),
);
