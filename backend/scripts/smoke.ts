import { prisma } from "../src/db/prisma";
import { ingestDocument } from "../src/ingest/ingest";
import { answerQuestion } from "../src/rag/chat";

// End-to-end smoke test of the RAG core against real Neon + Gemini:
// ingest -> embed -> pgvector store -> retrieve -> grounded generate -> cite.
async function main() {
  const email = "smoke@verba.test";
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash: "x", name: "Smoke" },
    update: {},
  });
  const kb = await prisma.knowledgeBase.create({
    data: { userId: user.id, name: "Smoke KB" },
  });
  console.log("KB:", kb.id, "minScore:", kb.minScore, "topK:", kb.topK);

  const text = `Verba Refund Policy.

Customers can request a refund within 30 days of purchase. Refunds are processed to the original payment method within 5 business days.

Support Hours.

Our support team is available Monday to Friday, from 9am to 6pm Eastern Time. We do not offer phone support on weekends.

Data Security.

All uploaded documents are encrypted at rest and in transit. We never train AI models on your data, and you can delete your data at any time.`;

  const doc = await ingestDocument({
    kbId: kb.id,
    title: "Company Policy",
    sourceType: "TEXT",
    text,
  });
  console.log("Doc:", doc.status, "chunks:", doc.chunkCount, doc.error ?? "");

  const questions = [
    "How long do I have to request a refund?",
    "Do you train AI models on my documents?",
    "Is there phone support on Saturday?",
    "What is the capital of France?",
  ];
  for (const q of questions) {
    const ans = await answerQuestion({ kb, question: q, locale: "en" });
    console.log("\nQ:", q);
    console.log("A:", ans.answer);
    console.log(
      "grounded:",
      ans.grounded,
      "| citations:",
      ans.citations.map((c) => `[${c.n}] ${c.docTitle} (${c.score})`).join(", ") || "none",
    );
  }

  // Spanish grounding check
  const es = await answerQuestion({
    kb,
    question: "Cuanto tiempo tengo para pedir un reembolso?",
    locale: "es",
  });
  console.log("\nQ (es): Cuanto tiempo tengo para pedir un reembolso?");
  console.log("A (es):", es.answer);

  await prisma.knowledgeBase.delete({ where: { id: kb.id } });
  await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  await prisma.$disconnect();
  console.log("\nSmoke OK, cleaned up.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
