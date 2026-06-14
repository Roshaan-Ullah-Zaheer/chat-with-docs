import type { UIMessage } from 'ai';

/**
 * A single source passage used to answer a question. Streamed to the UI so we
 * can render clickable citation chips beneath each answer.
 */
export type Source = {
  /** 1-based index that matches the inline citation markers (e.g. `[1]`). */
  ref: number;
  documentId: string;
  documentName: string;
  /** 1-based page number for PDFs; `null` for formats without pages (.docx, .txt). */
  page: number | null;
  /** Short preview of the passage shown in the citation chip. */
  snippet: string;
  /** Relevance score from the vector search (0..1). */
  score: number;
};

/** Metadata attached to every vector stored in Upstash. */
export type ChunkMetadata = {
  documentId: string;
  documentName: string;
  page: number | null;
  chunkIndex: number;
  /** The chunk text itself — used to build the model context and citation snippet. */
  text: string;
};

/** A document the user has uploaded in the current session. */
export type UploadedDocument = {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt';
  /** Page count for PDFs; `null` otherwise. */
  pages: number | null;
  chunks: number;
};

/**
 * Our typed chat message: ordinary text parts plus a custom `sources` data part
 * (rendered in the UI as `data-sources`).
 */
export type ChatUIMessage = UIMessage<never, { sources: Source[] }>;
