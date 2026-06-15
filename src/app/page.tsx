'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { nanoid } from 'nanoid';
import { Sidebar } from '@/components/Sidebar';
import { Chat } from '@/components/Chat';
import { ViewerProvider, type DocBlob } from '@/components/ViewerContext';
import type { ChatUIMessage, UploadedDocument } from '@/lib/types';

/** Read the session id from the `sid` cookie, creating one if it doesn't exist. */
function ensureSessionId(): string {
  const existing = document.cookie.match(/(?:^|;\s*)sid=([^;]+)/);
  if (existing) return decodeURIComponent(existing[1]);
  const sid = nanoid(21);
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `sid=${sid}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
  return sid;
}

export default function Home() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [blobs, setBlobs] = useState<Record<string, DocBlob>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');

  const { messages, sendMessage, status, stop, setMessages, error: chatError } =
    useChat<ChatUIMessage>();

  useEffect(() => {
    setSessionId(ensureSessionId());
  }, []);

  const busy = status === 'submitted' || status === 'streaming';
  const hasDocs = documents.length > 0;
  const onboardingDoc = [...documents]
    .reverse()
    .find((d) => d.summary || (d.starterQuestions?.length ?? 0) > 0);

  async function handleFiles(files: File[]) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      for (const file of files) form.append('files', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: sessionId ? { 'x-session-id': sessionId } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      const docs = data.documents as UploadedDocument[];

      // Keep each uploaded file in memory so we can render PDFs with highlights.
      const newBlobs: Record<string, DocBlob> = {};
      docs.forEach((doc, i) => {
        const file = files[i];
        if (file) newBlobs[doc.id] = { url: URL.createObjectURL(file), type: doc.type, name: doc.name };
      });

      setBlobs((prev) => ({ ...prev, ...newBlobs }));
      setDocuments((prev) => [...prev, ...docs]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleClear() {
    setError(null);
    try {
      await fetch('/api/documents', {
        method: 'DELETE',
        headers: sessionId ? { 'x-session-id': sessionId } : undefined,
      });
    } catch {
      // A failed clear shouldn't block the UI from resetting.
    }
    Object.values(blobs).forEach((b) => URL.revokeObjectURL(b.url));
    setBlobs({});
    setDocuments([]);
    setMessages([]);
  }

  return (
    <ViewerProvider blobs={blobs}>
      <div className="flex h-screen w-full flex-col overflow-hidden md:flex-row">
        <div className="h-[42vh] shrink-0 md:h-full md:w-80">
          <Sidebar
            documents={documents}
            uploading={uploading}
            onFiles={handleFiles}
            onClear={handleClear}
            error={error}
          />
        </div>

        <main className="flex min-h-0 flex-1 flex-col">
          <Chat
            messages={messages}
            busy={busy}
            hasDocs={hasDocs}
            onSend={(text) => sendMessage({ text })}
            onStop={stop}
            error={chatError?.message ?? null}
            summary={onboardingDoc?.summary}
            starterQuestions={onboardingDoc?.starterQuestions}
          />
        </main>
      </div>
    </ViewerProvider>
  );
}
