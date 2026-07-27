import { notFound } from 'next/navigation';
import { getAuthors, getBlogPostsByAuthor } from '@/lib/blog-data';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const authors = getAuthors();
  return authors.map((author) => ({
    slug: author.name.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const authorName = decodeURIComponent(slug.replace(/-/g, ' '));
  const posts = getBlogPostsByAuthor(authorName);
  const author = posts.length > 0 ? posts[0].author : null;

  if (!author || posts.length === 0) {
    notFound();
  }

  return (
    <div className="container py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Articles by {authorName}</h1>
        {author.bio && (
          <p className="text-[var(--muted)] max-w-2xl mx-auto">{author.bio}</p>
        )}
      </div>
      
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
