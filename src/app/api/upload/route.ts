import { embedMany } from 'ai';
import { nanoid } from 'nanoid';
import { embeddingModel, embedDocumentOptions } from '@/lib/ai';
import { namespaceFor } from '@/lib/vector';
import { parseFile } from '@/lib/parse';
import { chunkSections } from '@/lib/chunk';
import { getSessionId } from '@/lib/session';
import type { UploadedDocument, ChunkMetadata } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB per file (Vercel free-tier request-body safety)
const MAX_CHUNKS_PER_DOC = 250; // keep within free-tier embedding limits

/**
 * POST /api/upload
 * Accepts multipart form data with one or more `files`. For each file we extract
 * text, chunk it, embed the chunks with Gemini, and upsert the vectors into this
 * session's namespace in Upstash Vector.
 */
export async function POST(req: Request) {
  try {
    const sessionId = getSessionId(req);
    const form = await req.formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return Response.json({ error: 'No files were provided.' }, { status: 400 });
    }

    const ns = namespaceFor(sessionId);
    const documents: UploadedDocument[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return Response.json(
          { error: `"${file.name}" is too large. The free tier supports files up to 4 MB.` },
          { status: 413 },
        );
      }

      const buffer = await file.arrayBuffer();
      const parsed = await parseFile(file.name, buffer);

      let chunks = chunkSections(parsed.sections);
      if (chunks.length === 0) {
        return Response.json(
          { error: `No readable text was found in "${file.name}". Scanned/image-only PDFs aren't supported yet.` },
          { status: 422 },
        );
      }
      if (chunks.length > MAX_CHUNKS_PER_DOC) {
        chunks = chunks.slice(0, MAX_CHUNKS_PER_DOC);
      }

      const documentId = nanoid(10);

      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks.map((c) => c.text),
        providerOptions: embedDocumentOptions,
      });

      const vectors = embeddings.map((embedding, i) => ({
        id: `${documentId}_${i}`,
        vector: embedding,
        metadata: {
          documentId,
          documentName: file.name,
          page: chunks[i].page,
          chunkIndex: chunks[i].chunkIndex,
          text: chunks[i].text,
        } satisfies ChunkMetadata,
      }));

      await ns.upsert(vectors);

      documents.push({
        id: documentId,
        name: file.name,
        type: parsed.type,
        pages: parsed.pages,
        chunks: chunks.length,
      });
    }

    return Response.json({ documents });
  } catch (err) {
    console.error('[api/upload]', err);
    const message = err instanceof Error ? err.message : 'Failed to process the upload.';
    return Response.json({ error: message }, { status: 500 });
  }
}
