export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  readTime: string
  category: string
  author: string
  coverImage: string
  featured?: boolean
  content: { heading: string; body: string }[]
}

import { apiClient } from "./api-client";

export const staticBlogPosts: BlogPost[] = [
  {
    slug: "getting-started-with-churchnepal",
    title: "Getting Started with ChurchNepal",
    excerpt:
      "Learn how to set up your church website in minutes using ChurchNepal's intuitive tools and templates.",
    date: "2024-01-15",
    readTime: "5 min read",
    category: "Getting Started",
    author: "Tarka Raj Jaishi",
    coverImage:
      "linear-gradient(135deg, var(--accent-soft), var(--gold-soft))",
    featured: true,
    content: [
      {
        heading: "Why ChurchNepal?",
        body:
          "ChurchNepal was built to give faith communities a beautiful, functional web presence without the headache of custom development. Our platform lets pastors, ministries, and church leaders focus on their congregations while we handle the technical details. From hosting to design, everything is optimized for church-specific needs.",
      },
      {
        heading: "Setting Up Your Account",
        body:
          "Signing up takes less than two minutes. Simply enter your church name, email address, and preferred subdomain, and your site is ready for customization. The guided onboarding walks you through selecting a theme, uploading your logo, and configuring basic settings. No credit card is required for the initial setup.",
      },
      {
        heading: "Choosing Your First Template",
        body:
          "We offer dozens of professionally designed templates tailored for churches, ministries, and religious organizations. Each template is mobile-responsive and includes pre-built sections for sermons, events, giving, and about pages. Preview templates in real time before making your selection.",
      },
      {
        heading: "Adding Your Content",
        body:
          "Once your template is selected, you can populate it with your church's unique story. The block-based editor makes it easy to add text, images, video sermons, and event calendars. You can drag and drop sections to rearrange layouts instantly. Every change is saved automatically, so you never lose important work.",
      },
      {
        heading: "Going Live",
        body:
          "When you are satisfied with how your site looks, hit the publish button to share it with your congregation and community. ChurchNepal includes free SSL certificates, global CDN hosting, and automatic backups from day one. You can continue refining your site after launch whenever inspiration strikes.",
      },
    ],
  },
  {
    slug: "5-ways-church-websites-drive-engagement",
    title: "5 Ways Church Websites Drive Engagement",
    excerpt:
      "Discover practical techniques to turn your church website into an active hub for community connection and growth.",
    date: "2024-02-08",
    readTime: "6 min read",
    category: "Growth",
    author: "Sarah Thompson",
    coverImage:
      "linear-gradient(135deg, var(--gold-soft), var(--good-soft))",
    content: [
      {
        heading: "Streamlined Event Calendars",
        body:
          "An up-to-date events page helps visitors plan their involvement. When people can quickly see upcoming services, Bible studies, and community outreach opportunities, they are more likely to participate. Interactive calendars with reminders and RSVP features make attendance effortless for busy families.",
      },
      {
        heading: "Online Sermon Archives",
        body:
          "Sharing past sermons extends your ministry beyond the church walls. A well-organized sermon library gives members access to teachings they missed or want to revisit. Adding searchable tags by topic or scripture makes it easy to find relevant messages for every stage of spiritual growth.",
      },
      {
        heading: "Integrated Giving Platforms",
        body:
          "Secure online giving removes friction and increases generosity. When donations can be made with a few taps, members are more likely to give regularly. Transparency tools that show giving history and fund allocations build trust and encourage ongoing financial support for church missions.",
      },
      {
        heading: "Community Prayer Walls",
        body:
          "Digital prayer request boards create a space for vulnerability and support. Members can share needs anonymously or publicly, and others can respond with encouragement. This feature fosters deeper fellowship and ensures no one goes through difficult seasons alone.",
      },
      {
        heading: "Mobile-First Design",
        body:
          "Most visitors now discover church websites on their phones. A mobile-optimized experience ensures that navigation, forms, and media load quickly on any device. Responsive design is not just a technical choice—it is an invitation to every person, regardless of how they access the internet.",
      },
    ],
  },
  {
    slug: "multi-tenant-architecture-explained",
    title: "Multi-Tenant Architecture Explained",
    excerpt:
      "A deep dive into how multi-tenant systems power thousands of church websites while keeping data isolated and secure.",
    date: "2024-03-12",
    readTime: "7 min read",
    category: "Technical",
    author: "Tarka Raj Jaishi",
    coverImage:
      "linear-gradient(135deg, var(--panel-2), var(--accent-soft))",
    content: [
      {
        heading: "What Is Multi-Tenancy?",
        body:
          "Multi-tenant architecture means multiple churches share the same application infrastructure while maintaining completely separate data environments. Instead of provisioning a new server for each client, we run a single optimized stack that efficiently serves many organizations. This approach reduces costs and improves reliability for everyone.",
      },
      {
        heading: "Data Isolation Strategies",
        body:
          "Every church's data remains logically separated through strict tenant identification at the database level. We use row-level security policies and encrypted connections to ensure no tenant can accidentally access another's information. Regular audits and automated alerts add an extra layer of protection against misconfigurations.",
      },
      {
        heading: "Scalability Without Complexity",
        body:
          "Because the underlying infrastructure is shared, we can allocate resources dynamically based on each church's traffic and usage patterns. A small parish in Kathmandu and a large cathedral with thousands of members both receive the performance they need without overprovisioning. This elasticity keeps hosting affordable.",
      },
      {
        heading: "Customization Within Boundaries",
        body:
          "While the core application is shared, each tenant can customize domains, branding, themes, and content freely. Our architecture separates tenant identity from shared logic, making these customizations safe and performant. Updates to the core platform roll out automatically without breaking individual church configurations.",
      },
      {
        heading: "Monitoring and Observability",
        body:
          "We monitor every tenant's performance, uptime, and error rates from a single pane of glass. This unified observability lets us detect issues early and resolve them before they impact Sunday services. Detailed logs and metrics are available to church administrators through their dedicated dashboards.",
      },
    ],
  },
  {
    slug: "theme-customization-for-churches",
    title: "Theme Customization for Churches",
    excerpt:
      "Explore how to match your church website's look and feel to your community's identity and values.",
    date: "2024-04-05",
    readTime: "5 min read",
    category: "Customization",
    author: "Sarah Thompson",
    coverImage:
      "linear-gradient(135deg, var(--good-soft), var(--panel-2))",
    content: [
      {
        heading: "Reflecting Your Identity",
        body:
          "Your church's website should feel like a natural extension of its physical space. Theme customization lets you align typography, color palettes, and imagery with your congregation's character. Whether you prefer a modern minimalist aesthetic or a traditional warm palette, the right design helps visitors feel at home before they even walk through your doors.",
      },
      {
        heading: "Working With CSS Variables",
        body:
          "ChurchNepal themes are built on a robust system of CSS custom properties. Adjusting accent colors, border shades, and background panels is as simple as changing variable values. This approach ensures consistency across every page and component while giving you creative freedom without touching core stylesheets.",
      },
      {
        heading: "Custom Fonts and Typography",
        body:
          "Typography shapes how your message is received. We support Google Fonts and custom font uploads so you can choose typefaces that match your church's voice. Pairing a readable body font with a distinctive heading font creates hierarchy and guides visitors naturally through your content.",
      },
      {
        heading: "Responsive Preview Tools",
        body:
          "Before publishing changes, preview your theme across desktop, tablet, and mobile views instantly. Our live preview mode highlights how responsive breakpoints affect navigation menus, image grids, and sermon players. Testing early prevents layout surprises and ensures every visitor has a polished experience.",
      },
      {
        heading: "Seasonal Theme Updates",
        body:
          "Many churches update their visual identity for Advent, Lent, or festival seasons. With ChurchNepal, swapping seasonal themes takes minutes rather than days. Create palette variations for special occasions and schedule them to go live automatically when the season begins.",
      },
    ],
  },
  {
    slug: "keeping-church-data-secure-and-isolated",
    title: "Keeping Church Data Secure and Isolated",
    excerpt:
      "Best practices and platform features that protect sensitive member information in a shared hosting environment.",
    date: "2024-05-18",
    readTime: "6 min read",
    category: "Security",
    author: "Tarka Raj Jaishi",
    coverImage:
      "linear-gradient(135deg, var(--border-soft), var(--gold-soft))",
    content: [
      {
        heading: "Understanding Shared Responsibility",
        body:
          "Security in a multi-tenant environment is a shared responsibility between ChurchNepal and each church administrator. We provide encryption, access controls, and infrastructure hardening by default. Church leaders must also enforce strong passwords, manage user permissions carefully, and train staff to recognize phishing attempts.",
      },
      {
        heading: "Encryption at Rest and in Transit",
        body:
          "All sensitive data, including member profiles and giving records, is encrypted using industry-standard algorithms. Database storage, backups, and file uploads are all protected by AES-256 encryption. Every API request and page load travels through TLS 1.3, ensuring data remains unreadable even if intercepted.",
      },
      {
        heading: "Role-Based Access Controls",
        body:
          "Not every staff member needs full administrative access to your church website. Role-based permissions let you grant exactly the rights each person requires. A volunteer updating the events calendar does not need the ability to modify financial settings. Granular controls reduce accidental exposure and unauthorized changes.",
      },
      {
        heading: "Regular Security Audits",
        body:
          "Our engineering team runs continuous vulnerability scanning and periodic third-party penetration tests. Findings are prioritized and patched according to severity. We also publish monthly transparency reports summarizing security incidents, fixes, and improvements so the community can trust our commitment to protection.",
      },
      {
        heading: "Incident Response Preparedness",
        body:
          "Even with the best precautions, incidents can occur. ChurchNepal maintains a documented incident response plan with clear escalation paths and communication templates. In the unlikely event of a data issue, we notify affected churches promptly, provide remediation steps, and support recovery efforts without placing blame.",
      },
    ],
  },
  {
    slug: "the-future-of-cloud-hosting-for-churches",
    title: "The Future of Cloud Hosting for Churches",
    excerpt:
      "How emerging cloud technologies are making church web hosting faster, greener, and more accessible than ever before.",
    date: "2024-06-22",
    readTime: "5 min read",
    category: "Future",
    author: "Sarah Thompson",
    coverImage:
      "linear-gradient(135deg, var(--accent-soft), var(--border-soft))",
    content: [
      {
        heading: "Edge Computing and Speed",
        body:
          "Edge computing places server resources closer to church visitors around the world. Instead of routing every request to a single data center, content is cached at local edge nodes. This architecture dramatically reduces load times and ensures that a member in Pokhara experiences the same fast site as someone in New York.",
      },
      {
        heading: "Sustainable Infrastructure",
        body:
          "Modern cloud providers increasingly run on renewable energy, making digital ministry more environmentally responsible. ChurchNepal partners with green hosting providers that offset carbon emissions and optimize resource usage. Choosing eco-friendly infrastructure aligns with stewardship values that many faith communities hold dear.",
      },
      {
        heading: "AI-Powered Content Assistance",
        body:
          "Artificial intelligence is beginning to assist with sermon transcription, event description drafting, and multilingual content translation. While technology cannot replace pastoral leadership, it can handle repetitive administrative tasks, freeing ministers to spend more time with their congregations and less time managing websites.",
      },
      {
        heading: "Interoperability and Open Standards",
        body:
          "The future of church technology depends on systems that communicate seamlessly. Open standards for events, calendars, and member directories allow ChurchNepal to integrate with existing church management software. This connectivity eliminates data silos and gives administrators a unified view of their ministry operations.",
      },
      {
        heading: "Community-Driven Innovation",
        body:
          "The needs of churches are evolving, and so is our platform. We actively gather feedback from pastors, ministry leaders, and volunteers to shape our roadmap. By prioritizing real-world use cases over theoretical features, we ensure that ChurchNepal remains practical, relevant, and genuinely helpful for the communities we serve.",
      },
    ],
  },
]

export function getAllPosts(): BlogPost[] {
  return staticBlogPosts
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return staticBlogPosts.find((post) => post.slug === slug)
}

export function getRelatedPosts(slug: string, count = 3): BlogPost[] {
  const current = getPostBySlug(slug)
  if (!current) return staticBlogPosts.slice(0, count)

  const sameCategory = staticBlogPosts.filter(
    (post) => post.category === current.category && post.slug !== current.slug,
  )
  const remaining =
    count - sameCategory.length > 0
      ? staticBlogPosts.filter(
          (post) => post.slug !== current.slug && post.category !== current.category,
        ).slice(0, count - sameCategory.length)
      : []

  return [...sameCategory, ...remaining].slice(0, count)
}

export function getCategories(): string[] {
  const categories = new Set(staticBlogPosts.map((post) => post.category))
  return Array.from(categories)
}

// Backend API post type (DB row shape from mc_blog_posts)
export interface BlogPostAPI {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  cover: string | null
  author: string
  category: string
  published: boolean
  published_at: string | null
  created_at: string
}

function estimateReadTime(body: string): string {
  const wordCount = body.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

export function apiPostToBlogPost(api: BlogPostAPI): BlogPost {
  const paragraphs = api.body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => ({ heading: p.split("\n")[0].trim(), body: p }))

  return {
    slug: api.slug,
    title: api.title,
    excerpt: api.excerpt,
    date: api.created_at,
    readTime: estimateReadTime(api.body),
    category: api.category,
    author: api.author,
    coverImage: api.cover ?? "linear-gradient(135deg, var(--accent-soft), var(--panel-2))",
    featured: false,
    content: paragraphs.length > 0 ? paragraphs : [{ heading: api.title, body: api.body }],
  }
}

export async function fetchPublicPosts(): Promise<BlogPost[]> {
  const response = await apiClient.get<BlogPostAPI[]>("/blog")
  return response.data.map(apiPostToBlogPost)
}

export async function fetchPublicPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await apiClient.get<BlogPostAPI>(`/blog/${encodeURIComponent(slug)}`)
    return apiPostToBlogPost(response.data)
  } catch {
    return null
  }
}
