import type { ReactElement } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface IMarkdownContentProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  a({ node, className, ...props }) {
    void node;

    return (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("text-accent hover:underline break-all", className)}
      />
    );
  },
};

const markdownRemarkPlugins = [remarkGfm, remarkBreaks];

export function MarkdownContent({ content, className }: IMarkdownContentProps): ReactElement {
  return (
    <div
      data-testid="MarkdownContent"
      className={cn("markdown-content text-sm text-secondary leading-relaxed", className)}
    >
      <Markdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins}>
        {content}
      </Markdown>
    </div>
  );
}
