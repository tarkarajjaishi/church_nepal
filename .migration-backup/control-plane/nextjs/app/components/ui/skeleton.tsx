"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--muted)]/20 rounded-md",
        className
      )}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
