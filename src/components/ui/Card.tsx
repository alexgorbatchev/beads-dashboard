import type { ComponentProps, JSX } from "react";

type CardPartProps = Omit<ComponentProps<"div">, "className" | "style">;

export function Card({ ...props }: CardPartProps): JSX.Element {
  return (
    <div
      data-testid="Card"
      data-slot="card"
      className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
      {...props}
    />
  );
}

export function CardHeader({ ...props }: CardPartProps): JSX.Element {
  return (
    <div
      data-testid="CardHeader"
      data-slot="card-header"
      className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
      {...props}
    />
  );
}

export function CardTitle({ ...props }: CardPartProps): JSX.Element {
  return (
    <div
      data-testid="CardTitle"
      data-slot="card-title"
      className="leading-none font-semibold"
      {...props}
    />
  );
}

export function CardDescription({ ...props }: CardPartProps): JSX.Element {
  return (
    <div
      data-testid="CardDescription"
      data-slot="card-description"
      className="text-muted-foreground text-sm"
      {...props}
    />
  );
}

export function CardAction({ ...props }: CardPartProps): JSX.Element {
  return (
    <div
      data-testid="CardAction"
      data-slot="card-action"
      className="col-start-2 row-span-2 row-start-1 self-start justify-self-end"
      {...props}
    />
  );
}

export function CardContent({ ...props }: CardPartProps): JSX.Element {
  return <div data-testid="CardContent" data-slot="card-content" className="px-6" {...props} />;
}

export function CardFooter({ ...props }: CardPartProps): JSX.Element {
  return (
    <div
      data-testid="CardFooter"
      data-slot="card-footer"
      className="flex items-center px-6 [.border-t]:pt-6"
      {...props}
    />
  );
}
