"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Notifications error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--text-strong)] mb-2">
          Notifications Failed to Load
        </h2>
        <p className="text-[var(--muted)] mb-6">
          Unable to load notifications. Please try again later.
        </p>
        <Button 
          variant="default" 
          onClick={() => reset()} 
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Reload Notifications
        </Button>
      </div>
    </div>
  );
}
