import { type VariantProps } from "class-variance-authority";
import { type JSX, type RefObject } from "react";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { buttonVariants } from "./buttonVariants";

export type ButtonProps = Omit<ButtonPrimitive.Props, "className" | "style"> &
  VariantProps<typeof buttonVariants> & {
    ref?: RefObject<HTMLButtonElement | null>;
  };

export function Button({ variant, size, isActive, tone, ...props }: ButtonProps): JSX.Element {
  return (
    <ButtonPrimitive
      data-testid="Button"
      data-slot="button"
      className={buttonVariants({ variant, size, isActive, tone })}
      {...props}
    />
  );
}
