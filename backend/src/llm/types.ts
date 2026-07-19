export type EmbedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export interface LLMProvider {
  readonly name: string;
  generate(opts: {
    system: string;
    user: string;
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<string>;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly dim: number;
  embed(texts: string[], taskType: EmbedTaskType): Promise<number[][]>;
}

// L2-normalize a vector to unit length. Gemini embeddings truncated below the
// native 3072 dims should be normalized before cosine similarity.
export function normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}
