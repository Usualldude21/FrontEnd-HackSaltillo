import type { CSSProperties, HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  height?: CSSProperties["height"];
  width?: CSSProperties["width"];
}

export function Skeleton({ className = "", height, width, ...props }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={["skeleton", className].filter(Boolean).join(" ")}
      style={{ height, width }}
      {...props}
    />
  );
}
