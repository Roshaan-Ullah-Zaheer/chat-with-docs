import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Source } from '@/lib/types';

/**
 * Convert inline citation markers like `[1]` or `[1, 2]` into individual
 * `cite:n` links that we render as interactive chips.
 */
function linkifyCitations(text: string, hasSources: boolean): string {
  if (!hasSources) return text;
  return text.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_match, group: string) =>
    group
      .split(',')
      .map((n) => `[${n.trim()}](cite:${n.trim()})`)
      .join(''),
  );
}

/** Renders an assistant answer as styled markdown with clickable citations. */
export function Markdown({
  children,
  sources,
  onCite,
}: {
  children: string;
  sources?: Source[];
  onCite?: (ref: number) => void;
}) {
  const hasSources = !!(sources && sources.length > 0);
  const byRef = new Map((sources ?? []).map((s) => [s.ref, s]));
  const content = linkifyCitations(children, hasSources);

  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (url.startsWith('cite:') ? url : defaultUrlTransform(url))}
        components={{
          a: ({ href, children: label, ...props }) => {
            if (href && href.startsWith('cite:')) {
              const ref = Number(href.slice('cite:'.length));
              const src = byRef.get(ref);
              const tip = src
                ? `${src.documentName}${src.page != null ? ` · p.${src.page}` : ''} — ${src.snippet}`
                : undefined;
              return (
                <button
                  type="button"
                  onClick={() => onCite?.(ref)}
                  title={tip}
                  className="mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-accent/25 px-1 align-[1px] text-[10px] font-bold text-[#c7d2fe] transition-colors hover:bg-accent/50"
                >
                  {label}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {label}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
