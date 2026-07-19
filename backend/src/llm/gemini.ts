import { env } from "../config/env";
import { withRetry } from "../utils/retry";
import { EmbeddingProvider, EmbedTaskType, LLMProvider, normalize } from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

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
      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
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
  // Positional response: a short array would misalign vectors with chunks.
  if (out.length !== texts.length) {
    throw new Error(`gemini embed count mismatch: ${out.length} != ${texts.length}`);
  }
  return out.map((e) => {
    const values = e.values ?? [];
    if (values.length !== env.embedDim || values.some((v) => !Number.isFinite(v))) {
      throw new Error("gemini embed returned an invalid vector");
    }
    return normalize(values);
  });
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
