'use client';

import { Sparkles, User } from 'lucide-react';
import { Markdown } from './Markdown';
import { Sources } from './Sources';
import type { ChatUIMessage, Source } from '@/lib/types';

export function MessageBubble({ message }: { message: ChatUIMessage }) {
  const isUser = message.role === 'user';

  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text: string }).text)
    .join('');

  const sources = message.parts
    .filter((p) => p.type === 'data-sources')
    .flatMap((p) => (p as { data: Source[] }).data ?? []);

  return (
    <div className={`animate-in flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? 'bg-surface-3 text-foreground'
            : 'bg-gradient-to-br from-accent to-accent-2 text-white shadow-md shadow-accent/20'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={`min-w-0 max-w-[760px] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-accent text-white'
              : 'border border-border bg-surface text-foreground'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</p>
          ) : text ? (
            <Markdown>{text}</Markdown>
          ) : (
            <ThinkingDots />
          )}

          {!isUser && <Sources sources={sources} />}
        </div>
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
