"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // Never retry a 4xx. The server has answered — "no such invoice",
        // "not allowed" — and asking again gets the same answer. Retrying only
        // delays the error, and while a query is retrying `isError` is false
        // and `data` is undefined, so the page sits on its loading state and a
        // 404 reads as a slow request rather than a missing thing.
        retry: (count, error) => {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status && status >= 400 && status < 500) return false;
          return count < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}