export interface Chunk {
  index: number;
  content: string;
  tokenCount: number;
}

const CHUNK_CHARS = 1100;
const OVERLAP_CHARS = 180;

// Rough token estimate for quota/telemetry (English ~4 chars/token).
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitLongParagraph(para: string, max: number): string[] {
  // Split an over-long paragraph on sentence boundaries, then hard-wrap the
  // remainder if a single "sentence" is still too long.
  const sentences = para.match(/[^.!?\n]+[.!?]*\s*/g) ?? [para];
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length > max && buf) {
      out.push(buf.trim());
      buf = "";
    }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
    } else {
      buf += s;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(Boolean);
}

// Paragraph-aware chunker with character overlap so context spanning a boundary
// is not lost. Returns indexed chunks ready to embed.
export function chunkText(
  text: string,
  chunkChars = CHUNK_CHARS,
  overlap = OVERLAP_CHARS,
): Chunk[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pieces: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    const parts = para.length > chunkChars ? splitLongParagraph(para, chunkChars) : [para];
    for (const part of parts) {
      if (current.length + part.length + 2 > chunkChars && current) {
        pieces.push(current.trim());
        // carry an overlap tail into the next chunk
        current = current.slice(Math.max(0, current.length - overlap));
      }
      current += (current ? "\n\n" : "") + part;
    }
  }
  if (current.trim()) pieces.push(current.trim());

  return pieces
    .filter((c) => c.length > 0)
    .map((content, index) => ({
      index,
      content,
      tokenCount: estimateTokens(content),
    }));
}
