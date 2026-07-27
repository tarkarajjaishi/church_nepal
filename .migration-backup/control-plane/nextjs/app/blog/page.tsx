import { getAllBlogPosts, getCategories, getTags, getAuthors } from '@/lib/blog-data';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const categories = getCategories();
  const tags = getTags();
  const authors = getAuthors();

  return (
    <div className="container py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Our Blog</h1>
        <p className="text-[var(--muted)] max-w-2xl mx-auto">
          Insights, stories, and resources for churches and faith communities
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link key={category} href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}>
              <Badge variant="secondary" className="bg-[var(--accent-soft)] hover:bg-[var(--accent)]">
                {category}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Popular Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 10).map((tag) => (
            <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
              <Badge variant="outline" className="border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)]">
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Authors</h2>
        <div className="flex flex-wrap gap-2">
          {authors.map((author) => (
            <Link key={author.name} href={`/blog/author/${author.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <Badge variant="outline" className="border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)]">
                {author.name}
              </Badge>
            </Link>
          ))}
        </div>
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
              
              <div className="flex flex-wrap gap-2 mb-3">
                {post.categories.map((category) => (
                  <Link key={category} href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Badge variant="secondary" className="bg-[var(--accent-soft)] hover:bg-[var(--accent)]">
                      {category}
                    </Badge>
                  </Link>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Badge variant="outline" className="border-[var(--border)] text-[var(--muted)] hover:bg-[var(--accent-soft)]">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm text-[var(--muted)]">
                <Link 
                  href={`/blog/author/${post.author.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="hover:text-[var(--accent)]"
                >
                  {post.author.name}
                </Link>
                <span>{post.date} · {post.readTime} min read</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
