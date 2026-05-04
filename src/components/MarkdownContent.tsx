import type { ReactElement } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const markdownContentBaseClassName = [
  "text-sm leading-relaxed text-secondary",
  "[&>*+*]:mt-3",
  "[&_h1]:text-base [&_h2]:text-[0.9375rem] [&_h3]:text-sm [&_h4]:text-sm [&_h5]:text-sm [&_h6]:text-sm",
  "[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold",
  "[&_h1]:leading-[1.4] [&_h2]:leading-[1.4] [&_h3]:leading-[1.4] [&_h4]:leading-[1.4] [&_h5]:leading-[1.4] [&_h6]:leading-[1.4]",
  "[&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li+li]:mt-1",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface [&_pre]:p-3",
  "[&_code]:rounded-sm [&_code]:bg-surface [&_code]:px-[0.3rem] [&_code]:py-[0.1rem] [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary",
  "[&_pre_code]:block [&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:block [&_table]:w-full [&_table]:overflow-x-auto",
  "[&_th]:border [&_td]:border [&_th]:border-border [&_td]:border-border [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-1.5 [&_td]:py-1.5",
  "[&_th]:text-left [&_td]:text-left [&_th]:align-top [&_td]:align-top [&_th]:font-semibold [&_th]:text-primary",
  "[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border",
  "[&_input[type='checkbox']]:mr-2 [&_input[type='checkbox']]:pointer-events-none",
].join(" ");

const markdownContentVariants = cva(markdownContentBaseClassName, {
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
    <div data-testid="MarkdownContent" className={markdownContentVariants({ variant })}>
      <Markdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins}>
        {content}
      </Markdown>
    </div>
  );
}
