'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Badge } from '../ui/badge';
import { Search, LayoutDashboard, Building2, BarChart3, CreditCard, Settings } from 'lucide-react';

type CommandItem = {
  id: string;
  label: string;
  type: 'link' | 'action';
  href?: string;
  icon?: React.ReactNode;
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'Dashboard': <LayoutDashboard className="w-4 h-4 mr-2" />,
  'Churches': <Building2 className="w-4 h-4 mr-2" />,
  'Analytics': <BarChart3 className="w-4 h-4 mr-2" />,
  'Billing': <CreditCard className="w-4 h-4 mr-2" />,
  'Settings': <Settings className="w-4 h-4 mr-2" />,
};

const CHURCH_ICON = <Building2 className="w-4 h-4 mr-2" />;

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CommandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Array<{ id: string; label: string; type: string; href: string }>>('/search', {
        params: { q: query },
      });
      const mapped: CommandItem[] = data.map((item) => ({
        id: item.id,
        label: item.label,
        type: 'link' as const,
        href: item.href,
        icon: item.type === 'church' ? CHURCH_ICON : (ACTION_ICONS[item.label] || undefined),
      }));
      setItems(mapped);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSearch(search);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, fetchSearch]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        return;
      }

      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => items.length === 0 ? -1 : (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => items.length === 0 ? -1 : (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && items[selectedIndex]) {
            const item = items[selectedIndex];
            if (item.type === 'link' && item.href) {
              router.push(item.href);
              setOpen(false);
            }
          }
          break;
        case 'Escape':
          setOpen(false);
          break;
      }
    },
    [open, selectedIndex, items, router]
  );

  // Register/unregister global event listeners
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl w-full max-w-md shadow-lg">
        <div className="p-3 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search churches or commands..."
              className="w-full pl-10 pr-4 py-2 bg-transparent text-[var(--text)] outline-none"
              aria-label="Search churches or commands"
            />
          </div>
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {loading ? (
            <li className="p-4 text-center text-[var(--muted)]">Loading...</li>
          ) : items.length > 0 ? (
            items.map((item, index) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.type === 'link' && item.href) {
                      router.push(item.href);
                      setOpen(false);
                    }
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[var(--accent-soft)] ${
                    index === selectedIndex ? 'bg-[var(--accent-soft)]' : ''
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span>{item.label}</span>
                    {item.id.startsWith('church-') && (
                      <Badge variant="secondary" className="ml-auto">
                        Church
                      </Badge>
                    )}
                  </div>
                </button>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-[var(--muted)]">No results found</li>
          )}
        </ul>
        <div className="p-3 text-xs text-[var(--muted)] text-center border-t border-[var(--border)]">
          Press ESC to close • Navigate with ↑ ↓
        </div>
      </div>
    </div>
  );
}
