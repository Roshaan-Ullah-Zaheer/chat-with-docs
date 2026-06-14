import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Renders an assistant answer as styled markdown (see `.markdown` in globals.css). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Open any links the model produces in a new tab.
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
