import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./buttonVariants";

export function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

type DropdownMenuTriggerProps = Omit<MenuPrimitive.Trigger.Props, "className" | "style"> &
  VariantProps<typeof buttonVariants>;

export function DropdownMenuTrigger({
  variant,
  size,
  isActive,
  tone,
  ...props
}: DropdownMenuTriggerProps): React.JSX.Element {
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={buttonVariants({ variant, size, isActive, tone })}
      {...props}
    />
  );
}

type DropdownMenuPositionerProps = Omit<MenuPrimitive.Positioner.Props, "className" | "style">;

export function DropdownMenuPositioner({
  sideOffset = 4,
  side,
  align,
  ...props
}: DropdownMenuPositionerProps): React.JSX.Element {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        data-slot="dropdown-menu-positioner"
        sideOffset={sideOffset}
        side={side}
        align={align}
        className="z-50"
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

const dropdownMenuContentVariants = cva(
  "bg-popover text-popover-foreground data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
  {
    variants: {
      width: {
        default: "",
        compact: "w-36",
        narrow: "w-40",
      },
    },
    defaultVariants: {
      width: "default",
    },
  },
);

type DropdownMenuContentProps = Omit<MenuPrimitive.Popup.Props, "className" | "style"> &
  VariantProps<typeof dropdownMenuContentVariants>;

export function DropdownMenuContent({ width, ...props }: DropdownMenuContentProps): React.JSX.Element {
  return (
    <MenuPrimitive.Popup
      data-slot="dropdown-menu-content"
      className={dropdownMenuContentVariants({ width })}
      {...props}
    />
  );
}

export function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

type DropdownMenuItemVariant = "default" | "destructive";

interface IDropdownMenuItemProps extends Omit<MenuPrimitive.Item.Props, "className" | "style"> {
  inset?: boolean;
  variant?: DropdownMenuItemVariant;
  selected?: boolean;
}

export function DropdownMenuItem({ inset, variant = "default", selected = false, ...props }: IDropdownMenuItemProps): React.JSX.Element {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      data-selected={selected}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[selected=true]:bg-surface data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      )}
      {...props}
    />
  );
}

type DropdownMenuCheckboxItemProps = Omit<MenuPrimitive.CheckboxItem.Props, "className" | "style">;

export function DropdownMenuCheckboxItem({ children, checked, ...props }: DropdownMenuCheckboxItemProps): React.JSX.Element {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon className="size-4" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

type DropdownMenuRadioItemProps = Omit<MenuPrimitive.RadioItem.Props, "className" | "style">;

export function DropdownMenuRadioItem({ children, ...props }: DropdownMenuRadioItemProps): React.JSX.Element {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className="focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.RadioItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

interface IDropdownMenuLabelProps extends Omit<MenuPrimitive.GroupLabel.Props, "className" | "style"> {
  inset?: boolean;
}

export function DropdownMenuLabel({ inset, ...props }: IDropdownMenuLabelProps): React.JSX.Element {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className="px-2 py-1.5 text-sm font-medium data-[inset]:pl-8"
      {...props}
    />
  );
}

type DropdownMenuSeparatorProps = Omit<MenuPrimitive.Separator.Props, "className" | "style">;

export function DropdownMenuSeparator({ ...props }: DropdownMenuSeparatorProps): React.JSX.Element {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className="bg-border -mx-1 my-1 h-px"
      {...props}
    />
  );
}

type DropdownMenuShortcutProps = Omit<React.ComponentProps<"span">, "className" | "style">;

export function DropdownMenuShortcut({ ...props }: DropdownMenuShortcutProps): React.JSX.Element {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      data-testid="DropdownMenuShortcut"
      className="text-muted-foreground ml-auto text-xs tracking-widest"
      {...props}
    />
  );
}

export function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

interface IDropdownMenuSubTriggerProps extends Omit<MenuPrimitive.SubmenuTrigger.Props, "className" | "style"> {
  inset?: boolean;
}

export function DropdownMenuSubTrigger({ inset, children, ...props }: IDropdownMenuSubTriggerProps): React.JSX.Element {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className="focus:bg-accent focus:text-accent-foreground data-[open]:bg-accent data-[open]:text-accent-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground"
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

type DropdownMenuSubContentProps = Omit<MenuPrimitive.Popup.Props, "className" | "style">;

export function DropdownMenuSubContent({ ...props }: DropdownMenuSubContentProps): React.JSX.Element {
  return (
    <MenuPrimitive.Popup
      data-slot="dropdown-menu-sub-content"
      className="bg-popover text-popover-foreground data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--transform-origin) overflow-hidden rounded-md border p-1 shadow-lg"
      {...props}
    />
  );
}
