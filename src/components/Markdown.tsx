"use client";

import DOMPurify from "dompurify";
import { Children, isValidElement, memo, useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/** A figure drawn by the model. Sanitized: only inert SVG is kept. */
function Figure({ code }: { code: string }) {
  const html = useMemo(() => {
    if (!code.includes("</svg>")) return "";
    return DOMPurify.sanitize(code, {
      USE_PROFILES: { svg: true, svgFilters: false },
      FORBID_TAGS: ["a", "image", "use", "foreignObject", "style"],
    });
  }, [code]);
  if (!html) return null;
  return <div className="figure" dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
}

type CodeProps = { className?: string; children?: ReactNode };

function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          pre({ children }) {
            const child = Children.toArray(children)[0];
            if (isValidElement<CodeProps>(child)) {
              const code = String(child.props.children ?? "");
              if (/language-svg/.test(child.props.className ?? "")) return <Figure code={code} />;
              return (
                <pre>
                  <code>{code}</code>
                </pre>
              );
            }
            return <pre>{children}</pre>;
          },
          // Inline code is how the paper writes the mark of a question.
          code({ children }) {
            return <span className="mark">{children}</span>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
