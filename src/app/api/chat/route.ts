import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
  embed,
} from 'ai';
import { chatModel, embeddingModel, embedQueryOptions } from '@/lib/ai';
import { namespaceFor } from '@/lib/vector';
import { getSessionId } from '@/lib/session';
import type { ChatUIMessage, Source, ChunkMetadata } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TOP_K = 6;

/**
 * POST /api/chat
 * Retrieval-augmented chat. We embed the latest question, pull the most relevant
 * chunks from this session's namespace, stream the matched sources to the client
 * as a `data-sources` part, then stream a grounded, citation-aware answer.
 */
export async function POST(req: Request) {
  const sessionId = getSessionId(req);
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  const question = latestUserText(messages);

  let sources: Source[] = [];
  let context = '';

  if (question) {
    const { embedding } = await embed({
      model: embeddingModel,
      value: question,
      providerOptions: embedQueryOptions,
    });

    const results = await namespaceFor(sessionId).query({
      vector: embedding,
      topK: TOP_K,
      includeMetadata: true,
    });

    const matches = results.filter((r) => r.metadata);

    sources = matches.map((r, i) => {
      const m = r.metadata as ChunkMetadata;
      return {
        ref: i + 1,
        documentId: m.documentId,
        documentName: m.documentName,
        page: m.page,
        snippet: m.text.length > 240 ? `${m.text.slice(0, 240).trimEnd()}…` : m.text,
        score: round(r.score),
      };
    });

    context = matches
      .map((r, i) => {
        const m = r.metadata as ChunkMetadata;
        const where = m.page ? `, page ${m.page}` : '';
        return `[${i + 1}] (Document: "${m.documentName}"${where})\n${m.text}`;
      })
      .join('\n\n');
  }

  const system = buildSystemPrompt(context);

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      // Send the citations first so the UI can render source chips immediately.
      writer.write({ type: 'data-sources', id: 'sources', data: sources });

      const result = streamText({
        model: chatModel,
        system,
        messages: await convertToModelMessages(messages),
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}

function latestUserText(messages: ChatUIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return '';
  return lastUser.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text: string }).text)
    .join(' ')
    .trim();
}

function buildSystemPrompt(context: string): string {
  if (!context) {
    return [
      'You are a document assistant. There is no matching document context for this question.',
      "Politely explain that you can only answer questions about the documents the user has uploaded,",
      'and invite them to upload a document or rephrase. Do not use any outside knowledge.',
    ].join(' ');
  }

  return `You are a precise assistant that answers questions strictly from a user's uploaded documents.

Rules:
- Use ONLY the numbered context passages below. Do not rely on outside knowledge.
- If the answer is not present in the context, reply exactly: "I couldn't find that in the uploaded documents."
- Cite your sources inline using bracketed numbers like [1] or [2] that match the passage numbers. Put the citation right after the sentence it supports.
- Be clear and concise. Use short paragraphs and bullet points where they help.
- Never invent document names, page numbers, or facts.

Context passages:
${context}`;
}

function round(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.round(value * 1000) / 1000;
}
