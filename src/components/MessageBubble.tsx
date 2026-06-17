'use client';

import { useState } from 'react';
import { Sparkles, User, CornerDownRight } from 'lucide-react';
import { Markdown } from './Markdown';
import { Sources } from './Sources';
import { StatusSteps } from './StatusSteps';
import { useViewer } from './ViewerContext';
import type { ChatUIMessage, ChatStatus, Source } from '@/lib/types';

export function MessageBubble({
  message,
  onSend,
}: {
  message: ChatUIMessage;
  onSend: (text: string) => void;
}) {
  const isUser = message.role === 'user';
  const [activeRef, setActiveRef] = useState<number | null>(null);
  const { openSource } = useViewer();

  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text: string }).text)
    .join('');

  const status = message.parts
    .filter((p) => p.type === 'data-status')
    .map((p) => (p as { data: ChatStatus }).data)
    .at(-1);

  const sources = message.parts
    .filter((p) => p.type === 'data-sources')
    .flatMap((p) => (p as { data: Source[] }).data ?? []);

  const followups = message.parts
    .filter((p) => p.type === 'data-followups')
    .flatMap((p) => (p as { data: string[] }).data ?? []);

  function handleCite(ref: number) {
    const src = sources.find((s) => s.ref === ref);
    if (!src) return;
    setActiveRef(ref);
    openSource(src);
  }

  return (
    <div className={`animate-in flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? 'bg-surface-3 text-foreground'
            : 'grad-mark text-white shadow-md shadow-pink-500/25'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={`min-w-0 max-w-[760px] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? 'bg-accent text-white' : 'border border-border bg-surface text-foreground'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</p>
          ) : text ? (
            <Markdown sources={sources} onCite={handleCite}>
              {text}
            </Markdown>
          ) : status ? (
            <StatusSteps status={status} />
          ) : (
            <ThinkingDots />
          )}

          {!isUser && <Sources sources={sources} activeRef={activeRef} />}
        </div>

        {!isUser && followups.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Suggested follow-ups
            </p>
            {followups.map((q) => (
              <button
                key={q}
                onClick={() => onSend(q)}
                className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-accent/50 hover:bg-surface-2"
              >
                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-muted" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted" />
    </div>
  );
}
