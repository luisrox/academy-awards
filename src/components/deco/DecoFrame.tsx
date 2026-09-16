import type { ReactNode } from "react";

type DecoFrameProps = {
  children: ReactNode;
  className?: string;
};

/** 1 px geometric frame. Corners are stepped squares, not a rounded card. */
export function DecoFrame({ children, className = "" }: DecoFrameProps) {
  return <div className={`deco-frame ${className}`.trim()}>{children}</div>;
}
