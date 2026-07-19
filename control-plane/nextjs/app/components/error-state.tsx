"use client";

import { AlertCircle, AlertTriangle, WifiOff, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string | React.ReactNode;
  retry?: () => void;
  retryLabel?: string;
  variant?: "default" | "warning" | "network" | "server";
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "An error occurred while loading data.",
  retry,
  retryLabel = "Try again",
  variant = "default"
}: ErrorStateProps) {
  const getIcon = () => {
    switch (variant) {
      case "warning":
        return <AlertTriangle className="h-12 w-12" style={{ color: "var(--gold)" }} />;
      case "network":
        return <WifiOff className="h-12 w-12" style={{ color: "var(--accent)" }} />;
      case "server":
        return <ServerCrash className="h-12 w-12" style={{ color: "var(--danger)" }} />;
      default:
        return <AlertCircle className="h-12 w-12" style={{ color: "var(--danger)" }} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {getIcon()}
      <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
      {typeof description === "string" ? (
        <p className="mt-2 text-sm max-w-sm" style={{ color: "var(--muted)" }}>{description}</p>
      ) : (
        <div className="mt-2 text-sm max-w-sm" style={{ color: "var(--muted)" }}>{description}</div>
      )}
      {retry && (
        <Button onClick={retry} variant="outline" className="mt-4">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// Inline error display for smaller spaces
export function InlineError({ 
  message, 
  className 
}: { 
  message: string; 
  className?: string 
}) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className || ""}`} style={{ color: "var(--danger)" }}>
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  );
}