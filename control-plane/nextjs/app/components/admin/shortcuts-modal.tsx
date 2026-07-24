"use client";

import { useEffect, useRef } from "react";

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const ShortcutsModal = ({ open, onClose }: ShortcutsModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  // Define the shortcuts data
  const shortcuts = [
    { keys: ["G", "C"], description: "Go to Churches" },
    { keys: ["G", "A"], description: "Go to Admins" },
    { keys: ["G", "B"], description: "Go to Billing" },
    { keys: ["G", "S"], description: "Go to Settings" },
    { keys: ["?"], description: "Open this help" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--text)] focus:outline-none"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <ul className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <li key={index} className="flex items-center justify-between py-2">
                <span className="text-[var(--text)]">{shortcut.description}</span>
                <div className="flex space-x-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className="px-2 py-1 text-xs font-semibold text-[var(--text)] bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-md"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
