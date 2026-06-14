/**
 * Resolve the current session id from a request. We prefer the explicit
 * `x-session-id` header (sent by the upload call) and fall back to the `sid`
 * cookie (sent automatically by the chat call). The value is validated so it is
 * safe to use as part of a vector-store namespace.
 */
export function getSessionId(req: Request): string {
  const header = req.headers.get('x-session-id');
  if (header && isValid(header)) return header;

  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)sid=([^;]+)/);
  if (match) {
    const value = decodeURIComponent(match[1]);
    if (isValid(value)) return value;
  }

  return 'public';
}

function isValid(value: string): boolean {
  return /^[A-Za-z0-9_-]{6,64}$/.test(value);
}
