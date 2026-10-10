import type { HTMLAttributes, PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren<HTMLAttributes<HTMLElement>> {
  elevated?: boolean;
}

export function Card({ children, className = "", elevated = false, ...props }: CardProps) {
  const classes = ["card", elevated ? "card-elevated" : "", className].filter(Boolean).join(" ");
  return <article className={classes} {...props}>{children}</article>;
}
