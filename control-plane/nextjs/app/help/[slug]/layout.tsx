import type { Metadata } from 'next';
import { getHelpArticleBySlug } from '@/lib/help-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com';

// Same reason as the blog posts: the article page is a client component, so
// without this every help article shares one title and one description.
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);
  if (!article) return {};

  const url = `${SITE_URL}/help/${article.slug}`;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: { title: article.title, description: article.excerpt, url, type: 'article' },
  };
}

export default function HelpArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
