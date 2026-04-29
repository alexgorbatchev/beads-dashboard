import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import type { JSX, RefAttributes } from "react";

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex w-full min-w-0 border transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "h-9 rounded-md bg-transparent px-3 py-1 text-base shadow-xs dark:bg-input/30 md:text-sm",
        surface:
          "h-9 rounded-lg border-border bg-surface px-3 py-1 text-sm text-primary placeholder:text-muted focus-visible:ring-accent/50",
        title:
          "h-9 flex-1 rounded border-border bg-surface px-2 py-1 text-lg font-semibold text-primary focus-visible:ring-accent/50",
        compact:
          "h-6 w-24 rounded border-border bg-surface px-2 py-1 text-xs text-primary focus-visible:ring-accent/50",
        dateTime: "h-7 w-auto rounded border-border bg-surface px-2 py-1 text-xs text-primary focus-visible:ring-accent/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type InputProps = Omit<InputPrimitive.Props, "className" | "style"> &
  RefAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

export function Input({ type, variant, ...props }: InputProps): JSX.Element {
  return (
    <InputPrimitive
      type={type}
      data-testid="Input"
      data-slot="input"
      className={inputVariants({ variant })}
      {...props}
    />
  );
}
