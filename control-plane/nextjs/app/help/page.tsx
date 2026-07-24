'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import PublicLayout from '../public-layout';
import helpArticles, { getCategories } from '@/lib/help-data';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...getCategories()];
  
  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          article.body.join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularArticles = helpArticles.slice(0, 6);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--text)] mb-4">Help Center</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Find answers to common questions and learn how to make the most of Churchnepal
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-10 max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-[var(--muted)]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles..."
                className="w-full pl-10 pr-4 py-3 bg-[var(--panel)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Categories */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 sticky top-24">
                <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Categories</h2>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category}>
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category
                            ? 'bg-[var(--accent)] text-white'
                            : 'hover:bg-[var(--panel-2)] text-[var(--text)]'
                        }`}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Articles */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold text-[var(--text)] mb-6">
                {selectedCategory === 'All' ? 'All Articles' : selectedCategory}
              </h2>
              
              {filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/help/${article.slug}`}
                      className="block bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 hover:bg-[var(--panel-2)] transition-colors"
                    >
                      <h3 className="font-semibold text-[var(--text)] mb-2">{article.title}</h3>
                      <p className="text-sm text-[var(--muted)] mb-2">{article.excerpt}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
                        {article.category}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-[var(--muted)]">No articles found matching your criteria.</p>
                </div>
              )}

              {/* Popular Articles Section */}
              <div className="mt-12">
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-6">Popular Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {popularArticles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/help/${article.slug}`}
                      className="block bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 hover:bg-[var(--panel-2)] transition-colors"
                    >
                      <h3 className="font-semibold text-[var(--text)] mb-2">{article.title}</h3>
                      <p className="text-sm text-[var(--muted)] mb-2">{article.excerpt}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
                        {article.category}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
