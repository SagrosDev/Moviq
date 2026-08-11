import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";
export type ButtonWidth = "auto" | "full";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  width?: ButtonWidth;
  "data-variant"?: ButtonVariant;
};

type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  width?: ButtonWidth;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-moviqo-primary bg-moviqo-primary text-moviqo-primary-foreground hover:border-moviqo-primary-hover hover:bg-moviqo-primary-hover",
  secondary:
    "border-moviqo-border bg-moviqo-surface-raised text-moviqo-primary hover:border-moviqo-primary hover:bg-moviqo-surface-soft",
  quiet:
    "border-transparent bg-transparent text-moviqo-primary hover:bg-moviqo-surface-soft",
  destructive:
    "border-moviqo-error bg-moviqo-error text-moviqo-primary-foreground hover:brightness-90"
};

const widthClasses: Record<ButtonWidth, string> = {
  auto: "w-auto",
  full: "w-full"
};

const buttonClasses = (variant: ButtonVariant, width: ButtonWidth) =>
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-moviqo-control border px-moviqo-4 py-moviqo-2 text-moviqo-label font-semibold no-underline transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus disabled:cursor-not-allowed disabled:border-moviqo-border disabled:bg-moviqo-surface-soft disabled:text-moviqo-ink-disabled motion-reduce:transition-none ${variantClasses[variant]} ${widthClasses[width]}`;

export const Button = ({
  children,
  variant,
  width = "auto",
  type = "button",
  "data-variant": legacyVariant,
  ...props
}: ButtonProps) => {
  const selectedVariant = variant ?? legacyVariant ?? "primary";

  return (
    <button
      className={buttonClasses(selectedVariant, width)}
      data-variant={selectedVariant}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};

export const ButtonLink = ({
  children,
  variant = "primary",
  width = "auto",
  ...props
}: ButtonLinkProps) => {
  return (
    <a className={buttonClasses(variant, width)} data-variant={variant} {...props}>
      {children}
    </a>
  );
};
