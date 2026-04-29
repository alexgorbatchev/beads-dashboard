import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import type { JSX } from "react";

type TabsProps = Omit<TabsPrimitive.Root.Props, "className" | "style">;
type TabsListProps = Omit<TabsPrimitive.List.Props, "className" | "style">;
type TabsTriggerProps = Omit<TabsPrimitive.Tab.Props, "className" | "style">;
type TabsContentProps = Omit<TabsPrimitive.Panel.Props, "className" | "style">;

export function Tabs({ ...props }: TabsProps): JSX.Element {
  return <TabsPrimitive.Root data-slot="tabs" className="flex flex-col gap-2" {...props} />;
}

export function TabsList({ ...props }: TabsListProps): JSX.Element {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]"
      {...props}
    />
  );
}

export function TabsTrigger({ ...props }: TabsTriggerProps): JSX.Element {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className="data-active:bg-background dark:data-active:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-active:border-input dark:data-active:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-active:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      {...props}
    />
  );
}

export function TabsContent({ ...props }: TabsContentProps): JSX.Element {
  return <TabsPrimitive.Panel data-slot="tabs-content" className="flex-1 outline-none" {...props} />;
}
