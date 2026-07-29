'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import PublicLayout from '../../public-layout';
import { getHelpArticleBySlug, getAllHelpArticles } from '@/lib/help-data';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default function HelpArticlePage({ params }: Props) {
  const { slug } = use(params);
  const article = getHelpArticleBySlug(slug);
  const allArticles = getAllHelpArticles();

  if (!article) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text)] mb-4">Article Not Found</h1>
            <Link href="/help" className="text-[var(--accent)] hover:underline">
              Return to Help Center
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Get related articles (same category, excluding current)
  const relatedArticles = allArticles
    .filter(a => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3);

  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    // In a real app, you would send this feedback to your backend
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-[var(--muted)] mb-6">
            <Link href="/" className="hover:text-[var(--text)]">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/help" className="hover:text-[var(--text)]">Help Center</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-[var(--text)]">{article.title}</span>
          </nav>

          <article className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 md:p-8">
            <header className="mb-6">
              <span className="inline-block px-3 py-1 text-sm bg-[var(--accent-soft)] text-[var(--accent)] rounded-full mb-4">
                {article.category}
              </span>
              <h1 className="text-3xl font-bold text-[var(--text)] mb-4">{article.title}</h1>
              <p className="text-[var(--muted)]">{article.excerpt}</p>
            </header>

            <div className="prose prose-invert max-w-none">
              {article.body.map((section, index) => {
                // Check if this is a heading (starts with #)
                if (section.startsWith('# ')) {
                  return (
                    <h2 key={index} className="text-2xl font-semibold text-[var(--text)] mt-8 mb-4">
                      {section.substring(2)} {/* Remove '# ' prefix */}
                    </h2>
                  );
                } else if (section.startsWith('## ')) {
                  return (
                    <h3 key={index} className="text-xl font-semibold text-[var(--text)] mt-6 mb-3">
                      {section.substring(3)} {/* Remove '## ' prefix */}
                    </h3>
                  );
                } else {
                  // For paragraphs, split by double newlines to preserve formatting
                  const paragraphs = section.split('\n\n');
                  return paragraphs.map((paragraph, pIndex) => (
                    <p key={`${index}-${pIndex}`} className="text-[var(--text)] mb-4">
                      {paragraph.trim()}
                    </p>
                  ));
                }
              })}
            </div>
          </article>

          {/* Feedback Section */}
          <div className="mt-8 bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Was this article helpful?</h3>
            {!feedback ? (
              <div className="flex space-x-4">
                <button
                  onClick={() => handleFeedback('positive')}
                  className="flex items-center px-4 py-2 bg-[var(--good-soft)] text-[var(--good)] rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Yes
                </button>
                <button
                  onClick={() => handleFeedback('negative')}
                  className="flex items-center px-4 py-2 bg-[var(--panel-2)] text-[var(--text)] rounded-lg hover:bg-[var(--panel-3)] transition-colors"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  No
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                {feedback === 'positive' ? (
                  <span className="text-[var(--good)] flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-2" /> Thank you for your feedback!
                  </span>
                ) : (
                  <span className="text-[var(--text)] flex items-center">
                    <ThumbsDown className="w-4 h-4 mr-2" /> We'll work to improve this article.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-[var(--text)] mb-4">Related Articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/help/${related.slug}`}
                    className="block bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 hover:bg-[var(--panel-2)] transition-colors"
                  >
                    <h4 className="font-medium text-[var(--text)] mb-2">{related.title}</h4>
                    <p className="text-sm text-[var(--muted)] mb-2">{related.excerpt}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
                      {related.category}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/help" className="inline-flex items-center text-[var(--accent)] hover:underline">
              Back to Help Center
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
