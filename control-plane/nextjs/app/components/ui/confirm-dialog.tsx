"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  // Close dialog when clicking outside the content area
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onCancel();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-2">
            {title}
          </h3>
          <p className="text-[var(--text)] mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--panel-2)] rounded-lg transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[var(--accent)] hover:bg-[var(--accent-2)]"
              }`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
