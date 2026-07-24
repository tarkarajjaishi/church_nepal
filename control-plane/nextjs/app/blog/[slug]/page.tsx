"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicLayout from "../../public-layout";
import { Badge } from "@/components/ui/badge";
import { fetchPublicPost, fetchPublicPosts, type BlogPost } from "@/lib/blog-data";

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function RelatedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 transition-colors hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
    >
      <Badge variant="outline" className="mb-2 text-xs">
        {post.category}
      </Badge>
      <h3 className="font-semibold text-sm text-[var(--text-strong)] line-clamp-2 mb-2">
        {post.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span>{post.author}</span>
        <span aria-hidden="true">•</span>
        {post.date && (
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        )}
      </div>
    </Link>
  );
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchPublicPost(slug)
      .then((data) => {
        if (!cancelled) {
          setPost(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    setLoading(false);

    fetchPublicPostsForRelated(post.slug, post.category).then((data) => {
      if (!cancelled) {
        setRelated(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [post]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <p className="text-[var(--muted)]">Loading post...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !post) {
    notFound();
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] mb-8 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded"
          >
            ← Back to blog
          </Link>

          <header className="mb-8">
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="text-4xl font-bold text-[var(--text-strong)] mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[var(--muted)]">
              <span>{post.author}</span>
              <span aria-hidden="true">•</span>
              {post.date && (
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              )}
              <span aria-hidden="true">•</span>
              <span>{post.readTime}</span>
            </div>
          </header>

          <div
            className="h-64 rounded-xl mb-12"
            style={{ background: post.coverImage || "var(--accent-soft)" }}
            aria-hidden="true"
          />

          <div className="space-y-10">
            {post.content.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-semibold text-[var(--text-strong)] mb-3">
                  {section.heading}
                </h2>
                <p className="text-[var(--muted)] leading-relaxed">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </article>

        {related.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-16">
            <h3 className="text-2xl font-semibold text-[var(--text-strong)] mb-6">
              Related articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((relatedPost) => (
                <RelatedCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}

async function fetchPublicPostsForRelated(
  currentSlug: string,
  currentCategory: string,
): Promise<BlogPost[]> {
  try {
    const posts = await fetchPublicPosts();
    return posts
      .filter((p) => p.slug !== currentSlug)
      .sort((a, b) => {
        if (a.category === currentCategory && b.category !== currentCategory) return -1
        if (b.category === currentCategory && a.category !== currentCategory) return 1
        return 0
      })
      .slice(0, 3)
  } catch {
    return []
  }
}
