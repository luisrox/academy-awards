import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type DecoFrameProps = {
  children?: ReactNode;
  className?: string;
  variant?: "raised" | "flat";
  radius?: "card" | "panel";
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

const variantClass = {
  raised: "deco-frame-raised shadow-raised",
  flat: "deco-frame-flat",
} as const;

/**
 * Shared Art Déco frame. Raised surfaces get radius, gradient face, edge
 * highlight and a drop shadow. Flat is radius and fillet only, for nested
 * containers that must not compete with the parent relief.
 */
export const DecoFrame = forwardRef<HTMLDivElement, DecoFrameProps>(
  function DecoFrame(
    {
      children,
      className = "",
      variant = "raised",
      radius = "card",
      ...props
    },
    ref,
  ) {
    const radiusClass = radius === "panel" ? "deco-frame-panel" : "";
    return (
      <div
        ref={ref}
        className={`deco-frame ${variantClass[variant]} ${radiusClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  },
);
