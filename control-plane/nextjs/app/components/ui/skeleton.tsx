"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Skeleton = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-pulse rounded-md bg-panel-2", className)}
    {...props}
  />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };