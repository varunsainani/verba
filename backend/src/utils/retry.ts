// Small retry helper for transient provider/network failures.
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delayMs = 400,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return withRetry(fn, retries - 1, delayMs);
    }
    throw e;
  }
}
