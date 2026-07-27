import { notFound } from 'next/navigation';
import { getTags, getBlogPostsByTag } from '@/lib/blog-data';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const tags = getTags();
  return tags.map((tag) => ({
    slug: tag.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tagName = decodeURIComponent(slug.replace(/-/g, ' '));
  const posts = getBlogPostsByTag(tagName);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Tag: #{tagName}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex flex-col h-full"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-[var(--accent)] transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-[var(--muted)] text-sm mb-3">{post.excerpt}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Badge variant="secondary" className="bg-[var(--accent-soft)] hover:bg-[var(--accent)]">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm text-[var(--muted)]">
                <span>{post.date}</span>
                <span>{post.readTime} min read</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

