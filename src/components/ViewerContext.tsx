'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { Source } from '@/lib/types';

/** In-memory handle to an uploaded file, used to render PDFs on demand. */
export type DocBlob = { url: string; type: string; name: string };

type ViewerState = { url: string; name: string; page: number; highlight: string };

// The PDF viewer pulls in pdf.js (browser-only), so load it lazily on the client.
const PdfViewer = dynamic(() => import('./PdfViewer').then((m) => m.PdfViewer), { ssr: false });

type ViewerContextValue = {
  /** Open the PDF viewer at a source's page with its passage highlighted. */
  openSource: (source: Source) => void;
  /** Whether a given document can be opened in the PDF viewer. */
  canView: (documentId: string) => boolean;
};

const ViewerContext = createContext<ViewerContextValue>({
  openSource: () => {},
  canView: () => false,
});

export function useViewer() {
  return useContext(ViewerContext);
}

export function ViewerProvider({
  blobs,
  children,
}: {
  blobs: Record<string, DocBlob>;
  children: ReactNode;
}) {
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  function openSource(source: Source) {
    const blob = blobs[source.documentId];
    if (!blob || blob.type !== 'pdf') return;
    setViewer({
      url: blob.url,
      name: blob.name,
      page: source.page ?? 1,
      highlight: source.snippet,
    });
  }

  function canView(documentId: string) {
    return blobs[documentId]?.type === 'pdf';
  }

  return (
    <ViewerContext.Provider value={{ openSource, canView }}>
      {children}
      {viewer && (
        <PdfViewer
          url={viewer.url}
          name={viewer.name}
          page={viewer.page}
          highlight={viewer.highlight}
          onClose={() => setViewer(null)}
        />
      )}
    </ViewerContext.Provider>
  );
}
