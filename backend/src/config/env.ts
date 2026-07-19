import dotenv from "dotenv";

dotenv.config();

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    // Non-fatal in production (Vercel): warn and use a safe empty string so a
    // single missing var never takes the whole serverless function down at boot.
    if (process.env.NODE_ENV === "production") {
      console.warn(`[env] missing ${name}`);
      return "";
    }
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: int("PORT", 4000),

  databaseUrl: req("DATABASE_URL"),

  jwtAccessSecret: req("JWT_ACCESS_SECRET", "dev-access-secret"),
  jwtRefreshSecret: req("JWT_REFRESH_SECRET", "dev-refresh-secret"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: int("REFRESH_TOKEN_TTL_DAYS", 30),

  llmProvider: (process.env.LLM_PROVIDER ?? "gemini").toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiGenModel: process.env.GEMINI_GEN_MODEL ?? "gemini-flash-latest",
  geminiEmbedModel: process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001",
  embedDim: int("EMBED_DIM", 768),
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",

  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  corsOrigin: process.env.CORS_ORIGIN ?? process.env.APP_URL ?? "http://localhost:3000",

  demoEmail: process.env.DEMO_EMAIL ?? "demo@verba.app",
  demoPassword: process.env.DEMO_PASSWORD ?? "demo1234",

  maxUploadMb: int("MAX_UPLOAD_MB", 8),
  dailyQueryCap: int("DAILY_QUERY_CAP", 200),
  dailyIngestCap: int("DAILY_INGEST_CAP", 50),
  maxDocChars: int("MAX_DOC_CHARS", 200000),
};

export type Locale = "en" | "es" | "pt";
export const LOCALES: Locale[] = ["en", "es", "pt"];
export const DEFAULT_LOCALE: Locale = "en";
