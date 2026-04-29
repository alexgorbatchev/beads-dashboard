import { GripVertical, Search, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import type { DragEventHandler, FormEventHandler, JSX, KeyboardEventHandler, PointerEventHandler, ReactNode } from "react";

import type { IssueStatus } from "@/types";
import { cn } from "@/lib/utils";

type StatusTone = IssueStatus | "ready" | "overdue";
type IconTone = VariantProps<typeof iconVariants>["tone"];

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
      xl: "size-6",
    },
    tone: {
      default: "text-current",
      muted: "text-muted",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      success: "text-[var(--color-status-closed)]",
      warning: "text-[var(--color-priority-high)]",
      danger: "text-destructive",
      open: "text-[var(--color-status-open)]",
      in_progress: "text-[var(--color-status-progress)] status-dot active",
      closed: "text-[var(--color-status-closed)]",
      blocked: "text-destructive",
      deferred: "text-muted",
      ready: "text-[var(--color-status-closed)]",
      overdue: "text-destructive",
      priorityUrgent: "text-[var(--color-priority-urgent)]",
      priorityHigh: "text-[var(--color-priority-high)]",
      priorityMedium: "text-[var(--color-priority-medium)]",
      priorityLow: "text-[var(--color-priority-low)]",
    },
    animation: {
      none: "",
      spin: "animate-spin",
    },
    placement: {
      default: "",
      search: "absolute top-1/2 left-3 -translate-y-1/2",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
    animation: "none",
    placement: "default",
  },
});

interface IAppPrimitivesIconProps extends VariantProps<typeof iconVariants> {
  icon: LucideIcon;
  dataIcon?: "inline-start" | "inline-end";
}

function AppPrimitivesIcon({
  icon: IconComponent,
  size,
  tone,
  animation,
  placement,
  dataIcon,
}: IAppPrimitivesIconProps): JSX.Element {
  return (
    <IconComponent
      data-testid="AppPrimitivesIcon"
      data-icon={dataIcon}
      className={iconVariants({ size, tone, animation, placement })}
    />
  );
}

const textVariants = cva("", {
  variants: {
    variant: {
      title: "text-lg font-semibold text-primary",
      body: "text-sm text-secondary",
      bodyPrimary: "text-sm text-primary",
      muted: "text-xs text-muted",
      monoMuted: "font-mono text-xs text-muted",
      monoSecondary: "font-mono text-xs text-secondary",
      tinyMuted: "text-[10px] text-muted uppercase tracking-wider",
      sectionLabel: "text-xs font-medium text-muted uppercase tracking-wider",
      sectionLabelOpen: "text-xs font-medium uppercase tracking-wider text-[var(--color-status-open)]",
      sectionLabelProgress: "text-xs font-medium uppercase tracking-wider text-[var(--color-status-progress)]",
      sectionLabelBlocked: "text-xs font-medium uppercase tracking-wider text-destructive",
      sectionLabelDeferred: "text-xs font-medium uppercase tracking-wider text-muted",
      sectionLabelClosed: "text-xs font-medium uppercase tracking-wider text-[var(--color-status-closed)]",
      danger: "text-sm text-destructive",
      warning: "text-sm text-[var(--color-priority-high)]",
      success: "text-sm text-[var(--color-status-closed)]",
      projectValid: "text-xs text-[var(--color-status-closed)]",
      projectWarning: "text-xs text-[var(--color-priority-high)]",
      statHeader: "text-xs font-medium text-primary",
      statValue: "text-lg font-bold text-primary",
      statValueSuccess: "text-lg font-bold text-[var(--color-status-closed)]",
      statLabel: "text-[10px] text-muted uppercase tracking-wider",
      brand: "text-sm font-semibold",
      navTitle: "text-sm text-primary",
      navTitleStrong: "text-sm font-medium text-primary",
      issueRowId: "max-w-32 shrink-0 font-mono text-xs text-muted",
      issueRowTitle: "flex-1 text-sm text-primary",
      issueRowDescription: "mt-1 text-xs leading-relaxed text-secondary",
      issueRowTime: "w-12 shrink-0 text-right font-mono text-xs text-muted",
      issueType: "text-[10px] font-mono text-muted uppercase",
      kanbanTitle: "text-sm text-primary line-clamp-2",
      kanbanEmpty: "py-8 text-center text-xs text-muted",
      kanbanDropHint: "py-8 text-center text-xs text-accent",
      kanbanCount: "ml-auto font-mono text-xs text-muted",
    },
    wrap: {
      default: "",
      truncate: "truncate",
      breakAll: "break-all",
      noWrap: "whitespace-nowrap",
    },
    align: {
      default: "",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: {
    variant: "body",
    wrap: "default",
    align: "default",
  },
});

interface IAppPrimitivesTextProps extends VariantProps<typeof textVariants> {
  as?: "span" | "p" | "div" | "code" | "h1";
  children: ReactNode;
  title?: string;
}

function AppPrimitivesText({
  as = "span",
  variant,
  wrap,
  align,
  children,
  title,
}: IAppPrimitivesTextProps): JSX.Element {
  const className = textVariants({ variant, wrap, align });

  if (as === "p") {
    return (
      <p data-testid="AppPrimitivesText" className={className} title={title}>
        {children}
      </p>
    );
  }

  if (as === "div") {
    return (
      <div data-testid="AppPrimitivesText" className={className} title={title}>
        {children}
      </div>
    );
  }

  if (as === "code") {
    return (
      <code data-testid="AppPrimitivesText" className={cn("block overflow-x-auto rounded bg-surface px-2 py-1", className)} title={title}>
        {children}
      </code>
    );
  }

  if (as === "h1") {
    return (
      <h1 data-testid="AppPrimitivesText" className={className} title={title}>
        {children}
      </h1>
    );
  }

  return (
    <span data-testid="AppPrimitivesText" className={className} title={title}>
      {children}
    </span>
  );
}

const stackVariants = cva("", {
  variants: {
    variant: {
      form: "mt-4 flex flex-col gap-4",
      dialogBody: "mt-4 flex flex-col gap-4",
      field: "flex flex-col gap-1.5",
      fieldGrid: "grid grid-cols-2 gap-4",
      row: "flex items-center gap-2",
      rowWide: "flex items-center justify-between gap-4",
      actions: "flex justify-end gap-2 pt-2",
      section: "flex flex-col gap-2",
      spaciousSection: "flex flex-col gap-3",
      list: "flex flex-col gap-1",
      cardList: "flex flex-col gap-3",
      wrap: "flex flex-wrap items-center gap-2",
      centered: "flex items-center justify-center",
      page: "flex h-screen flex-1 flex-col overflow-hidden bg-void",
      settingsRow: "flex items-start gap-2",
      settingsDetails: "flex flex-col gap-1 text-xs text-muted",
      settingsActions: "flex gap-2",
      dialogScroll: "flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1",
      loadingLine: "flex items-center justify-center gap-2 py-12 text-sm text-muted",
      statsBody: "flex flex-col gap-3 p-3 pt-0",
      statsGrid: "grid grid-cols-2 gap-2",
      statRow: "flex items-center gap-2 text-xs",
      statCallout: "flex items-center gap-2",
      panelHeader: "flex items-center justify-between gap-3",
      sidebarHeader: "border-b border-border p-4",
      sidebarHeaderRow: "flex items-center justify-between",
      sidebarBrand: "flex items-center gap-2",
      sidebarActions: "flex items-center gap-1",
      sidebarTopNav: "px-2 pt-3",
      sidebarSectionLabel: "px-4 py-3",
      sidebarProjectList: "flex flex-col gap-0.5 pb-4",
      sidebarStats: "border-t border-border px-2 py-2",
      sidebarFooter: "border-t border-border p-3",
      navTextBlock: "min-w-0 flex-1",
      priorityCompact: "flex h-4 items-center",
      priorityFull: "flex h-full items-stretch py-1",
      issueIconTop: "pt-0.5",
      issueRowHeader: "flex items-center gap-2",
      issueRowContent: "min-w-0 flex-1",
      issueRowMeta: "flex shrink-0 flex-col items-end gap-1",
      inlineChip: "inline-flex shrink-0 items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs text-muted",
      issueListHeader: "sticky top-0 z-10 border-b border-border bg-deep/50 backdrop-blur-sm",
      issueListHeaderContent: "px-4 py-3",
      viewToggle: "view-toggle",
      statusTabs: "flex gap-1 overflow-x-auto px-4",
      labelFilterBar: "flex items-center gap-2 overflow-x-auto border-t border-border/50 px-4 py-2",
      labelFilterItems: "flex flex-wrap gap-1.5",
      kanbanViewport: "min-h-0 flex-1 overflow-x-auto",
      kanbanBoard: "flex h-full min-w-max gap-4 p-4",
      kanbanColumnHeader: "flex items-center gap-2 border-b border-border p-3",
      kanbanColumnContent: "flex flex-col gap-2 p-2",
      kanbanCardContent: "flex items-start gap-2",
      kanbanCardBody: "min-w-0 flex-1",
      kanbanProject: "mt-2",
      loadingState: "flex h-64 items-center justify-center",
      emptyState: "flex h-64 flex-col items-center justify-center text-center",
      contentPadded: "flex flex-col gap-6 p-4",
    },
  },
});

interface IAppPrimitivesStackProps extends VariantProps<typeof stackVariants> {
  as?: "div" | "form" | "header" | "section";
  children: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  testId?: string;
}

function AppPrimitivesStack({
  as = "div",
  variant,
  children,
  onSubmit,
  testId,
}: IAppPrimitivesStackProps): JSX.Element {
  const className = stackVariants({ variant });
  const dataTestId = testId ?? "AppPrimitivesStack";

  if (as === "form") {
    return (
      <form className={className} onSubmit={onSubmit} data-testid={dataTestId}>
        {children}
      </form>
    );
  }

  if (as === "header") {
    return (
      <header className={className} data-testid={dataTestId}>
        {children}
      </header>
    );
  }

  if (as === "section") {
    return (
      <section className={className} data-testid={dataTestId}>
        {children}
      </section>
    );
  }

  return (
    <div className={className} data-testid={dataTestId}>
      {children}
    </div>
  );
}

const panelVariants = cva("rounded-lg border", {
  variants: {
    variant: {
      surface: "border-border bg-surface px-3 py-2 text-sm text-muted",
      subtle: "border-border bg-surface/40 p-3",
      row: "border-border bg-surface/60 p-3",
      dashedEmpty: "border-dashed border-border px-4 py-8 text-center text-sm text-muted",
      destructive: "border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-secondary",
      code: "border-border bg-void p-3 text-xs leading-relaxed text-secondary",
      stat: "border-transparent bg-deep p-2",
      calloutSuccess: "border-transparent bg-[var(--color-status-closed)]/10 p-2",
      calloutDanger: "border-transparent bg-destructive/10 p-2",
      statsFrame: "overflow-hidden border-transparent bg-surface/30 p-0",
      statsLoading: "border-transparent bg-surface/30 p-3",
      issueSectionHeader: "rounded-none border-x-0 border-t-0 border-border bg-surface/30 px-4 py-2",
      emptyIcon: "flex size-12 items-center justify-center rounded-full border-transparent bg-surface p-0",
    },
  },
  defaultVariants: {
    variant: "surface",
  },
});

interface IAppPrimitivesPanelProps extends VariantProps<typeof panelVariants> {
  as?: "div" | "pre";
  children: ReactNode;
  role?: "alert";
  testId?: string;
}

function AppPrimitivesPanel({
  as = "div",
  variant,
  children,
  role,
  testId,
}: IAppPrimitivesPanelProps): JSX.Element {
  const dataTestId = testId ?? "AppPrimitivesPanel";

  if (as === "pre") {
    return (
      <pre className={cn(panelVariants({ variant }), "max-h-80 overflow-auto")} data-testid={dataTestId}>
        {children}
      </pre>
    );
  }

  return (
    <div className={panelVariants({ variant })} role={role} data-testid={dataTestId}>
      {children}
    </div>
  );
}

interface IAppPrimitivesFieldProps {
  label: string;
  children: ReactNode;
}

function AppPrimitivesField({ label, children }: IAppPrimitivesFieldProps): JSX.Element {
  return (
    <label data-testid="AppPrimitivesField" className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

interface IAppPrimitivesSectionHeadingProps {
  children: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
}

function AppPrimitivesSectionHeading({
  children,
  icon,
  action,
}: IAppPrimitivesSectionHeadingProps): JSX.Element {
  return (
    <h3 data-testid="AppPrimitivesSectionHeading" className="mb-2 flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wider">
      {icon && <AppPrimitivesIcon icon={icon} size="xs" />}
      {children}
      {action}
    </h3>
  );
}

interface IAppPrimitivesPillProps {
  children: ReactNode;
  title?: string;
  variant?: "default" | "compact" | "count";
}

function AppPrimitivesPill({
  children,
  title,
  variant = "default",
}: IAppPrimitivesPillProps): JSX.Element {
  const className = cn(
    "shrink-0 rounded bg-surface font-mono text-xs text-muted",
    variant === "default" && "px-2 py-0.5",
    variant === "compact" && "px-1.5 py-0.5",
    variant === "count" && "flex size-5 items-center justify-center p-0 text-[10px] font-medium text-secondary",
  );

  return (
    <span data-testid="AppPrimitivesPill" className={className} title={title}>
      {children}
    </span>
  );
}

interface IAppPrimitivesPriorityBarProps {
  priority: number;
  fullHeight?: boolean;
}

function AppPrimitivesPriorityBar({
  priority,
  fullHeight = false,
}: IAppPrimitivesPriorityBarProps): JSX.Element {
  const priorityClass = priority >= 0 && priority <= 4 ? `p${priority}` : "p4";

  return <span data-testid="AppPrimitivesPriorityBar" className={cn("priority-bar", priorityClass, fullHeight && "h-full")} />;
}

interface IAppPrimitivesStatusCountProps {
  status: StatusTone;
  count: number;
}

function AppPrimitivesStatusCount({ status, count }: IAppPrimitivesStatusCountProps): JSX.Element {
  return (
    <span data-testid="AppPrimitivesStatusCount" className={cn("ml-1.5 font-mono opacity-60", statusCountToneClass(status, count))}>
      {count}
    </span>
  );
}

function statusCountToneClass(status: StatusTone, count: number): string {
  if (count <= 0) {
    return "";
  }

  if (status === "ready") {
    return "text-[var(--color-status-closed)]";
  }

  if (status === "overdue" || status === "blocked") {
    return "text-destructive";
  }

  return "";
}

interface IAppPrimitivesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  shortcutHint?: string;
}

function AppPrimitivesSearchInput({
  value,
  onChange,
  placeholder,
  shortcutHint,
}: IAppPrimitivesSearchInputProps): JSX.Element {
  return (
    <div data-testid="AppPrimitivesSearchInput" className="relative">
      <AppPrimitivesIcon icon={Search} tone="muted" placement="search" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-64 rounded-lg border border-border bg-surface pr-3 pl-9 text-sm transition-all placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none"
      />
      {shortcutHint && <span className="kbd absolute top-1/2 right-3 -translate-y-1/2">{shortcutHint}</span>}
    </div>
  );
}

interface IAppPrimitivesStatCardProps {
  value: number;
  label: string;
  tone?: "default" | "success";
}

function AppPrimitivesStatCard({
  value,
  label,
  tone = "default",
}: IAppPrimitivesStatCardProps): JSX.Element {
  return (
    <AppPrimitivesPanel variant="stat" testId="AppPrimitivesStatCard">
      <AppPrimitivesText as="div" variant={tone === "success" ? "statValueSuccess" : "statValue"}>{value}</AppPrimitivesText>
      <AppPrimitivesText as="div" variant="statLabel">{label}</AppPrimitivesText>
    </AppPrimitivesPanel>
  );
}

interface IAppPrimitivesStatRowProps {
  icon: LucideIcon;
  tone: IconTone;
  label: string;
  value: number;
}

function AppPrimitivesStatRow({ icon, tone, label, value }: IAppPrimitivesStatRowProps): JSX.Element {
  return (
    <AppPrimitivesStack variant="statRow" testId="AppPrimitivesStatRow">
      <AppPrimitivesIcon icon={icon} size="xs" tone={tone} />
      <AppPrimitivesText variant="body">{label}</AppPrimitivesText>
      <AppPrimitivesText variant="monoMuted">{value}</AppPrimitivesText>
    </AppPrimitivesStack>
  );
}

interface IAppPrimitivesStatCalloutProps {
  icon: LucideIcon;
  tone: "success" | "danger";
  title: string;
  description: string;
}

function AppPrimitivesStatCallout({
  icon,
  tone,
  title,
  description,
}: IAppPrimitivesStatCalloutProps): JSX.Element {
  return (
    <AppPrimitivesPanel variant={tone === "success" ? "calloutSuccess" : "calloutDanger"} testId="AppPrimitivesStatCallout">
      <AppPrimitivesStack variant="statCallout">
        <AppPrimitivesIcon icon={icon} tone={tone} />
        <div>
          <AppPrimitivesText as="div" variant={tone}>{title}</AppPrimitivesText>
          <AppPrimitivesText as="div" variant="tinyMuted">{description}</AppPrimitivesText>
        </div>
      </AppPrimitivesStack>
    </AppPrimitivesPanel>
  );
}

interface IAppPrimitivesProjectStatRowProps {
  project: string;
  open: number;
  total: number;
}

function AppPrimitivesProjectStatRow({
  project,
  open,
  total,
}: IAppPrimitivesProjectStatRowProps): JSX.Element {
  return (
    <AppPrimitivesStack variant="statRow" testId="AppPrimitivesProjectStatRow">
      <span className="size-2 rounded-full bg-accent/50" />
      <AppPrimitivesText variant="body" wrap="truncate">{project}</AppPrimitivesText>
      <AppPrimitivesText variant="monoMuted">{open}/{total}</AppPrimitivesText>
    </AppPrimitivesStack>
  );
}

interface IAppPrimitivesDefinitionGridProps {
  children: ReactNode;
}

function AppPrimitivesDefinitionGrid({ children }: IAppPrimitivesDefinitionGridProps): JSX.Element {
  return (
    <dl data-testid="AppPrimitivesDefinitionGrid" className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-surface p-3 text-xs sm:grid-cols-2">
      {children}
    </dl>
  );
}

interface IAppPrimitivesDefinitionItemProps {
  term: string;
  children: ReactNode;
  wide?: boolean;
}

function AppPrimitivesDefinitionItem({
  term,
  children,
  wide = false,
}: IAppPrimitivesDefinitionItemProps): JSX.Element {
  return (
    <div data-testid="AppPrimitivesDefinitionItem" className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted">{term}</dt>
      <dd className="mt-1 break-all font-mono text-secondary">{children}</dd>
    </div>
  );
}

interface IAppPrimitivesSidebarShellProps {
  id: string;
  width: number;
  children: ReactNode;
  testId?: string;
}

function AppPrimitivesSidebarShell({
  id,
  width,
  children,
  testId,
}: IAppPrimitivesSidebarShellProps): JSX.Element {
  return (
    <aside
      id={id}
      className="relative flex h-screen flex-col overflow-hidden border-r border-border bg-deep"
      style={{ width }}
      data-testid={testId ?? "AppPrimitivesSidebarShell"}
    >
      {children}
    </aside>
  );
}

interface IAppPrimitivesSidebarIconTileProps {
  icon: LucideIcon;
  tone?: IconTone;
  variant?: "brand" | "project" | "count";
}

function AppPrimitivesSidebarIconTile({
  icon,
  tone = "accent",
  variant = "brand",
}: IAppPrimitivesSidebarIconTileProps): JSX.Element {
  const className = cn(
    "flex shrink-0 items-center justify-center rounded-md",
    variant === "brand" && "size-7 bg-accent/20",
    variant === "project" && "size-8 bg-surface transition-colors group-hover:bg-elevated",
    variant === "count" && "size-5 rounded-full bg-surface",
  );

  return (
    <span data-testid="AppPrimitivesSidebarIconTile" className={className}>
      <AppPrimitivesIcon icon={icon} tone={tone} />
    </span>
  );
}

interface IAppPrimitivesSidebarResizeHandleProps {
  sidebarId: string;
  minWidth: number;
  maxWidth: number;
  width: number;
  isResizing: boolean;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
}

function AppPrimitivesSidebarResizeHandle({
  sidebarId,
  minWidth,
  maxWidth,
  width,
  isResizing,
  onKeyDown,
  onPointerDown,
}: IAppPrimitivesSidebarResizeHandleProps): JSX.Element {
  return (
    <div
      data-testid="AppPrimitivesSidebarResizeHandle"
      role="separator"
      aria-controls={sidebarId}
      aria-label="Resize sidebar"
      aria-orientation="vertical"
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-valuenow={width}
      aria-valuetext={`${width} pixels wide`}
      tabIndex={0}
      className={cn(
        "group absolute top-0 right-0 bottom-0 w-2 cursor-col-resize touch-none rounded-sm transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none",
        isResizing && "bg-accent/50",
      )}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
    >
      <span className="absolute top-1/2 right-0 flex h-8 w-4 -translate-y-1/2 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <AppPrimitivesIcon icon={GripVertical} size="xs" tone="muted" />
      </span>
    </div>
  );
}

interface IAppPrimitivesKanbanColumnProps {
  children: ReactNode;
  isDropTarget: boolean;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDragLeave: () => void;
  onDrop: DragEventHandler<HTMLDivElement>;
}

function AppPrimitivesKanbanColumn({
  children,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
}: IAppPrimitivesKanbanColumnProps): JSX.Element {
  return (
    <div
      data-testid="AppPrimitivesKanbanColumn"
      className={cn(
        "flex w-72 flex-col rounded-lg bg-surface/30 transition-all",
        isDropTarget && "bg-accent/5 ring-2 ring-accent/50",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}

interface IAppPrimitivesKanbanIssueCardProps {
  children: ReactNode;
  draggable: boolean;
  isMovable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function AppPrimitivesKanbanIssueCard({
  children,
  draggable,
  isMovable,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: IAppPrimitivesKanbanIssueCardProps): JSX.Element {
  return (
    <div
      data-testid="AppPrimitivesKanbanIssueCard"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer rounded-lg border border-transparent bg-deep p-3 text-left transition-colors hover:border-border hover:bg-elevated",
        isMovable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      {children}
    </div>
  );
}

function AppPrimitivesTimelineDot(): JSX.Element {
  return <div data-testid="AppPrimitivesTimelineDot" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />;
}

export const AppPrimitives = Object.assign(
  function AppPrimitives(): JSX.Element {
    return <div data-testid="AppPrimitives" hidden />;
  },
  {
  DefinitionGrid: AppPrimitivesDefinitionGrid,
  DefinitionItem: AppPrimitivesDefinitionItem,
  Field: AppPrimitivesField,
  Icon: AppPrimitivesIcon,
  KanbanColumn: AppPrimitivesKanbanColumn,
  KanbanIssueCard: AppPrimitivesKanbanIssueCard,
  Panel: AppPrimitivesPanel,
  Pill: AppPrimitivesPill,
  PriorityBar: AppPrimitivesPriorityBar,
  ProjectStatRow: AppPrimitivesProjectStatRow,
  SearchInput: AppPrimitivesSearchInput,
  SectionHeading: AppPrimitivesSectionHeading,
  SidebarIconTile: AppPrimitivesSidebarIconTile,
  SidebarResizeHandle: AppPrimitivesSidebarResizeHandle,
  SidebarShell: AppPrimitivesSidebarShell,
  Stack: AppPrimitivesStack,
  StatCallout: AppPrimitivesStatCallout,
  StatCard: AppPrimitivesStatCard,
  StatRow: AppPrimitivesStatRow,
  StatusCount: AppPrimitivesStatusCount,
  Text: AppPrimitivesText,
  TimelineDot: AppPrimitivesTimelineDot,
  },
);
