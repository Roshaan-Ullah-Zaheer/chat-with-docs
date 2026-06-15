'use client';

import { useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Load the PDF.js worker from a CDN (matches the installed version, no bundling).
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return '&quot;';
    }
  });
}

/**
 * Full PDF page viewer that highlights the exact passage an answer was drawn
 * from. Opened when a user clicks a citation that points to a PDF document.
 */
export function PdfViewer({
  url,
  name,
  page,
  highlight,
  onClose,
}: {
  url: string;
  name: string;
  page: number;
  highlight: string;
  onClose: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(page);

  // Normalised passage text used to decide which words to highlight.
  const needle = useMemo(() => highlight.toLowerCase().replace(/\s+/g, ' '), [highlight]);

  const textRenderer = useMemo(() => {
    return (item: { str: string }) => {
      const word = item.str.trim().toLowerCase();
      if (word.length > 2 && needle.includes(word)) {
        return `<mark class="pdf-hl">${escapeHtml(item.str)}</mark>`;
      }
      return escapeHtml(item.str);
    };
  }, [needle]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-muted">
              Page {current}
              {numPages ? ` of ${numPages}` : ''} · highlighted passage
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrent((c) => Math.max(1, c - 1))}
              disabled={current <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent((c) => Math.min(numPages || c, c + 1))}
              disabled={!!numPages && current >= numPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 justify-center overflow-auto bg-[#0b1120] p-4">
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<ViewerSpinner />}
            error={<p className="p-8 text-sm text-red-300">Couldn&apos;t load this PDF.</p>}
          >
            <Page
              pageNumber={current}
              width={680}
              customTextRenderer={textRenderer}
              renderAnnotationLayer={false}
              loading={<ViewerSpinner />}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

function ViewerSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  );
}
