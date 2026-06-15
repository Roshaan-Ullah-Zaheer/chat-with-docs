'use client';

import { Check, Loader2 } from 'lucide-react';
import type { ChatStatus } from '@/lib/types';

const ORDER: ChatStatus['stage'][] = ['understanding', 'searching', 'reading', 'writing'];

function labelFor(stage: ChatStatus['stage'], found?: number): string {
  switch (stage) {
    case 'understanding':
      return 'Understanding your question';
    case 'searching':
      return 'Searching your documents';
    case 'reading':
      return found != null
        ? `Found ${found} relevant passage${found === 1 ? '' : 's'}`
        : 'Reading relevant passages';
    case 'writing':
      return 'Writing the answer';
  }
}

/** Animated checklist showing the retrieval pipeline working in real time. */
export function StatusSteps({ status }: { status: ChatStatus }) {
  const current = ORDER.indexOf(status.stage);

  return (
    <ul className="flex flex-col gap-1.5 py-1">
      {ORDER.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={stage}
            className={`flex items-center gap-2 text-sm transition-colors ${
              active ? 'text-foreground' : done ? 'text-muted' : 'text-muted/40'
            }`}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {done ? (
                <Check className="h-3.5 w-3.5 text-accent" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            {labelFor(stage, status.found)}
          </li>
        );
      })}
    </ul>
  );
}
