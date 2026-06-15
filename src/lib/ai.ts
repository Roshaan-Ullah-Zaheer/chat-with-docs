import { google, type GoogleEmbeddingModelOptions } from '@ai-sdk/google';

/**
 * Single place to configure the AI provider.
 *
 * To swap providers (e.g. to OpenAI or Anthropic), install the relevant
 * `@ai-sdk/*` package and change the model lines below — nothing else in the
 * app needs to change. For example:
 *
 *   import { openai } from '@ai-sdk/openai';
 *   export const chatModel = openai('gpt-4o-mini');
 *   export const embeddingModel = openai.embedding('text-embedding-3-small');
 *
 * Auth: the Google provider reads `GOOGLE_GENERATIVE_AI_API_KEY` from the env.
 */

/**
 * Chat / answer model. Gemini 2.5 Flash-Lite is the model Google keeps in the
 * free tier with the most generous request allowance, so it's the safest default
 * for a free public demo. Swap to `gemini-2.5-flash` (or another provider) for
 * higher quality if you have billing/quota.
 */
export const chatModel = google('gemini-2.5-flash-lite');

/**
 * Secondary model for non-answer work (document summaries, follow-up questions).
 * The free tier's request quota is per-model, so using a different model here
 * keeps those background calls from eating into the answer model's allowance.
 */
export const auxModel = google('gemini-2.0-flash');

/**
 * Embedding output dimension. The Upstash Vector index MUST be created with this
 * exact dimension and the COSINE distance metric.
 */
export const EMBED_DIM = 768;

/** Embedding model. `gemini-embedding-001` supports a custom output dimension. */
export const embeddingModel = google.embedding('gemini-embedding-001');

/** Options used when embedding document chunks (asymmetric retrieval). */
export const embedDocumentOptions = {
  google: {
    outputDimensionality: EMBED_DIM,
    taskType: 'RETRIEVAL_DOCUMENT',
  } satisfies GoogleEmbeddingModelOptions,
};

/** Options used when embedding a user's question. */
export const embedQueryOptions = {
  google: {
    outputDimensionality: EMBED_DIM,
    taskType: 'RETRIEVAL_QUERY',
  } satisfies GoogleEmbeddingModelOptions,
};
