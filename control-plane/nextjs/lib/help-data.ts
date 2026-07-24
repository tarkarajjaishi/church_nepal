export interface HelpArticle {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string[];
}

const helpArticles: HelpArticle[] = [
  {
    slug: "getting-started",
    title: "Getting Started with Churchnepal",
    category: "Beginner",
    excerpt: "Learn how to set up your church website and get started quickly.",
    body: [
      "# Getting Started with Churchnepal",
      "Welcome to Churchnepal! This guide will walk you through setting up your church website.",
      "## Step 1: Sign Up",
      "Create an account using your church email address.",
      "## Step 2: Customize Your Site",
      "Use our easy editor to add your church information, logo, and services.",
      "## Step 3: Publish",
      "Make your site live and start connecting with your community."
    ]
  },
  {
    slug: "customizing-your-site",
    title: "Customizing Your Church Website",
    category: "Design",
    excerpt: "Tips and tricks for customizing your church website design.",
    body: [
      "# Customizing Your Church Website",
      "Our platform allows extensive customization to reflect your church's unique identity.",
      "## Changing Themes",
      "Navigate to Settings > Theme to choose from our pre-designed themes.",
      "## Adding Images",
      "Upload high-quality images for your hero section, gallery, and events.",
      "## Updating Content",
      "Edit any text directly on the page using our inline editor."
    ]
  },
  {
    slug: "managing-members",
    title: "Managing Your Church Members",
    category: "CRM",
    excerpt: "How to add, manage, and communicate with your church members.",
    body: [
      "# Managing Your Church Members",
      "Keep track of your congregation with our member management tools.",
      "## Adding New Members",
      "Go to People > Add Person to enter member details.",
      "## Contact Information",
      "Update contact info, attendance records, and communication preferences.",
      "## Communication Tools",
      "Send newsletters and announcements directly from the dashboard."
    ]
  },
  {
    slug: "online-giving",
    title: "Setting Up Online Giving",
    category: "Finance",
    excerpt: "Enable online donations and offerings for your church.",
    body: [
      "# Setting Up Online Giving",
      "Accept donations securely through our integrated payment system.",
      "## Payment Providers",
      "Connect with eSewa, Khalti, or Stripe for processing payments.",
      "## Creating Funds",
      "Set up different donation funds like General Fund, Building Fund, etc.",
      "## Reporting",
      "Track donations and generate financial reports easily."
    ]
  },
  {
    slug: "events-calendar",
    title: "Managing Events and Calendar",
    category: "Events",
    excerpt: "Learn how to create and promote church events.",
    body: [
      "# Managing Events and Calendar",
      "Keep your community informed about upcoming events.",
      "## Creating Events",
      "Add event details like title, date, time, location, and description.",
      "## RSVP System",
      "Allow members to RSVP and track attendance.",
      "## Recurring Events",
      "Set up weekly or monthly recurring events."
    ]
  },
  {
    slug: "blog-posts",
    title: "Creating Blog Posts",
    category: "Content",
    excerpt: "Share news, sermons, and updates with your blog.",
    body: [
      "# Creating Blog Posts",
      "Keep your community engaged with regular blog posts.",
      "## Writing Posts",
      "Use our rich text editor to format your posts.",
      "## Adding Media",
      "Include images, videos, and documents to enhance your posts.",
      "## Publishing",
      "Schedule posts for future publishing or publish immediately."
    ]
  },
  {
    slug: "sermons-podcasts",
    title: "Uploading Sermons and Podcasts",
    category: "Media",
    excerpt: "Share your sermons and podcasts with your congregation.",
    body: [
      "# Uploading Sermons and Podcasts",
      "Make your sermons accessible anytime, anywhere.",
      "## Uploading Audio/Video",
      "Upload sermon files directly or link to external hosting.",
      "## Adding Descriptions",
      "Include sermon notes, scriptures, and speaker information.",
      "## Categorizing",
      "Organize sermons by series, speaker, or topic."
    ]
  },
  {
    slug: "groups-ministries",
    title: "Creating Groups and Ministries",
    category: "Groups",
    excerpt: "Organize small groups, Bible studies, and ministries.",
    body: [
      "# Creating Groups and Ministries",
      "Facilitate community building through organized groups.",
      "## Setting Up Groups",
      "Define group details like name, description, meeting times, and leaders.",
      "## Group Membership",
      "Add members to specific groups and manage attendance.",
      "## Communication",
      "Enable group-specific messaging and announcements."
    ]
  },
  {
    slug: "email-newsletters",
    title: "Sending Email Newsletters",
    category: "Communication",
    excerpt: "Reach out to your congregation with email newsletters.",
    body: [
      "# Sending Email Newsletters",
      "Stay connected with your community through email.",
      "## Creating Templates",
      "Choose from our professional newsletter templates.",
      "## Segmenting Audience",
      "Target specific groups or the entire congregation.",
      "## Tracking Engagement",
      "Monitor open rates and click-through rates."
    ]
  },
  {
    slug: "mobile-app",
    title: "Using the Mobile App",
    category: "Mobile",
    excerpt: "Access your church website features on the go.",
    body: [
      "# Using the Mobile App",
      "Our mobile app provides full access to your church website.",
      "## Downloading",
      "Available on both iOS and Android platforms.",
      "## Features",
      "Access events, giving, sermons, and more from your phone.",
      "## Notifications",
      "Receive push notifications for important updates."
    ]
  },
  {
    slug: "troubleshooting",
    title: "Common Issues and Troubleshooting",
    category: "Support",
    excerpt: "Solutions to common problems you might encounter.",
    body: [
      "# Common Issues and Troubleshooting",
      "Find solutions to frequently encountered issues.",
      "## Login Problems",
      "Ensure you're using the correct credentials. Reset password if needed.",
      "## Upload Failures",
      "Check file size limits and supported formats.",
      "## Sync Issues",
      "Refresh data or contact support for persistent sync problems."
    ]
  },
  {
    slug: "security-best-practices",
    title: "Security Best Practices",
    category: "Security",
    excerpt: "Protect your church website and member data.",
    body: [
      "# Security Best Practices",
      "Maintain high security standards for your church data.",
      "## Strong Passwords",
      "Use complex passwords and update them regularly.",
      "## Two-Factor Authentication",
      "Enable 2FA for admin accounts.",
      "## Regular Updates",
      "Keep your software updated to the latest version."
    ]
  }
];

export default helpArticles;

export const getHelpArticleBySlug = (slug: string) => {
  return helpArticles.find(article => article.slug === slug);
};

export const getAllHelpArticles = () => {
  return helpArticles;
};

export const getCategories = () => {
  return Array.from(new Set(helpArticles.map(article => article.category)));
};
