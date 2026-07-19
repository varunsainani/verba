import { prisma } from "../db/prisma";
import { AppError } from "../utils/http";

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

type Field = "queryCount" | "ingestCount";

// Check a daily cap and increment it atomically. The single conditional UPDATE
// (increment only while below the cap) closes the check-then-increment race so a
// burst cannot overshoot the free quota. Checked BEFORE any LLM/embedding call.
export async function consumeQuota(
  userId: string,
  field: Field,
  cap: number,
): Promise<void> {
  const date = todayUTC();
  // Ensure the row exists so the conditional UPDATE has something to match.
  await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
  });
  const col = field === "queryCount" ? "queryCount" : "ingestCount";
  const updated = await prisma.$executeRawUnsafe(
    `UPDATE "UsageDaily" SET "${col}" = "${col}" + 1
       WHERE "userId" = $1 AND date = $2 AND "${col}" < $3`,
    userId,
    date,
    cap,
  );
  if (updated === 0) {
    throw new AppError(
      429,
      field === "queryCount" ? "errors.queryQuota" : "errors.ingestQuota",
      { cap },
    );
  }
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
