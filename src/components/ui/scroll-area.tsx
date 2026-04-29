import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ScrollBar } from "./scroll-bar";

const scrollAreaVariants = cva("relative", {
  variants: {
    layout: {
      default: "",
      fill: "min-h-0 flex-1",
    },
    overflow: {
      default: "",
      hidden: "overflow-hidden",
    },
    paddingX: {
      none: "",
      sidebar: "px-2",
    },
    demo: {
      none: "",
      default: "h-32 w-64 rounded-md border",
      horizontal: "h-32 w-40 rounded-md border",
    },
  },
  defaultVariants: {
    layout: "default",
    overflow: "default",
    paddingX: "none",
    demo: "none",
  },
});

type ScrollAreaProps = Omit<ScrollAreaPrimitive.Root.Props, "className" | "style"> &
  VariantProps<typeof scrollAreaVariants>;

export function ScrollArea({ children, layout, overflow, paddingX, demo, ...props }: ScrollAreaProps): React.JSX.Element {
  return (
    <ScrollAreaPrimitive.Root
      data-testid="ScrollArea"
      data-slot="scroll-area"
      className={cn(scrollAreaVariants({ layout, overflow, paddingX, demo }))}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
