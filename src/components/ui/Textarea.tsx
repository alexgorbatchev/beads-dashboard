import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, JSX } from "react";

const textareaVariants = cva(
  "w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "min-h-24",
        compact: "min-h-20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type TextareaProps = Omit<ComponentProps<"textarea">, "className" | "style"> & VariantProps<typeof textareaVariants>;

export function Textarea({ variant, ...props }: TextareaProps): JSX.Element {
  return <textarea data-testid="Textarea" className={textareaVariants({ variant })} {...props} />;
}
