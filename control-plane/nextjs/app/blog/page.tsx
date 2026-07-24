"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "../public-layout";
import { useTranslation } from "@/components/i18n-hook";
import { fetchPublicPosts, type BlogPost } from "@/lib/blog-data";

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function BlogPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicPosts()
      .then((data) => {
        if (!cancelled) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load posts");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = Array.from(new Set(posts.map((p) => p.category)));
  const featuredPost = posts.find((post) => post.featured);

  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const isFiltering = searchQuery !== "" || selectedCategory !== "All";

  const gridPosts =
    !isFiltering && featuredPost
      ? posts.filter((post) => post.slug !== featuredPost.slug)
      : filteredPosts;

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <p className="text-[var(--muted)]">Loading posts...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <p className="text-danger">{error}</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Hero Section */}
        <section className="section-wrapper-lg text-center" aria-labelledby="blog-title">
          <h1 id="blog-title" className="lp-h1 mb-4">
            ChurchNepal Blog
          </h1>
          <p className="lp-lead max-w-2xl mx-auto text-[var(--muted)]">
            {t("blog.hero.subtitle")}
          </p>
        </section>

        {/* Search and Filters */}
        <section className="section-wrapper-sm" aria-label="Search and filter posts">
          <div className="max-w-2xl mx-auto mb-4">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${
                selectedCategory === "All"
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${
                  selectedCategory === category
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Post Hero */}
        {!isFiltering && featuredPost && (
          <section className="section-wrapper" aria-label="Featured post">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="block group focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-lg"
            >
              <Card variant="interactive" className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Cover Image */}
                  <div
                    className="h-64 md:h-full min-h-[280px] bg-gradient-to-br"
                    style={{ background: featuredPost.coverImage || "var(--accent-soft)" }}
                    aria-hidden="true"
                  >
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-24 h-24 text-[var(--accent)] opacity-30"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V7h14v12z" />
                        <path d="M15 11h2v4h-2zm0-2h2v2h-2zm-4 4h2v2H9v-2zm0-2h2v2H9v-2zm-4 4h2v2H5v-2zm0-2h2v2H5v-2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <Badge variant="accent" className="mb-3">
                        Featured
                      </Badge>
                      <Badge variant="outline" className="ml-2">
                        {featuredPost.category}
                      </Badge>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-strong)] mb-4 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                      {featuredPost.title}
                    </h2>

                    <p className="text-[var(--muted)] mb-6 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>

                    <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                      <span>By {featuredPost.author}</span>
                      <div className="flex items-center gap-3">
                        {featuredPost.date && (
                          <>
                            <time dateTime={featuredPost.date}>
                              {formatDate(featuredPost.date)}
                            </time>
                            <span aria-hidden="true">•</span>
                          </>
                        )}
                        <span>{featuredPost.readTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className="section-wrapper" aria-label="All blog posts">
          {gridPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--muted)] text-lg">No articles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block group focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-lg"
                  aria-label={`Read "${post.title}"`}
                >
                  <Card variant="interactive" className="flex flex-col h-full overflow-hidden">
                    {/* Cover Image */}
                    <div
                      className="h-48 bg-gradient-to-br"
                      style={{ background: post.coverImage || "var(--accent-soft)" }}
                      aria-hidden="true"
                    >
                      <div className="flex items-center justify-center h-full">
                        <svg
                          className="w-12 h-12 text-[var(--accent)] opacity-30"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V7h14v12z" />
                          <path d="M15 11h2v4h-2zm0-2h2v2h-2zm-4 4h2v2H9v-2zm0-2h2v2H9v-2zm-4 4h2v2H5v-2zm0-2h2v2H5v-2z" />
                        </svg>
                      </div>
                    </div>

                    <CardContent className="flex-1 flex flex-col p-6">
                      <div className="mb-3">
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg text-[var(--text-strong)] mb-3 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-[var(--muted)] text-sm mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-3 border-t border-[var(--border)]">
                        <span className="font-medium">{post.author}</span>
                        <div className="flex items-center gap-2">
                          {post.date && (
                            <>
                              <time dateTime={post.date}>
                                {formatDate(post.date)}
                              </time>
                              <span aria-hidden="true">•</span>
                            </>
                          )}
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
}
