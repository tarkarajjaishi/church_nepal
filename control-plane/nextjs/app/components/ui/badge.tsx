"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all",
  {
    variants: {
      variant: {
        default: "bg-[var(--good-soft)] text-[var(--good)]",
        success: "bg-[var(--good-soft)] text-[var(--good)]",
        warning: "bg-[var(--gold-soft)] text-[var(--gold)]",
        destructive: "bg-[var(--danger-soft)] text-[var(--danger)]",
        outline: "border border-border bg-transparent text-text",
        secondary: "bg-panel-2 text-muted",
        accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };