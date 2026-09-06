import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Tone = "light" | "dark";
type Size = "md" | "lg";

type Shared = {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type AsLink = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = AsButton | AsLink;

function classes(variant: Variant, tone: Tone, size: Size, className?: string) {
  const base = [
    "landing-btn",
    `landing-btn--${variant}`,
    `landing-btn--${tone}`,
    `landing-btn--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return base;
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    tone = "light",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  const classNames = classes(variant, tone, size, className);

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as AsLink;
    return (
      <a href={href} className={classNames} {...anchorRest}>
        {children}
      </a>
    );
  }

  const buttonRest = rest as AsButton;
  return (
    <button type={buttonRest.type ?? "button"} className={classNames} {...buttonRest}>
      {children}
    </button>
  );
}
