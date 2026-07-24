// Mock blog data for demonstration purposes
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: {
    name: string;
    bio?: string;
    avatar?: string;
  };
  categories: string[];
  tags: string[];
  readTime: number;
  slug: string;
}

const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Building Stronger Communities Through Faith',
    excerpt: 'How churches can leverage technology to strengthen community bonds and reach more people.',
    content: `
# Building Stronger Communities Through Faith

## Introduction
In today\'s digital age, churches face unique challenges in maintaining strong community connections while adapting to new communication methods. Technology, when used thoughtfully, can serve as a bridge rather than a barrier.

## The Role of Digital Platforms
Modern church management systems provide tools for:
- Communication with congregation members
- Organizing events and activities
- Collecting donations securely
- Sharing resources and sermons

### Key Benefits
1. **Accessibility**: Making church resources available to those who cannot attend physically
2. **Engagement**: Creating interactive experiences beyond Sunday services
3. **Community Building**: Facilitating smaller group connections

## Conclusion
By embracing appropriate technologies, churches can enhance their mission while maintaining their core values.
`,
    date: '2024-05-15',
    author: {
      name: 'John Smith',
      bio: 'Senior Pastor with 15 years of experience in digital ministry',
      avatar: '/avatars/john-smith.jpg'
    },
    categories: ['Ministry', 'Technology'],
    tags: ['community', 'digital', 'engagement'],
    readTime: 5,
    slug: 'building-stronger-communities-through-faith'
  },
  {
    id: '2',
    title: 'The Future of Church Management Software',
    excerpt: 'Exploring upcoming trends and innovations in church administration technology.',
    content: `
# The Future of Church Management Software

## Emerging Trends
The landscape of church management software continues to evolve rapidly. Here are key trends to watch:

### Mobile-First Design
With increasing smartphone usage, church apps and mobile-optimized platforms become essential.

### Integrated Giving Solutions
Seamless donation processing through multiple payment methods including eSewa and Khalti.

### Community Features
Enhanced tools for small groups, volunteer coordination, and member engagement tracking.

## Conclusion
Staying ahead of technological trends helps churches better serve their communities.
`,
    date: '2024-06-20',
    author: {
      name: 'Sarah Johnson',
      bio: 'Technology Director focusing on faith-based solutions',
      avatar: '/avatars/sarah-johnson.jpg'
    },
    categories: ['Technology', 'Innovation'],
    tags: ['software', 'future', 'trends'],
    readTime: 7,
    slug: 'the-future-of-church-management-software'
  },
  {
    id: '3',
    title: 'Fundraising Strategies for Churches',
    excerpt: 'Effective methods to increase giving and support church missions.',
    content: `
# Fundraising Strategies for Churches

## Traditional Approaches
Historically, churches have relied on tithing and offering collections during services.

## Modern Methods
Today, churches can leverage:
- Online giving platforms
- Recurring donation programs
- Special fundraising campaigns
- Event-based fundraising

### Best Practices
1. Transparency in financial reporting
2. Clear communication about fund usage
3. Multiple giving options for convenience

## Conclusion
Diversified fundraising approaches help churches maintain financial stability.
`,
    date: '2024-04-10',
    author: {
      name: 'Michael Chen',
      bio: 'Financial consultant specializing in nonprofit organizations',
      avatar: '/avatars/michael-chen.jpg'
    },
    categories: ['Finance', 'Fundraising'],
    tags: ['giving', 'donations', 'finance'],
    readTime: 6,
    slug: 'fundraising-strategies-for-churches'
  },
  {
    id: '4',
    title: 'Small Group Ministry Success Stories',
    excerpt: 'Real examples of how small groups transform church communities.',
    content: `
# Small Group Ministry Success Stories

## Case Study 1: The Riverside Community
Riverside Church implemented a small group system that increased weekly attendance by 40%.

### Implementation Steps:
1. Leadership training program
2. Regular check-ins with group leaders
3. Resource sharing platform

## Case Study 2: Urban Faith Center
This downtown church created affinity-based groups that attracted young professionals.

## Key Takeaways
Successful small group ministries require:
- Clear purpose and goals
- Ongoing leader support
- Flexible meeting formats

## Conclusion
Small groups create deeper relationships and spiritual growth opportunities.
`,
    date: '2024-07-05',
    author: {
      name: 'Emma Rodriguez',
      bio: 'Ministry coach with expertise in small group development',
      avatar: '/avatars/emma-rodriguez.jpg'
    },
    categories: ['Ministry', 'Community'],
    tags: ['small-groups', 'community', 'growth'],
    readTime: 8,
    slug: 'small-group-ministry-success-stories'
  }
];

// Extract unique categories
export const getCategories = (): string[] => {
  const categoriesSet = new Set<string>();
  mockBlogPosts.forEach(post => {
    post.categories.forEach(category => categoriesSet.add(category));
  });
  return Array.from(categoriesSet);
};

// Extract unique tags
export const getTags = (): string[] => {
  const tagsSet = new Set<string>();
  mockBlogPosts.forEach(post => {
    post.tags.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet);
};

// Extract unique authors
export const getAuthors = (): { name: string; bio?: string; avatar?: string }[] => {
  const authorsMap = new Map<string, { name: string; bio?: string; avatar?: string }>();
  mockBlogPosts.forEach(post => {
    const authorKey = post.author.name;
    if (!authorsMap.has(authorKey)) {
      authorsMap.set(authorKey, post.author);
    }
  });
  return Array.from(authorsMap.values());
};

// Get all blog posts
export const getAllBlogPosts = (): BlogPost[] => {
  return mockBlogPosts;
};

// Get a single blog post by slug
export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return mockBlogPosts.find(post => post.slug === slug);
};

// Get blog posts by category
export const getBlogPostsByCategory = (category: string): BlogPost[] => {
  return mockBlogPosts.filter(post => post.categories.includes(category));
};

// Get blog posts by tag
export const getBlogPostsByTag = (tag: string): BlogPost[] => {
  return mockBlogPosts.filter(post => post.tags.includes(tag));
};

// Get blog posts by author
export const getBlogPostsByAuthor = (authorName: string): BlogPost[] => {
  return mockBlogPosts.filter(post => post.author.name === authorName);
};

