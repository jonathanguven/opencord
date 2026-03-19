import { CheckIcon, CopyIcon } from "lucide-react";
import { Children, isValidElement, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRAILING_NEWLINE_PATTERN = /\n$/;

interface MessageMarkdownProps {
  body: string;
  className?: string;
}

export function MessageMarkdown({ body, className }: MessageMarkdownProps) {
  return (
    <div
      className={cn(
        "message-markdown text-foreground/95 text-sm leading-5",
        className
      )}
    >
      <ReactMarkdown
        components={{
          a: ({ className: linkClassName, ...props }) => (
            <a
              {...props}
              className={cn(
                "font-medium text-primary underline underline-offset-2",
                linkClassName
              )}
              rel="noopener noreferrer"
              target="_blank"
            />
          ),
          code: ({ children, className: codeClassName, ...props }) => (
            <code
              {...props}
              className={cn(
                "rounded-md bg-muted px-1 py-0.5 font-mono text-[0.8125rem]",
                codeClassName
              )}
            >
              {children}
            </code>
          ),
          p: ({ className: paragraphClassName, ...props }) => (
            <p {...props} className={cn("min-w-0", paragraphClassName)} />
          ),
          pre: ({ children }) => {
            const firstChild = Children.toArray(children)[0];

            if (
              isValidElement<{
                children?: React.ReactNode;
                className?: string;
              }>(firstChild)
            ) {
              return (
                <CodeBlock className={firstChild.props.className}>
                  {firstChild.props.children}
                </CodeBlock>
              );
            }

            return <CodeBlock>{children}</CodeBlock>;
          },
        }}
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsCopied(false);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  const languageLabel = className?.replace("language-", "") ?? "";
  const codeText = getCodeText(children);

  return (
    <div className="group/code relative min-w-0 overflow-hidden rounded-lg border border-border/80 bg-card/90">
      {languageLabel ? (
        <span className="pointer-events-none absolute top-3 left-3 truncate font-medium text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
          {languageLabel}
        </span>
      ) : null}
      <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-focus-within/code:opacity-100 group-hover/code:opacity-100">
        <Button
          aria-label={isCopied ? "Copied code block" : "Copy code block"}
          className="size-7 rounded-md border border-border/70 bg-background/60 text-muted-foreground opacity-100 backdrop-blur-sm hover:bg-background/80 hover:text-foreground"
          onClick={async () => {
            await navigator.clipboard.writeText(codeText);
            setIsCopied(true);
          }}
          size="icon-sm"
          type="button"
          variant="plain"
        >
          {isCopied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </Button>
      </div>
      <pre
        className={cn(
          "min-w-0 overflow-x-auto p-3 pr-12",
          languageLabel ? "pt-8" : "pt-3"
        )}
      >
        <code
          className={cn(
            "block whitespace-pre font-mono text-[0.8125rem] leading-5",
            className
          )}
        >
          {children}
        </code>
      </pre>
    </div>
  );
}

function getCodeText(children: React.ReactNode) {
  let rawText = "";

  if (typeof children === "string") {
    rawText = children;
  } else if (Array.isArray(children)) {
    rawText = children.join("");
  } else {
    rawText = String(children);
  }

  return rawText.replace(TRAILING_NEWLINE_PATTERN, "");
}
