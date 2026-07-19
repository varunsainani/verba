import { env } from "../config/env";
import { geminiEmbeddings, geminiLLM } from "./gemini";
import { groqLLM } from "./groq";
import { EmbeddingProvider, LLMProvider } from "./types";

export function getLLMProvider(): LLMProvider {
  switch (env.llmProvider) {
    case "groq":
      return groqLLM;
    case "gemini":
    default:
      return geminiLLM;
  }
}

// Only Gemini provides embeddings on the free stack.
export function getEmbeddingProvider(): EmbeddingProvider {
  return geminiEmbeddings;
}

export * from "./types";
