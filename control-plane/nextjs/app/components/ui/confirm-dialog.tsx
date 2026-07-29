"use client";

import { useEffect, useId, useRef, useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  /**
   * When set, the confirm button stays disabled until the operator types this
   * exact string. Use for irreversible actions (deleting a church drops its
   * database and storage) so the action cannot be completed by muscle memory.
   */
  confirmPhrase?: string;
  /** Disables the confirm button while the request is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  confirmPhrase,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLElement | null>(null);
  const [typed, setTyped] = useState("");
  const inputId = useId();

  const phraseSatisfied = !confirmPhrase || typed === confirmPhrase;
  const canConfirm = phraseSatisfied && !busy;

  // Reset the typed phrase whenever the dialog opens, so a previous attempt
  // never leaves the button pre-armed.
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    initialFocusRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      // Keep Tab inside the dialog while it is open.
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${inputId}-title`}
        aria-describedby={`${inputId}-desc`}
        className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <h3
            id={`${inputId}-title`}
            className="text-lg font-semibold text-[var(--text-strong)] mb-2"
          >
            {title}
          </h3>
          <p id={`${inputId}-desc`} className="text-[var(--text)] mb-6">
            {message}
          </p>

          {confirmPhrase && (
            <div className="mb-6">
              <label
                htmlFor={inputId}
                className="block text-sm text-[var(--text)] mb-2"
              >
                Type <span className="font-mono font-semibold text-[var(--text-strong)]">{confirmPhrase}</span> to confirm
              </label>
              <input
                id={inputId}
                ref={(el) => {
                  initialFocusRef.current = el;
                }}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={`${inputId}-hint`}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text-strong)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <p id={`${inputId}-hint`} className="sr-only" role="status">
                {phraseSatisfied
                  ? "Confirmation text matches. The action can now be performed."
                  : "Confirmation text does not match yet."}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              ref={(el) => {
                if (!confirmPhrase) initialFocusRef.current = el;
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--panel-2)] rounded-lg transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              aria-disabled={!canConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                danger
                  ? "bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600"
                  : "bg-[var(--accent)] hover:bg-[var(--accent-2)] disabled:hover:bg-[var(--accent)]"
              }`}
              onClick={() => canConfirm && onConfirm()}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
