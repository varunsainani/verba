import { env } from "../config/env";
import { EmbeddingProvider, EmbedTaskType, LLMProvider, normalize } from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 400));
      return withRetry(fn, retries - 1);
    }
    throw e;
  }
}

export const geminiLLM: LLMProvider = {
  name: "gemini",
  async generate({ system, user, temperature = 0.2, maxOutputTokens = 1024 }) {
    const model = env.geminiGenModel;
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature, maxOutputTokens },
    };
    return withRetry(async () => {
      const res = await fetch(`${BASE}/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": env.geminiApiKey,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`gemini generate ${res.status}: ${txt.slice(0, 300)}`);
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      return text.trim();
    });
  },
};

// Gemini embeddings. batchEmbedContents accepts up to 100 requests per call.
async function embedBatchCall(
  texts: string[],
  taskType: EmbedTaskType,
): Promise<number[][]> {
  const model = env.geminiEmbedModel;
  const body = {
    requests: texts.map((text) => ({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: env.embedDim,
    })),
  };
  const res = await fetch(`${BASE}/models/${model}:batchEmbedContents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": env.geminiApiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`gemini embed ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = (await res.json()) as { embeddings?: { values: number[] }[] };
  const out = data.embeddings ?? [];
  return out.map((e) => normalize(e.values));
}

export const geminiEmbeddings: EmbeddingProvider = {
  name: "gemini",
  dim: env.embedDim,
  async embed(texts, taskType) {
    if (texts.length === 0) return [];
    const BATCH = 50;
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      const vecs = await withRetry(() => embedBatchCall(slice, taskType));
      results.push(...vecs);
    }
    return results;
  },
};
