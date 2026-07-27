"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--panel)",
          color: "var(--text)",
          border: "1px solid var(--border)",
        },
        className: "toast",
        descriptionClassName: "toast-description",
      }}
      closeButton
    />
  );
}