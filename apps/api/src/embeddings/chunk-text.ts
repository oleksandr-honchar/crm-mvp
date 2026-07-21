// apps/api/src/embeddings/chunk-text.ts
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

/**
 * Splits text into fixed-size windows with overlap. Deliberately a flat
 * loop, not a recursive splitter — a hard bound (text.length) guarantees
 * termination regardless of input shape, unlike a recursive splitter that
 * could misbehave on pathological input with no natural break points.
 */
export function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}
