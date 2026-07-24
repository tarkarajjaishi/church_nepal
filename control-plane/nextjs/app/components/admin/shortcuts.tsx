'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const ShortcutItem = ({ keys, label }: { keys: string[], label: string }) => (
  <div className="flex items-center justify-between py-2 px-4 hover:bg-[var(--panel-2)]">
    <span className="text-[var(--text)]">{label}</span>
    <div className="flex gap-1">
      {keys.map((key, idx) => (
        <kbd key={idx} className="px-2 py-1 bg-[var(--panel-2)] border border-[var(--border)] rounded-md text-xs font-mono text-[var(--text)]">
          {key}
        </kbd>
      ))}
    </div>
  </div>
);

export const Shortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes('Mac'));
  }, []);

  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      // Don't trigger if in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLElement && e.target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      const metaKey = isMac ? e.metaKey : e.ctrlKey;

      // Prevent default browser behavior for our shortcuts
      if (metaKey && key === 'k') {
        e.preventDefault();
        window.location.href = '/admin/search'; // Placeholder for search functionality
        return;
      }
      if (key === '?') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      if (key === 'n' && metaKey) {
        e.preventDefault();
        window.location.href = '/admin/churches/new';
        return;
      }
      if (key === 'g') {
        e.preventDefault();
        const handleSecondKey = (secondEvent: KeyboardEvent) => {
          const secondKey = secondEvent.key.toLowerCase();
          if (secondKey === 'c') {
            window.location.href = '/admin/churches';
          } else if (secondKey === 'b') {
            window.location.href = '/admin/billing';
          }
          window.removeEventListener('keydown', handleSecondKey);
        };
        window.addEventListener('keydown', handleSecondKey, { once: true });
        return;
      }
    };

    window.addEventListener('keydown', downHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [isMac]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-lg mx-4 bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text)]">Keyboard Shortcuts</h3>
        </div>
        <div className="divide-y divide-[var(--border-soft)]">
          <ShortcutItem keys={[isMac ? '⌘' : 'Ctrl', 'K']} label="Search" />
          <ShortcutItem keys={['G', 'C']} label="Go to Churches" />
          <ShortcutItem keys={['G', 'B']} label="Go to Billing" />
          <ShortcutItem keys={['?']} label="Show this help" />
          <ShortcutItem keys={[isMac ? '⌘' : 'Ctrl', 'N']} label="New Church" />
        </div>
        <div className="p-4 border-t border-[var(--border)] text-right">
          <button 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-2)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
