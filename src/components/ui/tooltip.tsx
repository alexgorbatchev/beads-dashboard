import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./buttonVariants";

export function TooltipProvider({ delay = 0, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

export function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

type TooltipTriggerProps = Omit<TooltipPrimitive.Trigger.Props, "className"> & VariantProps<typeof buttonVariants>;

export function TooltipTrigger({ variant, size, isActive, tone, ...props }: TooltipTriggerProps) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      className={buttonVariants({ variant, size, isActive, tone })}
      {...props}
    />
  );
}

export function TooltipPositioner({ className, sideOffset = 8, side, ...props }: TooltipPrimitive.Positioner.Props) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        data-slot="tooltip-positioner"
        sideOffset={sideOffset}
        side={side}
        className={cn("z-50", className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export function TooltipContent({ className, children, ...props }: TooltipPrimitive.Popup.Props) {
  return (
    <TooltipPrimitive.Popup
      data-slot="tooltip-content"
      className={cn(
        "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
        className,
      )}
      {...props}
    >
      {children}
      <TooltipArrow />
    </TooltipPrimitive.Popup>
  );
}

function TooltipArrow({ className, ...props }: TooltipPrimitive.Arrow.Props) {
  return (
    <TooltipPrimitive.Arrow
      data-slot="tooltip-arrow"
      className={cn(
        "bg-primary fill-primary z-50 size-2.5 rotate-45 rounded-[2px]",
        "data-[side=bottom]:-translate-y-1/2 data-[side=bottom]:top-px",
        "data-[side=top]:translate-y-1/2 data-[side=top]:bottom-px",
        "data-[side=left]:translate-x-1/2 data-[side=left]:right-px",
        "data-[side=right]:-translate-x-1/2 data-[side=right]:left-px",
        className,
      )}
      {...props}
    />
  );
}
