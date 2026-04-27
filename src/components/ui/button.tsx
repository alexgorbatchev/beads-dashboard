import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { buttonVariants } from "./buttonVariants";

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    ref?: React.RefObject<HTMLButtonElement | null>;
  };

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-testid="Button"
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
