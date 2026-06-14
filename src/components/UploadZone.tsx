'use client';

import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

const ACCEPT = '.pdf,.docx,.txt,.md';

/** Drag-and-drop / click-to-browse file picker. */
export function UploadZone({
  onFiles,
  uploading,
}: {
  onFiles: (files: File[]) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !uploading) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!uploading) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${
        dragging
          ? 'border-accent bg-accent/10'
          : 'border-border bg-surface-2/50 hover:border-accent/50 hover:bg-surface-2'
      } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      ) : (
        <UploadCloud className="h-6 w-6 text-accent" />
      )}
      <div>
        <p className="text-sm font-medium text-foreground">
          {uploading ? 'Processing…' : 'Drop files or click to upload'}
        </p>
        <p className="mt-0.5 text-xs text-muted">PDF, Word, TXT · up to 4 MB each</p>
      </div>
    </div>
  );
}
