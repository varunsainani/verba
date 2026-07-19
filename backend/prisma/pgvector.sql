CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX IF NOT EXISTS chunk_embedding_hnsw
  ON "Chunk" USING hnsw (embedding vector_cosine_ops);
