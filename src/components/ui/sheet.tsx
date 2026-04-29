import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { buttonVariants } from "./buttonVariants";

export function Sheet({ ...props }: SheetPrimitive.Root.Props): React.JSX.Element {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

type SheetTriggerProps = Omit<SheetPrimitive.Trigger.Props, "className" | "style"> &
  VariantProps<typeof buttonVariants>;

export function SheetTrigger({ variant, size, isActive, tone, ...props }: SheetTriggerProps): React.JSX.Element {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" className={buttonVariants({ variant, size, isActive, tone })} {...props} />;
}

type SheetCloseProps = Omit<SheetPrimitive.Close.Props, "className" | "style">;

export function SheetClose({ ...props }: SheetCloseProps): React.JSX.Element {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props): React.JSX.Element {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

type SheetOverlayProps = Omit<SheetPrimitive.Backdrop.Props, "className" | "style">;

function SheetOverlay({ ...props }: SheetOverlayProps): React.JSX.Element {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className="data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:animation-duration-[300ms] data-[open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
      {...props}
    />
  );
}

const sheetContentVariants = cva(
  "data-[open]:animate-in data-[closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[closed]:duration-300 data-[open]:duration-500",
  {
    variants: {
      side: {
        right: "data-[closed]:slide-out-to-right data-[open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
        left: "data-[closed]:slide-out-to-left data-[open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        top: "data-[closed]:slide-out-to-top data-[open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
        bottom: "data-[closed]:slide-out-to-bottom data-[open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
      },
      size: {
        default: "",
        detail: "w-[500px] sm:max-w-[500px]",
      },
      surface: {
        default: "bg-background",
        deep: "border-border bg-deep p-0",
      },
    },
    defaultVariants: {
      side: "right",
      size: "default",
      surface: "default",
    },
  },
);

type SheetContentProps = Omit<SheetPrimitive.Popup.Props, "className" | "style"> &
  VariantProps<typeof sheetContentVariants> & {
  side?: "top" | "right" | "bottom" | "left";
};

export function SheetContent({ children, side = "right", size, surface, ...props }: SheetContentProps): React.JSX.Element {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={sheetContentVariants({ side, size, surface })}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[open]:bg-secondary absolute top-4 right-4 rounded-md p-1.5 text-muted transition-colors hover:bg-surface focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

const sheetHeaderVariants = cva("flex flex-col gap-1.5 p-4", {
  variants: {
    variant: {
      default: "",
      detail: "shrink-0 border-b border-border pr-12",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type SheetHeaderProps = Omit<React.ComponentProps<"div">, "className" | "style"> &
  VariantProps<typeof sheetHeaderVariants>;

export function SheetHeader({ variant, ...props }: SheetHeaderProps): React.JSX.Element {
  return (
    <div
      data-slot="sheet-header"
      data-testid="SheetHeader"
      className={sheetHeaderVariants({ variant })}
      {...props}
    />
  );
}

type SheetFooterProps = Omit<React.ComponentProps<"div">, "className" | "style">;

export function SheetFooter({ ...props }: SheetFooterProps): React.JSX.Element {
  return (
    <div
      data-slot="sheet-footer"
      data-testid="SheetFooter"
      className="mt-auto flex flex-col gap-2 p-4"
      {...props}
    />
  );
}

const sheetTitleVariants = cva("font-semibold", {
  variants: {
    tone: {
      default: "text-foreground",
      primary: "text-primary",
    },
    size: {
      default: "",
      lg: "text-lg",
    },
    align: {
      default: "",
      left: "text-left",
    },
    interaction: {
      default: "",
      editable: "group cursor-pointer hover:text-accent",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "default",
    align: "default",
    interaction: "default",
  },
});

type SheetTitleProps = Omit<SheetPrimitive.Title.Props, "className" | "style"> &
  VariantProps<typeof sheetTitleVariants>;

export function SheetTitle({ tone, size, align, interaction, ...props }: SheetTitleProps): React.JSX.Element {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={sheetTitleVariants({ tone, size, align, interaction })}
      {...props}
    />
  );
}

type SheetDescriptionProps = Omit<SheetPrimitive.Description.Props, "className" | "style">;

export function SheetDescription({ ...props }: SheetDescriptionProps): React.JSX.Element {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className="text-muted-foreground text-sm"
      {...props}
    />
  );
}
