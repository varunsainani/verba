import { prisma } from "../db/prisma";
import { AppError } from "../utils/http";

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

type Field = "queryCount" | "ingestCount";

// Check a daily cap and increment it. Best-effort under concurrency (serverless),
// which is acceptable for protecting a free quota. Checked BEFORE any LLM call.
export async function consumeQuota(
  userId: string,
  field: Field,
  cap: number,
): Promise<void> {
  const date = todayUTC();
  const row = await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
  });
  const used = field === "queryCount" ? row.queryCount : row.ingestCount;
  if (used >= cap) {
    throw new AppError(
      429,
      field === "queryCount" ? "errors.queryQuota" : "errors.ingestQuota",
      { cap },
    );
  }
  await prisma.usageDaily.update({
    where: { userId_date: { userId, date } },
    data: { [field]: { increment: 1 } },
  });
}

export async function getUsage(userId: string) {
  const date = todayUTC();
  const row = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date } },
  });
  return {
    date,
    queryCount: row?.queryCount ?? 0,
    ingestCount: row?.ingestCount ?? 0,
  };
}
