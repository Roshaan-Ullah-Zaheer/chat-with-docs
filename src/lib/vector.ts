import { Index } from '@upstash/vector';
import type { ChunkMetadata } from './types';

let index: Index<ChunkMetadata> | null = null;

/** Lazily create a single shared Upstash Vector client. */
export function getIndex(): Index<ChunkMetadata> {
  if (!index) {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        'Missing Upstash Vector credentials. Set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN in your environment.',
      );
    }
    index = new Index<ChunkMetadata>({ url, token });
  }
  return index;
}

/**
 * Each browser session gets its own namespace so uploaded documents (and the
 * answers drawn from them) stay isolated between users.
 */
export function namespaceFor(sessionId: string) {
  return getIndex().namespace(`s_${sessionId}`);
}
