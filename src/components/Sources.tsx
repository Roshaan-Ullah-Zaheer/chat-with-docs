'use client';

import { useEffect, useState } from 'react';
import { FileText, ChevronDown, ExternalLink } from 'lucide-react';
import { useViewer } from './ViewerContext';
import type { Source } from '@/lib/types';

/**
 * Citation chips rendered beneath an assistant answer. Each chip maps to an
 * inline `[n]` marker. Clicking reveals the exact passage; for PDFs it also opens
 * the document at that page with the passage highlighted.
 */
export function Sources({
  sources,
  activeRef,
}: {
  sources: Source[];
  activeRef?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const { openSource, canView } = useViewer();

  // When a citation in the answer is clicked, reveal the matching chip.
  useEffect(() => {
    if (activeRef != null) setOpen(activeRef);
  }, [activeRef]);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s) => {
          const isOpen = open === s.ref;
          const isActive = activeRef === s.ref;
          return (
            <button
              key={s.ref}
              onClick={() => {
                setOpen(isOpen ? null : s.ref);
                openSource(s);
              }}
              className={`group inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors ${
                isOpen || isActive
                  ? 'border-accent/60 bg-accent/15 text-foreground'
                  : 'border-border bg-surface-2 text-muted hover:border-accent/40 hover:text-foreground'
              } ${isActive ? 'ring-1 ring-accent/50' : ''}`}
              title={`Relevance ${Math.round(s.score * 100)}%`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-accent/20 text-[10px] font-bold text-[#c7d2fe]">
                {s.ref}
              </span>
              <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="max-w-[180px] truncate font-medium">{s.documentName}</span>
              {s.page != null && <span className="opacity-70">· p.{s.page}</span>}
              {canView(s.documentId) && <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />}
              <ChevronDown
                className={`h-3 w-3 shrink-0 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {open != null && (
        <blockquote className="mt-2 rounded-lg border border-border bg-background/60 p-3 text-[13px] leading-relaxed text-muted">
          {sources.find((s) => s.ref === open)?.snippet}
          {(() => {
            const s = sources.find((x) => x.ref === open);
            if (s && canView(s.documentId)) {
              return (
                <button
                  onClick={() => openSource(s)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#a5b4fc] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View page {s.page} in the document
                </button>
              );
            }
            return null;
          })()}
        </blockquote>
      )}
    </div>
  );
}
