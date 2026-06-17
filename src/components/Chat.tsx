'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Square, FileText, MessagesSquare, Sparkles, Lightbulb } from 'lucide-react';
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
  summary,
  starterQuestions,
}: {
  messages: ChatUIMessage[];
  busy: boolean;
  hasDocs: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  error: string | null;
  summary?: string;
  starterQuestions?: string[];
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
            <EmptyState
              hasDocs={hasDocs}
              onPick={submit}
              summary={summary}
              starterQuestions={starterQuestions}
            />
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} onSend={submit} />
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
                className="grad-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white disabled:cursor-not-allowed disabled:opacity-40"
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

function EmptyState({
  hasDocs,
  onPick,
  summary,
  starterQuestions,
}: {
  hasDocs: boolean;
  onPick: (text: string) => void;
  summary?: string;
  starterQuestions?: string[];
}) {
  const questions = starterQuestions && starterQuestions.length > 0 ? starterQuestions : SUGGESTIONS;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="grad-mark mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-fuchsia-500/25">
        {hasDocs ? (
          <MessagesSquare className="h-7 w-7 text-white" />
        ) : (
          <FileText className="h-7 w-7 text-white" />
        )}
      </div>
      <h2 className="text-xl font-semibold">
        {hasDocs ? 'Your document is ready' : 'Upload a document to begin'}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        {hasDocs
          ? 'Every answer is grounded in your files and shows exactly which document and page it came from.'
          : 'Add a PDF, Word doc, or text file from the panel on the left. Then ask anything and get answers with citations.'}
      </p>

      {hasDocs && summary && (
        <div className="mt-6 w-full max-w-xl rounded-2xl border border-border bg-surface p-4 text-left">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Document summary
          </div>
          <p className="text-sm leading-relaxed text-foreground">{summary}</p>
        </div>
      )}

      {hasDocs && (
        <div className="mt-5 w-full max-w-xl">
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Lightbulb className="h-3.5 w-3.5" />
            Try asking
          </div>
          <div className="flex flex-col gap-2">
            {questions.map((s) => (
              <button
                key={s}
                onClick={() => onPick(s)}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:border-accent/50 hover:bg-surface-2"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
