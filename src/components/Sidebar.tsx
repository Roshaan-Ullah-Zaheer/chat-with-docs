'use client';

import { FileText, Trash2, Sparkles } from 'lucide-react';
import { UploadZone } from './UploadZone';
import type { UploadedDocument } from '@/lib/types';

export function Sidebar({
  documents,
  uploading,
  onFiles,
  onClear,
  error,
}: {
  documents: UploadedDocument[];
  uploading: boolean;
  onFiles: (files: File[]) => void;
  onClear: () => void;
  error: string | null;
}) {
  return (
    <aside className="flex h-full w-full flex-col gap-4 border-r border-border bg-surface/70 p-4 backdrop-blur md:w-80">
      <div className="flex items-center gap-2.5">
        <div className="grad-mark flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-pink-500/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="brand-text text-base font-bold leading-tight">DocChat</h1>
          <p className="text-xs text-muted">Chat with your documents</p>
        </div>
      </div>

      <UploadZone onFiles={onFiles} uploading={uploading} />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Documents{documents.length > 0 && ` · ${documents.length}`}
          </p>
          {documents.length > 0 && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted">
              No documents yet. Upload one to start asking questions.
            </p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {doc.type.toUpperCase()}
                    {doc.pages != null && ` · ${doc.pages} page${doc.pages === 1 ? '' : 's'}`}
                    {` · ${doc.chunks} chunks`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="border-t border-border/70 pt-3 text-[11px] leading-relaxed text-muted">
        Answers are grounded in your files and cite their sources. Powered by Gemini + vector search.
      </p>
    </aside>
  );
}
