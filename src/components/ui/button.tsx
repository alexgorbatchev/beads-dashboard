import { type VariantProps } from "class-variance-authority";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./buttonVariants";

export type ButtonProps = Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    ref?: React.RefObject<HTMLButtonElement | null>;
  };

export function Button({ variant, size, isActive, tone, className, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-testid="Button"
      data-slot="button"
      className={cn(buttonVariants({ variant, size, isActive, tone }), className)}
      {...props}
    />
  );
}
