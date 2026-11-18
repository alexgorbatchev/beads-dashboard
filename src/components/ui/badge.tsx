import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "./badgeVariants";

type BadgeBaseProps = VariantProps<typeof badgeVariants> & {
  className?: never;
  style?: never;
};

type StaticBadgeProps = BadgeBaseProps &
  Omit<React.ComponentProps<"span">, "className" | "onClick" | "style"> & {
    isAction?: false;
    onClick?: never;
  };

type ActionBadgeProps = BadgeBaseProps &
  Omit<React.ComponentProps<"button">, "className" | "style" | "type"> & {
    isAction: true;
  };

type BadgeProps = StaticBadgeProps | ActionBadgeProps;

export function Badge(props: BadgeProps): React.JSX.Element {
  if (props.isAction) {
    const { isAction: _isAction, state, ...buttonProps } = props;
    return (
      <button
        data-testid="Badge"
        data-slot="badge"
        type="button"
        className={badgeVariants({ state })}
        {...buttonProps}
      />
    );
  }

  const { isAction: _isAction, state, ...spanProps } = props;
  return <span data-testid="Badge" data-slot="badge" className={badgeVariants({ state })} {...spanProps} />;
}
