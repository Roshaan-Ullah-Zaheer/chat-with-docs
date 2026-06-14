import { namespaceFor } from '@/lib/vector';
import { getSessionId } from '@/lib/session';

export const runtime = 'nodejs';

/**
 * DELETE /api/documents
 * Clears every document/vector stored for the current session.
 */
export async function DELETE(req: Request) {
  try {
    const sessionId = getSessionId(req);
    await namespaceFor(sessionId).reset();
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[api/documents]', err);
    const message = err instanceof Error ? err.message : 'Failed to clear documents.';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
