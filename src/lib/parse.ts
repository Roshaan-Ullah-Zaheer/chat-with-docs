import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';

export type ParsedSection = {
  /** 1-based page number for PDFs; `null` for formats without pages. */
  page: number | null;
  text: string;
};

export type ParsedDocument = {
  type: 'pdf' | 'docx' | 'txt';
  pages: number | null;
  sections: ParsedSection[];
};

/** Detect the file type from its name and extract text, preserving page numbers. */
export async function parseFile(name: string, buffer: ArrayBuffer): Promise<ParsedDocument> {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return parsePdf(buffer);
  if (lower.endsWith('.docx')) return parseDocx(buffer);
  if (lower.endsWith('.txt') || lower.endsWith('.md')) return parseText(buffer);
  throw new Error(`Unsupported file "${name}". Please upload a PDF, DOCX, TXT, or MD file.`);
}

async function parsePdf(buffer: ArrayBuffer): Promise<ParsedDocument> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // `mergePages: false` returns one string per page, which keeps citations
  // anchored to the correct page number.
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  const sections: ParsedSection[] = pages.map((t, i) => ({ page: i + 1, text: t ?? '' }));
  return { type: 'pdf', pages: totalPages, sections };
}

async function parseDocx(buffer: ArrayBuffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return { type: 'docx', pages: null, sections: [{ page: null, text: result.value }] };
}

function parseText(buffer: ArrayBuffer): ParsedDocument {
  const text = new TextDecoder().decode(buffer);
  return { type: 'txt', pages: null, sections: [{ page: null, text }] };
}
