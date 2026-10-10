import type { HTMLAttributes, PropsWithChildren } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends PropsWithChildren<HTMLAttributes<HTMLSpanElement>> {
  tone?: BadgeTone;
}

export function Badge({ children, className = "", tone = "neutral", ...props }: BadgeProps) {
  const classes = ["badge", `badge-${tone}`, className].filter(Boolean).join(" ");
  return <span className={classes} {...props}>{children}</span>;
}
