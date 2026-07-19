import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/http";
import { verifyAccessToken } from "../auth/tokens";

function extractToken(req: Request): string | null {
  const header = req.header("authorization");
  if (header && header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) throw new AppError(401, "errors.unauthorized");
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (e) {
    const expired = e instanceof Error && e.name === "TokenExpiredError";
    throw new AppError(401, expired ? "errors.tokenExpired" : "errors.tokenInvalid");
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.userRole !== "ADMIN") throw new AppError(403, "errors.forbidden");
  next();
}

// Attaches userId if a valid token is present but never rejects.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.userId = payload.sub;
      req.userRole = payload.role;
    } catch {
      /* ignore invalid token on optional routes */
    }
  }
  next();
}
