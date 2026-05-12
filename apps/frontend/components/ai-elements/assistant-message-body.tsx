"use client";

import { streamdownPlugins } from "@/components/ai-elements/streamdown-config";
import { cn } from "@/lib/utils";
import type { Components } from "streamdown";
import { memo, useMemo } from "react";
import { Streamdown } from "streamdown";

export type AssistantMessageBodyProps = {
  content: string;
  className?: string;
};

const headingTone = "font-semibold tracking-tight text-zinc-900";

const assistantMarkdownComponents: Components = {
  h1: ({ children, className, ...props }) => (
    <h1
      className={cn("mt-1 mb-2 text-[1.25rem] leading-snug first:mt-0", headingTone, className)}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, className, ...props }) => (
    <h2
      className={cn("mt-6 mb-2 text-[1.0625rem] leading-snug first:mt-0", headingTone, className)}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }) => (
    <h3
      className={cn("mt-5 mb-1.5 text-[1rem] leading-snug first:mt-0", headingTone, className)}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, className, ...props }) => (
    <h4
      className={cn("mt-4 mb-1.5 text-[0.9375rem] leading-snug first:mt-0", headingTone, className)}
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, className, ...props }) => (
    <p
      className={cn(
        "my-2.5 text-[15px] leading-[1.6] text-zinc-800 first:mt-0 last:mb-0 motion-safe:transition-[color] motion-safe:duration-150",
        className
      )}
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, className, ...props }) => (
    <ul
      className={cn(
        "my-2.5 list-disc pl-5 text-[15px] leading-[1.6] text-zinc-800 marker:text-zinc-400 first:mt-0 last:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, className, ...props }) => (
    <ol
      className={cn(
        "my-2.5 list-decimal pl-5 text-[15px] leading-[1.6] text-zinc-800 marker:font-medium marker:text-zinc-500 first:mt-0 last:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => (
    <li
      className={cn(
        "my-1 pl-0.5 [&>input[type='checkbox']]:mr-2.5 [&>input[type='checkbox']]:size-4 [&>input[type='checkbox']]:translate-y-0.5 [&>input[type='checkbox']]:rounded-sm",
        className
      )}
      {...props}
    >
      {children}
    </li>
  ),
  blockquote: ({ children, className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-l-[3px] border-zinc-200 pl-4 text-[15px] leading-[1.6] text-zinc-600 italic first:mt-0 last:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-6 border-0 border-t border-zinc-200/90", className)} {...props} />
  ),
  strong: ({ children, className, ...props }) => (
    <strong className={cn("font-semibold text-zinc-900", className)} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, className, ...props }) => (
    <em className={cn("italic text-zinc-800", className)} {...props}>
      {children}
    </em>
  ),
  code: ({ children, className, ...props }) => (
    <code
      className={cn(
        "rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.8125em] text-zinc-900 [pre>&]:rounded-none [pre>&]:bg-transparent [pre>&]:px-0 [pre>&]:py-0 [pre>&]:text-[13px]",
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, className, ...props }) => (
    <pre
      className={cn(
        "my-3 max-w-full overflow-x-auto rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-3 font-mono text-[13px] leading-relaxed text-zinc-800 [-webkit-overflow-scrolling:touch]",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, className, ...props }) => (
    <div className="my-4 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-100 bg-zinc-50/40 [-webkit-overflow-scrolling:touch]">
      <table
        className={cn(
          "w-full min-w-[260px] border-collapse text-left text-[13px] leading-snug text-zinc-800",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  a: ({ children, className, ...props }) => (
    <a
      className={cn(
        "font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-[3px] transition-colors motion-safe:duration-150 hover:decoration-zinc-500 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
        className
      )}
      {...props}
    >
      {children}
    </a>
  ),
};

export const AssistantMessageBody = memo(function AssistantMessageBody({
  content,
  className,
}: AssistantMessageBodyProps) {
  const components = useMemo(() => assistantMarkdownComponents, []);

  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "assistant-message-body min-w-0 max-w-full text-left font-sans antialiased",
        className
      )}
    >
      <Streamdown
        mode="static"
        animated={false}
        plugins={streamdownPlugins}
        lineNumbers={false}
        components={components}
        className="assistant-streamdown text-[15px] leading-[1.6] text-zinc-800"
      >
        {content}
      </Streamdown>
    </div>
  );
});

AssistantMessageBody.displayName = "AssistantMessageBody";
