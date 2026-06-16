import { z } from 'zod';
import { generateStructured } from './ai';

const docInsightsSchema = z.object({
  summary: z.string().describe('A clear 2-3 sentence summary of what this document is about.'),
  questions: z
    .array(z.string())
    .describe('Exactly 4 specific, useful questions a reader could ask about this document.'),
});

/**
 * Generate a short summary and tailored starter questions for a document.
 * Uses the full provider fallback chain. Returns `null` on total failure so the
 * upload flow never breaks.
 */
export async function generateDocInsights(
  text: string,
): Promise<{ summary: string; questions: string[] } | null> {
  try {
    const object = await generateStructured({
      schema: docInsightsSchema,
      prompt: `Read the following document excerpt and produce a concise summary plus 4 starter questions someone might ask about it. Keep questions specific to the actual content.\n\n---\n${text.slice(0, 6000)}\n---`,
    });
    return { summary: object.summary.trim(), questions: object.questions.slice(0, 4) };
  } catch (err) {
    console.error('[insights] doc insights failed', err);
    return null;
  }
}

const followupsSchema = z.object({
  questions: z
    .array(z.string())
    .describe('Up to 3 natural follow-up questions the user might ask next.'),
});

/**
 * Suggest follow-up questions based on the question just asked and the answer given.
 * Uses the full provider fallback chain. Returns an empty array on failure.
 */
export async function generateFollowups(question: string, answer: string): Promise<string[]> {
  try {
    const object = await generateStructured({
      schema: followupsSchema,
      prompt: `Given this Q&A about a user's documents, suggest up to 3 short, natural follow-up questions the user is likely to ask next. Make them specific and answerable from documents.\n\nQuestion: ${question}\n\nAnswer: ${answer}`,
    });
    return object.questions.slice(0, 3);
  } catch (err) {
    console.error('[insights] followups failed', err);
    return [];
  }
}
