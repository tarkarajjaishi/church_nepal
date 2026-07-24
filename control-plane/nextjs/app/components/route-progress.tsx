"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const RouteProgress = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    // Start progress when route changes
    setProgress(0);

    // Simulate progress increasing over time
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        // Random increment to simulate non-linear progress
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 90);
      });
    }, 100);

    // Finalize progress after a delay
    const finalizeTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100); // Full width
      // Fade out after reaching full width
      setTimeout(() => {
        setProgress(null);
      }, 200); // Match fade-out duration
    }, 500); // Total simulated load time before settling

    // Cleanup on unmount/route change
    return () => {
      clearInterval(progressInterval);
      clearTimeout(finalizeTimeout);
    };
  }, [pathname]);

  if (progress === null) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 h-0.5 w-full z-[9999]"
      style={{
        background: `linear-gradient(to right, transparent 0%, var(--accent) ${progress}%, transparent ${progress}%)`,
        opacity: progress < 100 ? 1 : 0,
        transition: "opacity 0.2s ease-out",
      }}
    />
  );
};

export default RouteProgress;
