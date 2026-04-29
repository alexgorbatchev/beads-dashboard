import type { ReactElement } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const markdownContentVariants = cva("markdown-content text-sm text-secondary leading-relaxed", {
  variants: {
    variant: {
      default: "",
      codePanel: "bg-surface p-3 text-xs font-mono overflow-x-auto rounded-lg",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface IMarkdownContentProps extends VariantProps<typeof markdownContentVariants> {
  content: string;
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

export function MarkdownContent({ content, variant }: IMarkdownContentProps): ReactElement {
  return (
    <div
      data-testid="MarkdownContent"
      className={markdownContentVariants({ variant })}
    >
      <Markdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins}>
        {content}
      </Markdown>
    </div>
  );
}
