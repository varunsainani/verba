import { prisma } from "../db/prisma";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  docTitle: string;
  index: number;
  content: string;
  score: number;
}

// Cosine similarity search over pgvector. score = 1 - cosine distance, so higher
// is more similar. Only chunks in the given KB with an embedding are considered.
export async function retrieve(
  kbId: string,
  queryVec: number[],
  topK: number,
): Promise<RetrievedChunk[]> {
  const vecLiteral = `[${queryVec.join(",")}]`;
  const rows = await prisma.$queryRawUnsafe<RetrievedChunk[]>(
    `SELECT c.id,
            c."documentId" AS "documentId",
            d.title        AS "docTitle",
            c.index        AS index,
            c.content      AS content,
            1 - (c.embedding <=> $1::vector) AS score
       FROM "Chunk" c
       JOIN "Document" d ON d.id = c."documentId"
      WHERE c."kbId" = $2 AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT $3`,
    vecLiteral,
    kbId,
    topK,
  );
  return rows.map((r) => ({ ...r, score: Number(r.score) }));
}
