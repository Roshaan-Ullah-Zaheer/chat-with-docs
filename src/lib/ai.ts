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

/** Chat / answer model. Gemini 2.5 Flash is fast and generous on the free tier. */
export const chatModel = google('gemini-2.5-flash');

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
