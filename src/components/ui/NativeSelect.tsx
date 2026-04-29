import type { ComponentProps, JSX } from "react";

type NativeSelectProps = Omit<ComponentProps<"select">, "className" | "style">;

export function NativeSelect({ ...props }: NativeSelectProps): JSX.Element {
  return (
    <select
      data-testid="NativeSelect"
      className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
}
