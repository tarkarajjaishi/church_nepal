"use client";

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  rows?: number;
  message?: string;
  variant?: "spinner" | "skeleton";
  inline?: boolean;
}

export function LoadingState({ rows = 3, message = "Loading...", variant = "spinner", inline = false }: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Spinner variant (default)
  if (inline) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        {message}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-accent" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

// Simple loading spinner component for inline use
export function LoadingSpinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <Loader2 
      className={`animate-spin ${className || ""} text-accent`} 
      style={{ width: size, height: size }}
    />
  );
}