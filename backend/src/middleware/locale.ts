import { NextFunction, Request, Response } from "express";
import { DEFAULT_LOCALE, Locale, LOCALES } from "../config/env";

function pick(value: string | undefined): Locale | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  for (const loc of LOCALES) {
    if (lower.startsWith(loc)) return loc;
  }
  return null;
}

// Resolve request locale from the explicit X-Locale header, then Accept-Language,
// falling back to the default. Mounted BEFORE the body parser so that a malformed
// or oversized body still produces a localized error (body-parser errors fire
// before later middleware, which would otherwise leave req.locale unset).
export function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  const fromHeader = pick(req.header("x-locale"));
  const fromAccept = pick(req.header("accept-language"));
  req.locale = fromHeader ?? fromAccept ?? DEFAULT_LOCALE;
  next();
}
