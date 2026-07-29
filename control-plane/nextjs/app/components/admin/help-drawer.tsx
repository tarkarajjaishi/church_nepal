'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Search, HelpCircle, Command } from 'lucide-react';

// Sample help articles data - in a real app this would come from an API
const HELP_ARTICLES = [
  { id: 1, title: 'Getting Started', href: '#' },
  { id: 2, title: 'Managing Church Users', href: '#' },
  { id: 3, title: 'Setting Up Events', href: '#' },
  { id: 4, title: 'Configuring Donations', href: '#' },
  { id: 5, title: 'Customizing Your Site', href: '#' },
  { id: 6, title: 'Generating Reports', href: '#' },
];

export default function HelpDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close drawer when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Focus search input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter articles based on search query
  const filteredArticles = HELP_ARTICLES.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col bg-[var(--panel)] border-l border-[var(--border)] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-soft)]">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="font-semibold text-[var(--text-strong)]">Help & Support</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-[var(--panel-2)]"
              aria-label="Close help drawer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-5 border-b border-[var(--border-soft)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] text-[var(--text)]"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
                Quick Help Articles
              </h3>
              <ul className="space-y-2">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <li key={article.id}>
                      <a
                        href={article.href}
                        className="block py-2 px-3 rounded-lg hover:bg-[var(--panel-2)] text-[var(--text)] transition-colors"
                      >
                        {article.title}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="py-4 text-center text-[var(--muted)]">
                    No articles found matching "{searchQuery}"
                  </li>
                )}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
                Keyboard Shortcuts
              </h3>
              <ul className="space-y-2 text-sm text-[var(--text)]">
                <li className="flex justify-between py-1">
                  <span>Open this help</span>
                  <kbd className="px-2 py-1 bg-[var(--panel-2)] border border-[var(--border)] rounded text-xs">F1</kbd>
                </li>
                <li className="flex justify-between py-1">
                  <span>Close help</span>
                  <kbd className="px-2 py-1 bg-[var(--panel-2)] border border-[var(--border)] rounded text-xs">Esc</kbd>
                </li>
                <li className="flex justify-between py-1">
                  <span>Focus search</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-[var(--panel-2)] border border-[var(--border)] rounded text-xs"><Command className="w-3 h-3 inline" /></kbd>
                    <kbd className="px-2 py-1 bg-[var(--panel-2)] border border-[var(--border)] rounded text-xs">K</kbd>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[var(--border-soft)]">
            <Button 
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
              onClick={() => {
                // In a real app, this would open a contact form or email
                alert('Contact support functionality would open here');
              }}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
