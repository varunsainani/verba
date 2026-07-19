import { randomUUID } from "crypto";
import { Document, SourceType } from "@prisma/client";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/http";
import { getEmbeddingProvider } from "../llm";
import { chunkText } from "./chunk";

async function insertChunks(
  documentId: string,
  kbId: string,
  chunks: { index: number; content: string; tokenCount: number }[],
  embeddings: number[][],
): Promise<void> {
  const BATCH = 25;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const vecs = embeddings.slice(i, i + BATCH);
    const rows: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    batch.forEach((c, j) => {
      rows.push(
        `($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}::vector, now())`,
      );
      params.push(
        randomUUID(),
        documentId,
        kbId,
        c.index,
        c.content,
        c.tokenCount,
        `[${vecs[j].join(",")}]`,
      );
    });
    const sql = `INSERT INTO "Chunk" (id, "documentId", "kbId", index, content, "tokenCount", embedding, "createdAt") VALUES ${rows.join(", ")}`;
    await prisma.$executeRawUnsafe(sql, ...params);
  }
}

// Full ingest: validate -> create Document(PROCESSING) -> chunk -> embed ->
// store vectors -> mark READY. Processing failures mark the document FAILED and
// return it (no throw) so the UI shows the failed state instead of a 500.
export async function ingestDocument(input: {
  kbId: string;
  title: string;
  sourceType: SourceType;
  sourceRef?: string;
  text: string;
}): Promise<Document> {
  const text = input.text.trim();
  if (!text) throw new AppError(400, "errors.emptyDocument");
  if (text.length > env.maxDocChars) {
    throw new AppError(400, "errors.docTooLarge", { chars: env.maxDocChars });
  }

  const doc = await prisma.document.create({
    data: {
      kbId: input.kbId,
      title: input.title,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef ?? "",
      status: "PROCESSING",
      charCount: text.length,
    },
  });

  try {
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error("no chunks produced");
    const embedder = getEmbeddingProvider();
    const embeddings = await embedder.embed(
      chunks.map((c) => c.content),
      "RETRIEVAL_DOCUMENT",
    );
    if (embeddings.length !== chunks.length) {
      throw new Error(
        `embedding count mismatch: ${embeddings.length} != ${chunks.length}`,
      );
    }
    await insertChunks(doc.id, input.kbId, chunks, embeddings);
    return prisma.document.update({
      where: { id: doc.id },
      data: { status: "READY", chunkCount: chunks.length, error: null },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 300) : "ingest failed";
    return prisma.document.update({
      where: { id: doc.id },
      data: { status: "FAILED", error: msg },
    });
  }
}
