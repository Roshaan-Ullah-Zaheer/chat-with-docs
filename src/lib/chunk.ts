import type { ParsedSection } from './parse';

export type Chunk = {
  text: string;
  page: number | null;
  chunkIndex: number;
};

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 150; // characters of overlap between adjacent chunks
const MIN_CHUNK_LENGTH = 30; // drop tiny trailing fragments

/**
 * Split each parsed section into overlapping, fixed-size chunks. Chunking happens
 * within a section so every chunk keeps an accurate page number for citations.
 */
export function chunkSections(sections: ParsedSection[]): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const clean = section.text.replace(/\s+/g, ' ').trim();
    if (!clean) continue;

    const step = CHUNK_SIZE - CHUNK_OVERLAP;
    for (let start = 0; start < clean.length; start += step) {
      const piece = clean.slice(start, start + CHUNK_SIZE).trim();
      if (piece.length >= MIN_CHUNK_LENGTH) {
        chunks.push({ text: piece, page: section.page, chunkIndex: chunkIndex++ });
      }
      if (start + CHUNK_SIZE >= clean.length) break;
    }
  }

  return chunks;
}
