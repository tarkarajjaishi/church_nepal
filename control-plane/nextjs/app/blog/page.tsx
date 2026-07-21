"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PublicLayout from "../public-layout";
import { useTranslation } from "@/components/i18n-hook";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  coverImage: string;
  featured?: boolean;
  author: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Getting Started with ChurchNepal",
    excerpt: "A beginner's guide to launching your first church website with our platform. Learn how to set up your church's online presence in minutes with our intuitive admin interface.",
    date: "2024-01-15",
    readTime: "5 min read",
    category: "Getting Started",
    coverImage: "linear-gradient(135deg, var(--accent-soft), var(--gold-soft))",
    author: "Tarka Raj Jaishi",
  },
  {
    id: 2,
    title: "5 Ways Church Websites Drive Engagement",
    excerpt: "How a professional online presence can help grow your church community. Discover strategies to increase attendance, donations, and community involvement through digital channels.",
    date: "2024-01-10",
    readTime: "8 min read",
    category: "Growth",
    coverImage: "linear-gradient(135deg, var(--good-soft), var(--accent-soft))",
    author: "Sarah Thompson",
  },
  {
    id: 3,
    title: "Multi-Tenant Architecture Explained",
    excerpt: "Understanding how we keep every church completely isolated while sharing infrastructure. A deep dive into our security and data isolation practices.",
    date: "2024-01-05",
    readTime: "6 min read",
    category: "Technical",
    coverImage: "linear-gradient(135deg, var(--panel-2), var(--border-soft))",
    featured: true,
    author: "Tarka Raj Jaishi",
  },
  {
    id: 4,
    title: "Theme Customization for Churches",
    excerpt: "Making your church website reflect your unique style and branding. Learn how to personalize colors, fonts, and layouts without touching any code.",
    date: "2024-01-01",
    readTime: "7 min read",
    category: "Customization",
    coverImage: "linear-gradient(135deg, var(--gold-soft), var(--panel-2))",
    author: "Michael Johnson",
  },
  {
    id: 5,
    title: "Security Best Practices for Church Sites",
    excerpt: "Keeping your church's data safe and secure in the digital age. Essential tips for protecting member information and maintaining trust.",
    date: "2023-12-28",
    readTime: "4 min read",
    category: "Security",
    coverImage: "linear-gradient(135deg, var(--danger-soft), var(--panel-2))",
    author: "Tarka Raj Jaishi",
  },
  {
    id: 6,
    title: "Future of Cloud Hosting for Churches",
    excerpt: "How cloud technology is revolutionizing church website management. Explore the benefits of modern infrastructure for ministries worldwide.",
    date: "2023-12-20",
    readTime: "10 min read",
    category: "Future",
    coverImage: "linear-gradient(135deg, var(--accent-soft), var(--panel))",
    author: "David Chen",
  },
  {
    id: 7,
    title: "Building Community Through Digital Ministry",
    excerpt: "Strategies for engaging your congregation online with live streams, prayer requests, and event management.",
    date: "2023-12-15",
    readTime: "6 min read",
    category: "Growth",
    coverImage: "linear-gradient(135deg, var(--good-soft), var(--accent-soft))",
    author: "Pastor Raj Kumar",
  },
  {
    id: 8,
    title: "SEO Optimization for Church Websites",
    excerpt: "Make your church discoverable in local search results. Learn optimization techniques that bring visitors to your digital doors.",
    date: "2023-12-10",
    readTime: "9 min read",
    category: "Getting Started",
    coverImage: "linear-gradient(135deg, var(--gold-soft), var(--panel-2))",
    author: "Emily Roberts",
  },
];

const categories = ["All", "Getting Started", "Growth", "Technical", "Customization", "Security", "Future"];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function BlogPage() {
  const { t } = useTranslation();
  const featuredPost = blogPosts.find(post => post.featured) || blogPosts[0];
  const regularPosts = blogPosts.filter(post => post.id !== featuredPost.id);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Hero Section */}
        <section className="section-wrapper-lg text-center" aria-labelledby="blog-title">
          <h1 id="blog-title" className="lp-h1 mb-4">ChurchNepal Blog</h1>
          <p className="lp-lead max-w-2xl mx-auto text-[var(--muted)]">
            {t("blog.hero.subtitle")}
          </p>
        </section>

        {/* Featured Post Hero */}
        <section className="section-wrapper" aria-label="Featured post">
          <Link href={`/blog/${featuredPost.id}`} className="block group focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-lg">
            <Card variant="interactive" className="overflow-hidden">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Cover Image */}
                <div
                  className="h-64 md:h-full min-h-[280px] bg-gradient-to-br"
                  style={{ background: featuredPost.coverImage }}
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
                      <time dateTime={featuredPost.date}>{formatDate(featuredPost.date)}</time>
                      <span aria-hidden="true">•</span>
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </section>

        {/* Category Filter */}
        <section className="section-wrapper-sm" aria-label="Filter posts by category">
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                aria-label={`Filter by ${category}`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="section-wrapper" aria-label="All blog posts">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="block group focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded-lg"
                aria-label={`Read "${post.title}"`}
              >
                <Card variant="interactive" className="flex flex-col h-full overflow-hidden">
                  {/* Cover Image */}
                  <div
                    className="h-48 bg-gradient-to-br"
                    style={{ background: post.coverImage }}
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
                        <time dateTime={post.date}>{formatDate(post.date)}</time>
                        <span aria-hidden="true">•</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}