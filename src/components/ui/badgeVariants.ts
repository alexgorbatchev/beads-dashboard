import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow,background-color] overflow-hidden disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      state: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        label: "border-transparent bg-secondary text-secondary-foreground",
        removableLabel: "border-transparent bg-secondary text-secondary-foreground pr-1",
        filter: "cursor-pointer text-foreground hover:bg-surface",
        filterActive: "cursor-pointer border-transparent bg-accent text-white hover:bg-accent/80",
        statusOpen: "border-transparent bg-[var(--color-status-open)]/10 text-[var(--color-status-open)]",
        statusProgress:
          "border-[var(--color-status-progress)]/30 bg-[var(--color-status-progress)]/20 text-[var(--color-status-progress)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-status-progress)_20%,transparent)]",
        statusClosed: "border-transparent bg-[var(--color-status-closed)]/10 text-[var(--color-status-closed)]",
        statusBlocked: "border-transparent bg-red-500/10 text-red-500",
        statusDeferred: "border-transparent bg-gray-500/10 text-gray-500",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);
