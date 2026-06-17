import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
} from 'ai';
import { generateAnswer, embedQuery } from '@/lib/ai';
import { namespaceFor } from '@/lib/vector';
import { getSessionId } from '@/lib/session';
import { generateFollowups } from '@/lib/insights';
import type { ChatUIMessage, Source, ChunkMetadata } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TOP_K = 6;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST /api/chat
 * Retrieval-augmented chat. Streams live pipeline status, the matched sources,
 * a grounded citation-aware answer, then follow-up questions. Every model call
 * goes through the multi-key Gemini -> Groq fallback chain.
 */
export async function POST(req: Request) {
  const sessionId = getSessionId(req);
  const { messages }: { messages: ChatUIMessage[] } = await req.json();
  const question = latestUserText(messages);

  const stream = createUIMessageStream<ChatUIMessage>({
    onError: friendlyError,
    execute: async ({ writer }) => {
      let sources: Source[] = [];
      let context = '';
      let retrievalFailed = false;

      if (question) {
        try {
          writer.write({ type: 'data-status', id: 'status', data: { stage: 'understanding' } });
          const embedding = await embedQuery(question);

          writer.write({ type: 'data-status', id: 'status', data: { stage: 'searching' } });
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

          writer.write({ type: 'data-status', id: 'status', data: { stage: 'reading', found: sources.length } });
          writer.write({ type: 'data-sources', id: 'sources', data: sources });
        } catch (err) {
          retrievalFailed = true;
          console.error('[chat] retrieval failed', err);
        }
      }

      writer.write({ type: 'data-status', id: 'status', data: { stage: 'writing', found: sources.length } });

      // Produce the answer through the fallback chain, degrading gracefully.
      let answer: string;
      if (retrievalFailed) {
        answer =
          "I couldn't search your documents just now — the search service is busy. Please try again in a moment.";
      } else {
        try {
          answer = await generateAnswer({
            system: buildSystemPrompt(context),
            messages: await convertToModelMessages(messages),
          });
        } catch (err) {
          console.error('[chat] all answer providers failed', err);
          answer =
            "I'm having trouble reaching the AI models right now. Please try again in a moment.";
        }
      }

      // Stream the answer text token-by-token for a live typing effect.
      const textId = 'answer';
      writer.write({ type: 'text-start', id: textId });
      for (const piece of chunkText(answer)) {
        writer.write({ type: 'text-delta', id: textId, delta: piece });
        await delay(10);
      }
      writer.write({ type: 'text-end', id: textId });

      // Suggest follow-ups once we have a grounded answer.
      if (question && !retrievalFailed && sources.length > 0) {
        const followups = await generateFollowups(question, answer);
        if (followups.length > 0) {
          writer.write({ type: 'data-followups', id: 'followups', data: followups });
        }
      }
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
    return `# Role
You are a document assistant for a tool that only answers from the user's uploaded files.

# Task
There is no matching document context for this question.

# Instructions
- Politely explain in one or two sentences that you can only answer questions about the documents the user has uploaded.
- Invite them to upload a relevant document or rephrase the question.
- Do NOT answer from outside knowledge, and do not guess.`;
  }

  return `# Role
You are a precise assistant that answers a user's questions strictly from their uploaded documents.

# Task
Answer the user's latest question directly and accurately, using ONLY the numbered context passages below.

# Instructions
1. Lead with the direct answer to exactly what was asked, in the first sentence — no restating the question, no preamble.
2. Match the format to the question:
   - A specific value, figure, date, or name -> state it directly. When the answer is a set of rows (items with values, a schedule, a breakdown), use a Markdown table.
   - "List" / "what are" / "steps" -> a tight bulleted or numbered list.
   - "Compare" -> a short comparison (table or parallel bullets).
   - Otherwise -> short paragraphs, only as long as the question needs.
3. Pull the actual specifics (numbers, names, dates) out of the passages rather than describing them vaguely.
4. Cite the supporting passage number(s) inline as [1] or [2][3], right after the sentence they support. Use only the numbers shown below.

# Constraints
- Use ONLY the context passages. Never use outside knowledge, and never invent document names, page numbers, figures, or facts.
- If the answer is not contained in the passages, reply with exactly: "I couldn't find that in the uploaded documents." and nothing else.
- Be concise: no filler, no "as an AI", no description of what you are about to do.

# Context passages
${context}`;
}

/** Split text into word-sized pieces (keeping trailing spaces) for streaming. */
function chunkText(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}

function round(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.round(value * 1000) / 1000;
}

/** Turn provider errors into a friendly message shown in the chat. */
function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/quota|rate.?limit|429|RESOURCE_EXHAUSTED/i.test(message)) {
    return "This free demo has reached today's AI usage limit. Please try again later.";
  }
  if (/503|UNAVAILABLE|overloaded|high demand/i.test(message)) {
    return 'The AI model is busy right now — please try again in a moment.';
  }
  return 'Sorry, something went wrong generating the answer. Please try again.';
}
