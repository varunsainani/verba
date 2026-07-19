import { PrismaClient } from "@prisma/client";

// Reuse the client across serverless invocations to avoid exhausting Neon
// connections (a fresh client per cold start is fine; per request is not).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
