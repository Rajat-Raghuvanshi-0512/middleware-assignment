"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
}

export function MarkdownRenderer({
  content,
  className,
  isUserMessage = false,
}: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Style code blocks
          code: (props) => {
            const { className, children } = props;
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <code
                className={cn(
                  "block p-3 rounded-md bg-background/50 dark:bg-background/30 overflow-x-auto text-sm font-mono my-2",
                  className
                )}
              >
                {String(children).replace(/\n$/, "")}
              </code>
            ) : (
              <code
                className={cn(
                  "px-1.5 py-0.5 rounded bg-background/50 dark:bg-background/30 text-sm font-mono",
                  className
                )}
              >
                {children}
              </code>
            );
          },
          // Style pre blocks
          pre: ({ children }) => {
            return <div className="my-2">{children}</div>;
          },
          // Style paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Style lists
          ul: ({ children }) => (
            <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold mb-2 mt-4 first:mt-0">
              {children}
            </h4>
          ),
          // Style links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "underline hover:no-underline transition-colors",
                isUserMessage
                  ? "text-primary-foreground/80 hover:text-primary-foreground"
                  : "text-primary hover:text-primary/80"
              )}
            >
              {children}
            </a>
          ),
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // Style tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-border rounded">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2">{children}</td>
          ),
          // Style horizontal rules
          hr: () => <hr className="my-4 border-t border-border" />,
          // Style strong/bold
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Style emphasis/italic
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

