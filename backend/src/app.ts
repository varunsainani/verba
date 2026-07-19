import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { localeMiddleware } from "./middleware/locale";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRouter } from "./auth/routes";
import { kbRouter } from "./kb/routes";
import { publicRouter } from "./public/routes";

export function createApp() {
  const app = express();
  // Behind the Vercel proxy: needed for correct req.ip (rate limiting).
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(","),
      credentials: true,
    }),
  );

  // Locale resolution BEFORE the body parser so malformed/oversized bodies still
  // return a localized error (body-parser errors fire before later middleware).
  app.use(localeMiddleware);
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "verba-api" });
  });

  app.use("/auth", authRouter);
  app.use("/kbs", kbRouter);
  app.use("/public", publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
