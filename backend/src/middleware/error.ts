import { NextFunction, Request, Response } from "express";
import { DEFAULT_LOCALE } from "../config/env";
import { t } from "../i18n/messages";
import { AppError } from "../utils/http";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  const locale = req.locale ?? DEFAULT_LOCALE;
  res.status(404).json({ error: t(locale, "errors.notFound") });
}

// Central error handler. Always localizes. Never leaks internals in production.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const locale = req.locale ?? DEFAULT_LOCALE;

  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ error: t(locale, err.messageKey, err.params) });
    return;
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res
        .status(413)
        .json({ error: t(locale, "errors.fileTooLarge", { mb: env.maxUploadMb }) });
      return;
    }
    res.status(400).json({ error: t(locale, "errors.validation") });
    return;
  }

  if (err instanceof ZodError) {
    const fields = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    res.status(400).json({ error: t(locale, "errors.validation"), fields });
    return;
  }

  // body-parser errors (malformed / oversized JSON)
  if (err && typeof err === "object" && "type" in err) {
    const type = (err as { type?: string }).type;
    if (type === "entity.too.large") {
      res.status(413).json({ error: t(locale, "errors.fileTooLarge", { mb: 2 }) });
      return;
    }
    if (type === "entity.parse.failed") {
      res.status(400).json({ error: t(locale, "errors.validation") });
      return;
    }
  }

  console.error("[error]", err);
  res.status(500).json({ error: t(locale, "errors.internal") });
}
