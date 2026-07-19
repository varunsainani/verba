import { env } from "../config/env";
import { LLMProvider } from "./types";

// Switchable generation provider (OpenAI-compatible). Embeddings always use
// Gemini; Groq is generation-only.
export const groqLLM: LLMProvider = {
  name: "groq",
  async generate({ system, user, temperature = 0.2, maxOutputTokens = 1024 }) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.groqApiKey}`,
      },
      body: JSON.stringify({
        model: env.groqModel,
        temperature,
        max_tokens: maxOutputTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`groq generate ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return (data.choices?.[0]?.message?.content ?? "").trim();
  },
};
