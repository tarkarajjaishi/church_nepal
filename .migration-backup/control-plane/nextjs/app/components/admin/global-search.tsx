'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Define types for our search items
type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'church' | 'admin' | 'invoice' | 'setting' | 'action';
  href: string;
};

// Mock data - in real app, this would come from API calls
const mockData: SearchItem[] = [
  // Churches
  { id: 'ch-1', title: 'Grace Community Church', subtitle: 'grace.nepal.church', type: 'church', href: '/admin/churches/1' },
  { id: 'ch-2', title: 'New Life Fellowship', subtitle: 'newlife.nepal.church', type: 'church', href: '/admin/churches/2' },
  { id: 'ch-3', title: 'Faith Baptist Church', subtitle: 'faithbaptist.nepal.church', type: 'church', href: '/admin/churches/3' },
  // Admins
  { id: 'ad-1', title: 'John Doe', subtitle: 'john@churchnepal.com', type: 'admin', href: '/admin/admins/1' },
  { id: 'ad-2', title: 'Jane Smith', subtitle: 'jane@churchnepal.com', type: 'admin', href: '/admin/admins/2' },
  // Settings
  { id: 'st-1', title: 'Billing Settings', subtitle: 'Manage billing plans', type: 'setting', href: '/admin/settings/billing' },
  { id: 'st-2', title: 'System Settings', subtitle: 'Configure global settings', type: 'setting', href: '/admin/settings/system' },
  // Actions
  { id: 'ac-1', title: 'Create New Church', subtitle: 'Add a new church instance', type: 'action', href: '/admin/churches/new' },
  { id: 'ac-2', title: 'Invite Admin', subtitle: 'Add a new administrator', type: 'action', href: '/admin/admins/invite' },
];

const groupLabels = {
  church: 'Churches',
  admin: 'Admins',
  setting: 'Settings',
  action: 'Quick Actions',
  invoice: 'Invoices'
};

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const ChurchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.529 1 1 0 0 1 .539-.144A2 2 0 0 1 5 8.56z" />
    <path d="M21 10a2 2 0 0 0-1.317-.223 1 1 0 0 0-.54.144A2 2 0 0 1 18 8.56z" />
    <path d="M3 10h18v11H3z" />
    <path d="M10 3v4" />
    <path d="M14 3v4" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ActionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const InvoiceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ [key: string]: SearchItem[] }>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('globalSearchRecents');
    if (saved) {
      try {
        setRecentItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // Toggle search modal
  const toggleSearch = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      // Show recent items when no query
      setResults({ Recent: recentItems });
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    // Group items by type
    const grouped: { [key: string]: SearchItem[] } = {};
    
    const filtered = mockData.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.subtitle?.toLowerCase().includes(lowerQuery)
    );

    filtered.forEach(item => {
      const group = item.type;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(item);
    });

    setResults(grouped);
    
    // Reset selected index when results change
    setSelectedIndex(0);
  }, [query, recentItems]);

  // Get flattened list of results for keyboard navigation
  const getFlatResults = (): SearchItem[] => {
    const flat: SearchItem[] = [];
    Object.values(results).forEach(group => {
      flat.push(...group);
    });
    return flat;
  };

  // Navigate to selected item
  const handleSelect = (item: SearchItem) => {
    if (item.href) {
      router.push(item.href);
      
      // Add to recent items
      const updatedRecents = [
        item,
        ...recentItems.filter(i => i.id !== item.id).slice(0, 4)
      ];
      setRecentItems(updatedRecents);
      localStorage.setItem('globalSearchRecents', JSON.stringify(updatedRecents));
    }
    setIsOpen(false);
    setQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const flatResults = getFlatResults();
    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
    }
  };

  // Get icon component based on type
  const getIcon = (type: SearchItem['type']) => {
    switch (type) {
      case 'church': return <ChurchIcon />;
      case 'admin': return <UserIcon />;
      case 'setting': return <SettingsIcon />;
      case 'action': return <ActionIcon />;
      case 'invoice': return <InvoiceIcon />;
      default: return <SearchIcon />;
    }
  };

  // Get CSS class based on type for styling
  const getTypeClass = (type: SearchItem['type']) => {
    switch (type) {
      case 'church': return 'text-[var(--accent)]';
      case 'admin': return 'text-[var(--accent-2)]';
      case 'setting': return 'text-[var(--muted)]';
      case 'action': return 'text-[var(--good)]';
      case 'invoice': return 'text-[var(--gold-soft)]';
      default: return '';
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={toggleSearch}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--panel-2)] hover:bg-[var(--panel-3)] border border-[var(--border)] text-[var(--text)] text-sm"
        aria-label="Global Search"
      >
        <SearchIcon />
        <span>Search...</span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 w-8 items-center justify-center rounded border bg-[var(--bg)] text-xs font-medium text-[var(--muted)]">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-md rounded-xl bg-[var(--panel)] border border-[var(--border)] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input area */}
            <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search churches, admins, settings..."
                className="flex-1 bg-transparent outline-none text-[var(--text)] placeholder-[var(--muted)]"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-[var(--panel-2)] text-[var(--muted)]"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(results).length > 0 ? (
                Object.entries(results).map(([group, items]) => (
                  <div key={group} className="py-2">
                    <div className="px-4 py-1 text-xs uppercase tracking-wider text-[var(--muted)] bg-[var(--panel-2)]">
                      {groupLabels[group as keyof typeof groupLabels] || group}
                    </div>
                    <ul>
                      {items.map((item, idx) => {
                        const flatIndex = getFlatResults().findIndex(i => i.id === item.id);
                        const isSelected = flatIndex === selectedIndex;
                        
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => handleSelect(item)}
                              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[var(--panel-2)] ${
                                isSelected ? 'bg-[var(--panel-2)]' : ''
                              }`}
                            >
                              <span className={getTypeClass(item.type)}>
                                {getIcon(item.type)}
                              </span>
                              <div className="text-left">
                                <div className="font-medium text-[var(--text)]">{item.title}</div>
                                {item.subtitle && (
                                  <div className="text-xs text-[var(--muted)] mt-1">{item.subtitle}</div>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[var(--muted)]">
                  No results found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
