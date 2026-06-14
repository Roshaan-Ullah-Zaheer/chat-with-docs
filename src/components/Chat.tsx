'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Square, FileText, MessagesSquare } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { ChatUIMessage } from '@/lib/types';

const SUGGESTIONS = [
  'Give me a concise summary of the document.',
  'What are the key points or takeaways?',
  'List any important dates, names, or figures mentioned.',
];

export function Chat({
  messages,
  busy,
  hasDocs,
  onSend,
  onStop,
  error,
}: {
  messages: ChatUIMessage[];
  busy: boolean;
  hasDocs: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  error: string | null;
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || busy || !hasDocs) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState hasDocs={hasDocs} onPick={submit} />
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface/50 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          {error && (
            <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-2 p-2 focus-within:border-accent/60">
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              disabled={!hasDocs}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                hasDocs ? 'Ask anything about your documents…' : 'Upload a document to start chatting…'
              }
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-muted disabled:cursor-not-allowed"
            />
            {busy ? (
              <button
                onClick={onStop}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-foreground transition-colors hover:bg-border"
                title="Stop"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => submit(input)}
                disabled={!input.trim() || !hasDocs}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-40"
                title="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">
            DocChat answers only from your uploaded files and can make mistakes — check the cited sources.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasDocs, onPick }: { hasDocs: boolean; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 shadow-lg shadow-accent/25">
        {hasDocs ? (
          <MessagesSquare className="h-7 w-7 text-white" />
        ) : (
          <FileText className="h-7 w-7 text-white" />
        )}
      </div>
      <h2 className="text-xl font-semibold">
        {hasDocs ? 'Ask a question about your documents' : 'Upload a document to begin'}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        {hasDocs
          ? 'Every answer is grounded in your files and shows exactly which document and page it came from.'
          : 'Add a PDF, Word doc, or text file from the panel on the left. Then ask anything and get answers with citations.'}
      </p>

      {hasDocs && (
        <div className="mt-6 flex w-full max-w-md flex-col gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="rounded-xl border border-border bg-surface px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:border-accent/50 hover:bg-surface-2"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
