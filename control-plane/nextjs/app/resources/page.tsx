"use client";

import { useState } from "react";
import PublicLayout from "../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define types for our resources
type ResourceType = "guide" | "template" | "webinar" | "blog" | "help" | "community";

interface Resource {
  id: number;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  date?: string;
  duration?: string;
}

const initialResources: Resource[] = [
  {
    id: 1,
    title: "Getting Started with Church Management",
    description: "Essential steps to set up and configure your church management system.",
    type: "guide",
    url: "/docs/getting-started",
    date: "2026-06-15"
  },
  {
    id: 2,
    title: "Event Planning Template",
    description: "Comprehensive template for planning and organizing church events.",
    type: "template",
    url: "#",
    date: "2026-05-22"
  },
  {
    id: 3,
    title: "Online Giving Best Practices",
    description: "Learn how to effectively manage online donations and giving.",
    type: "webinar",
    url: "#",
    duration: "45 min"
  },
  {
    id: 4,
    title: "Building Community Through Small Groups",
    description: "Strategies for fostering deeper connections in small group settings.",
    type: "blog",
    url: "/blog/small-groups",
    date: "2026-07-10"
  },
  {
    id: 5,
    title: "Volunteer Management Guide",
    description: "How to recruit, organize, and appreciate volunteers effectively.",
    type: "guide",
    url: "/docs/volunteers",
    date: "2026-04-18"
  },
  {
    id: 6,
    title: "Social Media Content Calendar",
    description: "Monthly templates for engaging social media content.",
    type: "template",
    url: "#",
    date: "2026-06-01"
  },
  {
    id: 7,
    title: "Pastoral Care Training",
    description: "Webinar series for developing pastoral care skills.",
    type: "webinar",
    url: "#",
    duration: "60 min"
  },
  {
    id: 8,
    title: "Financial Reporting Standards",
    description: "Best practices for transparent financial reporting in churches.",
    type: "help",
    url: "/docs/financial-reporting",
    date: "2026-03-29"
  }
];

const featuredGuide: Resource = {
  id: 9,
  title: "The Complete Church Setup Guide",
  description: "A comprehensive step-by-step guide covering everything from initial setup to advanced features. Perfect for new users getting started with our platform.",
  type: "guide",
  url: "/docs/setup",
  date: "2026-07-20"
};

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resources] = useState<Resource[]>(initialResources);

  // Filter resources based on search query
  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to get badge variant based on resource type
  const getTypeBadgeVariant = (type: ResourceType) => {
    switch (type) {
      case "guide":
        return "bg-blue-500/20 text-[var(--accent)] border border-[var(--accent-soft)]";
      case "template":
        return "bg-green-500/20 text-green-500 border border-green-500/30";
      case "webinar":
        return "bg-purple-500/20 text-purple-500 border border-purple-500/30";
      case "blog":
        return "bg-orange-500/20 text-orange-500 border border-orange-500/30";
      case "help":
        return "bg-red-500/20 text-red-500 border border-red-500/30";
      case "community":
        return "bg-teal-500/20 text-teal-500 border border-teal-500/30";
      default:
        return "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-soft)]";
    }
  };

  // Function to get icon based on resource type
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "guide":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M16 13H8"></path>
            <path d="M16 17H8"></path>
            <path d="M10 9H8"></path>
          </svg>
        );
      case "template":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        );
      case "webinar":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        );
      case "blog":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
          </svg>
        );
      case "help":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case "community":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <path d="M16 13H8"></path>
            <path d="M16 17H8"></path>
            <path d="M10 9H8"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-12">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-strong)] mb-6">
              Resource Center
            </h1>
            <p className="text-xl text-[var(--text)] mb-8 max-w-2xl mx-auto">
              Discover guides, templates, webinars, and more to help grow your church community
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] pl-14"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="absolute left-5 top-1/2 transform -translate-y-1/2 text-[var(--muted)]"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
        </section>

        {/* Featured Guide Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-6">Featured Guide</h2>
            <Card className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-xl overflow-hidden">
              <CardContent className="p-6 flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  {getResourceIcon("guide")}
                </div>
                <div className="flex-grow">
                  <Badge className={`${getTypeBadgeVariant(featuredGuide.type)} mb-3`}>
                    {featuredGuide.type.charAt(0).toUpperCase() + featuredGuide.type.slice(1)}
                  </Badge>
                  <h3 className="text-xl font-bold text-[var(--text-strong)] mb-2">{featuredGuide.title}</h3>
                  <p className="text-[var(--text)] mb-4">{featuredGuide.description}</p>
                  <div className="flex items-center text-sm text-[var(--muted)] mb-4">
                    <span>Published: {featuredGuide.date}</span>
                  </div>
                  <Link href={featuredGuide.url} passHref>
                    <Button variant="default" className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white">
                      Read Guide
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Resource Grid */}
        <section className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-6">All Resources</h2>
            
            {filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--text)]">No resources found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource) => (
                  <Card 
                    key={resource.id} 
                    className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-xl overflow-hidden hover:border-[var(--accent-soft)] transition-colors duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                          {getResourceIcon(resource.type)}
                        </div>
                        <Badge className={`${getTypeBadgeVariant(resource.type)}`}>
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-strong)] mb-2">{resource.title}</h3>
                      <p className="text-[var(--text)] text-sm mb-4">{resource.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-4">
                        {resource.date && <span>{resource.date}</span>}
                        {resource.duration && <span>{resource.duration}</span>}
                      </div>
                      
                      <Link href={resource.url} passHref>
                        <Button 
                          variant="outline" 
                          className="w-full border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                        >
                          {resource.type === "webinar" ? "Join Webinar" : 
                           resource.type === "blog" ? "Read Article" : 
                           resource.type === "help" ? "Visit Help Center" : 
                           "View Resource"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
