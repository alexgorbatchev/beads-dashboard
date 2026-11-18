import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type { JSX } from "react";

type SeparatorProps = Omit<SeparatorPrimitive.Props, "className" | "style">;

export function Separator({ ...props }: SeparatorProps): JSX.Element {
  return (
    <SeparatorPrimitive
      data-testid="Separator"
      data-slot="separator"
      className="bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px"
      {...props}
    />
  );
}
