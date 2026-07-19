import { Locale } from "../config/env";

declare global {
  namespace Express {
    interface Request {
      locale: Locale;
      userId?: string;
      userRole?: "USER" | "ADMIN";
    }
  }
}

export {};
