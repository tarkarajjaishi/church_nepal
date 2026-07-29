'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Define types for our search items
type SearchItem = {
  id: string;
  title: string;
  description?: string;
  url: string;
  category: 'marketing' | 'blog' | 'docs';
};

// Mock data for initial implementation
const mockSearchData: SearchItem[] = [
  // Marketing Pages
  { id: 'home', title: 'Home', url: '/', category: 'marketing' },
  { id: 'about', title: 'About Us', url: '/about', category: 'marketing' },
  { id: 'pricing', title: 'Pricing', url: '/pricing', category: 'marketing' },
  { id: 'features', title: 'Features', url: '/features', category: 'marketing' },
  { id: 'changelog', title: 'Changelog', url: '/changelog', category: 'marketing' },
  { id: 'careers', title: 'Careers', url: '/careers', category: 'marketing' },
  { id: 'compare', title: 'Compare Plans', url: '/compare', category: 'marketing' },

  // Blog Posts
  { id: 'blog-intro', title: 'Getting Started with Church Nepal', url: '/blog/getting-started', category: 'blog', description: 'A guide for new users' },
  { id: 'blog-newsletter', title: 'Newsletter Setup Guide', url: '/blog/newsletter-setup', category: 'blog', description: 'How to set up newsletters' },
  { id: 'blog-events', title: 'Managing Events Efficiently', url: '/blog/managing-events', category: 'blog', description: 'Best practices for event management' },
  { id: 'blog-sermons', title: 'Sermon Management Tips', url: '/blog/sermon-tips', category: 'blog', description: 'Organize your sermons effectively' },
  { id: 'blog-volunteers', title: 'Volunteer Coordination', url: '/blog/volunteer-coordination', category: 'blog', description: 'Streamline volunteer tasks' },
  
  // Documentation
  { id: 'docs-intro', title: 'Introduction', url: '/docs/intro', category: 'docs', description: 'Overview of the platform' },
  { id: 'docs-setup', title: 'Setup Guide', url: '/docs/setup', category: 'docs', description: 'Initial setup instructions' },
  { id: 'docs-users', title: 'User Management', url: '/docs/users', category: 'docs', description: 'Manage your church members' },
  { id: 'docs-events', title: 'Event Management', url: '/docs/events', category: 'docs', description: 'Creating and managing events' },
  { id: 'docs-donations', title: 'Donation Processing', url: '/docs/donations', category: 'docs', description: 'Handling online donations' },
  { id: 'docs-api', title: 'API Reference', url: '/docs/api', category: 'docs', description: 'Developer API documentation' },
];

export default function SiteSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter search results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return mockSearchData.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerQuery))
    );
  }, [query]);

  // Group results by category
  const groupedResults = useMemo(() => {
    return filteredResults.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, SearchItem[]>);
  }, [filteredResults]);

  // Handle navigation when item is selected
  const handleSelect = useCallback((url: string) => {
    router.push(url);
    setIsOpen(false);
    setQuery('');
  }, [router]);

  // Handle keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredResults[selectedIndex].url);
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--panel-2)] hover:bg-[var(--panel-3)] transition-colors"
        aria-label="Site search"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline text-sm text-[var(--muted)]">Search...</span>
        <kbd className="hidden sm:flex items-center gap-1 text-xs text-[var(--muted)]">
          <span className="font-sans">⌘</span>K
        </kbd>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl px-4">
          <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-[var(--border-soft)] flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)] flex-shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search marketing pages, blog, and docs..."
                autoFocus
                className="w-full bg-transparent outline-none text-[var(--text)] placeholder-[var(--muted)]"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-[var(--panel-2)] transition-colors"
                aria-label="Close search"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query ? (
                Object.entries(groupedResults).length > 0 ? (
                  Object.entries(groupedResults).map(([category, items]) => (
                    <div key={category} className="border-b border-[var(--border-soft)] last:border-b-0">
                      <div className="px-4 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                      <ul>
                        {items.map((item, index) => {
                          const globalIndex = filteredResults.findIndex(i => i.id === item.id);
                          const isSelected = globalIndex === selectedIndex;
                          
                          return (
                            <li key={item.id}>
                              <button
                                onClick={() => handleSelect(item.url)}
                                className={`w-full text-left px-4 py-3 hover:bg-[var(--panel-2)] transition-colors flex items-start gap-3 ${
                                  isSelected ? 'bg-[var(--accent-soft)]' : ''
                                }`}
                              >
                                <div className="mt-0.5">
                                  <div className="font-medium text-[var(--text)]">{item.title}</div>
                                  {item.description && (
                                    <div className="text-sm text-[var(--muted)] mt-1">{item.description}</div>
                                  )}
                                </div>
                                <div className="ml-auto text-xs text-[var(--muted)] flex-shrink-0">
                                  {item.category.charAt(0).toUpperCase()}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-[var(--muted)]">No results found for "{query}"</div>
                  </div>
                )
              ) : (
                <div className="p-8 text-center">
                  <div className="text-[var(--muted)]">Type to search marketing pages, blog, and docs</div>
                </div>
              )}
            </div>

            {/* Footer with shortcuts */}
            <div className="p-3 border-t border-[var(--border-soft)] text-xs text-[var(--muted)] flex justify-between">
              <div>↑↓ to navigate</div>
              <div>Enter to select • Esc to close</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
