import { createGoogleGenerativeAI, type GoogleEmbeddingModelOptions } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import {
  generateText,
  generateObject,
  embed,
  embedMany,
  type LanguageModel,
  type ModelMessage,
} from 'ai';
import type { z } from 'zod';

/**
 * Multi-key, multi-model fallback layer.
 *
 * Text generation (answers, summaries, follow-ups) tries, in order:
 *   key1: gemini-2.5-flash -> gemini-2.5-flash-lite
 *   key2: gemini-2.5-flash -> gemini-2.5-flash-lite
 *   ...one entry per key...
 *   groq: llama-3.3-70b-versatile        (last resort)
 *
 * Embeddings cycle through the same Gemini keys (Groq has no embeddings).
 * Configure keys via env:
 *   GOOGLE_API_KEYS = comma-separated Gemini API keys
 *   GROQ_API_KEY    = a single Groq key
 */

/** Embedding dimension — the Upstash index must match this exactly (768, COSINE). */
export const EMBED_DIM = 768;

const GOOGLE_TEXT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const GROQ_TEXT_MODELS = ['llama-3.3-70b-versatile'];
const EMBED_MODEL = 'gemini-embedding-001';

function googleKeys(): string[] {
  const raw = process.env.GOOGLE_API_KEYS ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

type GoogleProvider = ReturnType<typeof createGoogleGenerativeAI>;

let googleProvidersCache: { label: string; provider: GoogleProvider }[] | null = null;
function googleProviders() {
  if (!googleProvidersCache) {
    googleProvidersCache = googleKeys().map((key, i) => ({
      label: `gemini#${i + 1}`,
      provider: createGoogleGenerativeAI({ apiKey: key }),
    }));
  }
  return googleProvidersCache;
}

type TextCandidate = { label: string; model: LanguageModel };

let textCandidatesCache: TextCandidate[] | null = null;
function textCandidates(): TextCandidate[] {
  if (textCandidatesCache) return textCandidatesCache;

  const out: TextCandidate[] = [];
  for (const { label, provider } of googleProviders()) {
    for (const model of GOOGLE_TEXT_MODELS) {
      out.push({ label: `${label}/${model}`, model: provider(model) });
    }
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const groq = createGroq({ apiKey: groqKey });
    for (const model of GROQ_TEXT_MODELS) {
      out.push({ label: `groq/${model}`, model: groq(model) });
    }
  }

  textCandidatesCache = out;
  return out;
}

/** Try each candidate in order; return the first success, else throw the last error. */
async function runFallback<T>(
  op: string,
  items: { label: string }[],
  fn: (index: number) => Promise<T>,
): Promise<T> {
  if (items.length === 0) throw new Error(`No providers configured for "${op}". Check your API keys.`);
  let lastError: unknown;
  for (let i = 0; i < items.length; i++) {
    try {
      return await fn(i);
    } catch (err) {
      lastError = err;
      console.warn(`[ai] ${op} via ${items[i].label} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`All providers failed for "${op}".`);
}

/** Generate a plain-text answer using the full fallback chain. */
export async function generateAnswer(opts: { system: string; messages: ModelMessage[] }): Promise<string> {
  const candidates = textCandidates();
  return runFallback('chat', candidates, async (i) => {
    const { text } = await generateText({
      model: candidates[i].model,
      system: opts.system,
      messages: opts.messages,
      maxRetries: 0,
    });
    if (!text.trim()) throw new Error('empty response');
    return text;
  });
}

/** Generate a structured object (summaries, follow-ups) using the full fallback chain. */
export async function generateStructured<T>(opts: { schema: z.ZodType<T>; prompt: string }): Promise<T> {
  const candidates = textCandidates();
  return runFallback('structured', candidates, async (i) => {
    const { object } = await generateObject({
      model: candidates[i].model,
      schema: opts.schema,
      prompt: opts.prompt,
      maxRetries: 0,
    });
    return object;
  });
}

const queryEmbedOptions = {
  google: { outputDimensionality: EMBED_DIM, taskType: 'RETRIEVAL_QUERY' } satisfies GoogleEmbeddingModelOptions,
};
const docEmbedOptions = {
  google: { outputDimensionality: EMBED_DIM, taskType: 'RETRIEVAL_DOCUMENT' } satisfies GoogleEmbeddingModelOptions,
};

/** Embed a single query string, cycling through the Gemini keys. */
export async function embedQuery(text: string): Promise<number[]> {
  const providers = googleProviders();
  return runFallback('embed-query', providers, async (i) => {
    const { embedding } = await embed({
      model: providers[i].provider.textEmbeddingModel(EMBED_MODEL),
      value: text,
      providerOptions: queryEmbedOptions,
      maxRetries: 0,
    });
    return embedding;
  });
}

/** Embed many document chunks, cycling through the Gemini keys. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const providers = googleProviders();
  return runFallback('embed-docs', providers, async (i) => {
    const { embeddings } = await embedMany({
      model: providers[i].provider.textEmbeddingModel(EMBED_MODEL),
      values: texts,
      providerOptions: docEmbedOptions,
      maxRetries: 0,
    });
    return embeddings;
  });
}
