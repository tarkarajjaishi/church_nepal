import type { Metadata } from 'next';
import { getBlogPostBySlug } from '@/lib/blog-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

// The post page is a client component and so cannot export metadata. Without
// this every post shared the site-wide title and description, which is the
// difference between a post that can rank for its own subject and one that
// looks to a crawler like another copy of the homepage.
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    authors: [{ name: post.author.name }],
    keywords: [...post.categories, ...post.tags],
    openGraph: {
      images: ['/opengraph-image'],
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url,
      publishedTime: post.date,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

export default async function BlogPostLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return children;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author.name },
    publisher: { '@type': 'Organization', name: 'Church Nepal', url: SITE_URL },
    keywords: [...post.categories, ...post.tags].join(', '),
    inLanguage: 'en-NP',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
