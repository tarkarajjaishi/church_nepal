"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--text-strong)] mb-2">
          Something went wrong
        </h2>
        <p className="text-[var(--muted)] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Button 
          variant="default" 
          onClick={() => reset()} 
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </Button>
      </div>
    </div>
  );
}
