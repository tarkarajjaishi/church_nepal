'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/blog-data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

// Function to extract headings from content
const extractHeadings = (content: string) => {
  const headingRegex = /^#{1,6}\s+(.*)$/gm;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[0].split(' ')[0].length; // Count the number of # to determine level
    const text = match[1];
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    headings.push({
      level,
      text,
      id
    });
  }
  
  return headings;
};

export default function BlogPostPage({ params }: Props) {
  const { slug } = use(params);
  const post = getBlogPostBySlug(slug);
  const allPosts = getAllBlogPosts();
  
  if (!post) {
    notFound();
  }

  // Get related posts (same category, different post)
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && p.categories.some(cat => post.categories.includes(cat)))
    .slice(0, 3);

  const [progress, setProgress] = useState(0);
  const [headings, setHeadings] = useState<{level: number, text: string, id: string}[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract headings from content
    const extractedHeadings = extractHeadings(post.content);
    setHeadings(extractedHeadings);
    
    // Calculate reading progress
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const scrollPosition = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const calculatedProgress = Math.min(100, (scrollPosition / documentHeight) * 100);
      setProgress(calculatedProgress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  // Share functions
  const shareToTwitter = () => {
    const url = `${window.location.origin}/blog/${post.slug}`;
    const text = `Check out this article: ${post.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = `${window.location.origin}/blog/${post.slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `${window.location.origin}/blog/${post.slug}`;
    const title = encodeURIComponent(post.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${title}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
  };

  // Render content with proper formatting
  const renderContent = (content: string) => {
    // Split content by newlines to process each line
    const lines = content.split('\n');
    const elements = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if it's a heading
      const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[0].split(' ')[0].length;
        const text = headingMatch[1];
        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        
        elements.push(
          React.createElement(
            `h${level}`,
            { key: i, id },
            text
          )
        );
      } 
      // Check if it's a paragraph
      else if (line.trim() !== '') {
        elements.push(
          <p key={i} className="mb-4 leading-relaxed">
            {line}
          </p>
        );
      }
      // Empty line becomes a break
      else {
        elements.push(<br key={i} />);
      }
    }
    
    return elements;
  };

  return (
    <article className="container py-8">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-[var(--border-soft)]">
        <div 
          className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center">
                <span className="font-semibold">{post.author.name.charAt(0)}</span>
              </div>
              <div>
                <Link 
                  href={`/blog/author/${post.author.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="font-medium hover:text-[var(--accent)]"
                >
                  {post.author.name}
                </Link>
                <p className="text-xs text-[var(--muted)]">{post.date} · {post.readTime} min read</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Link key={category} href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}>
                <Badge variant="secondary" className="bg-[var(--accent-soft)] hover:bg-[var(--accent)]">
                  {category}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
              <Badge variant="outline" className="border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)]">
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      </header>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-3/4">
          <div 
            ref={contentRef}
            className="prose prose-invert max-w-none"
          >
            {renderContent(post.content)}
          </div>
          
          {/* Social sharing buttons */}
          <div className="mt-12 pt-6 border-t border-[var(--border)]">
            <h3 className="text-lg font-semibold mb-4">Share this article</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={shareToTwitter}
                variant="outline" 
                className="border-[var(--border)] hover:bg-[var(--accent-soft)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
                Twitter
              </Button>
              
              <Button 
                onClick={shareToFacebook}
                variant="outline" 
                className="border-[var(--border)] hover:bg-[var(--accent-soft)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                Facebook
              </Button>
              
              <Button 
                onClick={shareToLinkedIn}
                variant="outline" 
                className="border-[var(--border)] hover:bg-[var(--accent-soft)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect width="4" height="12" x="2" y="9"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                LinkedIn
              </Button>
              
              <Button 
                onClick={copyToClipboard}
                variant="outline" 
                className="border-[var(--border)] hover:bg-[var(--accent-soft)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Link
              </Button>
            </div>
          </div>
        </div>
        
        {/* Table of Contents */}
        <aside className="lg:w-1/4">
          <div className="sticky top-24 bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="font-semibold mb-3">Table of Contents</h3>
            <ul className="space-y-2">
              {headings.map((heading, index) => (
                <li key={index} className={`ml-${(heading.level - 1) * 2}`}>
                  <a 
                    href={`#${heading.id}`} 
                    className="block py-1 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      
      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <div 
                key={relatedPost.id} 
                className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5"
              >
                <h3 className="text-lg font-semibold mb-2">
                  <Link href={`/blog/${relatedPost.slug}`} className="hover:text-[var(--accent)]">
                    {relatedPost.title}
                  </Link>
                </h3>
                <p className="text-[var(--muted)] text-sm mb-3">{relatedPost.excerpt}</p>
                <div className="flex justify-between items-center text-xs text-[var(--muted)]">
                  <span>{relatedPost.date}</span>
                  <span>{relatedPost.readTime} min read</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
