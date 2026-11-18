import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { buttonVariants } from "./buttonVariants";

export function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

type DialogTriggerProps = Omit<DialogPrimitive.Trigger.Props, "className" | "style"> & VariantProps<typeof buttonVariants>;

export function DialogTrigger({ variant, size, isActive, tone, ...props }: DialogTriggerProps): React.JSX.Element {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      className={buttonVariants({ variant, size, isActive, tone })}
      {...props}
    />
  );
}

export function DialogPortal({ ...props }: DialogPrimitive.Portal.Props): React.JSX.Element {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

type DialogCloseProps = Omit<DialogPrimitive.Close.Props, "className" | "style">;

export function DialogClose({ ...props }: DialogCloseProps): React.JSX.Element {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

type DialogOverlayProps = Omit<DialogPrimitive.Backdrop.Props, "className" | "style">;

export function DialogOverlay({ ...props }: DialogOverlayProps): React.JSX.Element {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className="data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:animation-duration-[200ms] fixed inset-0 z-50 bg-black/50"
      {...props}
    />
  );
}

const dialogContentVariants = cva(
  "data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95 data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200",
  {
    variants: {
      size: {
        default: "sm:max-w-lg",
        form: "sm:max-w-[500px]",
        wide: "sm:max-w-[720px]",
      },
      surface: {
        default: "bg-background",
        deep: "border-border bg-deep",
      },
    },
    defaultVariants: {
      size: "default",
      surface: "default",
    },
  },
);

type DialogContentProps = Omit<DialogPrimitive.Popup.Props, "className" | "style"> &
  VariantProps<typeof dialogContentVariants> & { showCloseButton?: boolean };

export function DialogContent({ children, showCloseButton = true, size, surface, ...props }: DialogContentProps): React.JSX.Element {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={dialogContentVariants({ size, surface })}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[open]:bg-accent data-[open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

type DialogHeaderProps = Omit<React.ComponentProps<"div">, "className" | "style">;

export function DialogHeader({ ...props }: DialogHeaderProps): React.JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      data-testid="DialogHeader"
      className="flex flex-col gap-2 text-center sm:text-left"
      {...props}
    />
  );
}

type DialogFooterProps = Omit<React.ComponentProps<"div">, "className" | "style">;

export function DialogFooter({ ...props }: DialogFooterProps): React.JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      data-testid="DialogFooter"
      className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
      {...props}
    />
  );
}

const dialogTitleVariants = cva("text-lg leading-none font-semibold", {
  variants: {
    tone: {
      default: "text-foreground",
      primary: "text-primary",
    },
    layout: {
      default: "",
      inlineIcon: "flex items-center gap-2",
    },
  },
  defaultVariants: {
    tone: "default",
    layout: "default",
  },
});

type DialogTitleProps = Omit<DialogPrimitive.Title.Props, "className" | "style"> &
  VariantProps<typeof dialogTitleVariants>;

export function DialogTitle({ tone, layout, ...props }: DialogTitleProps): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={dialogTitleVariants({ tone, layout })}
      {...props}
    />
  );
}

type DialogDescriptionProps = Omit<DialogPrimitive.Description.Props, "className" | "style">;

export function DialogDescription({ ...props }: DialogDescriptionProps): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className="text-muted-foreground text-sm"
      {...props}
    />
  );
}
