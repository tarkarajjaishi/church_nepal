"use client";

import { useState } from "react";
import PublicLayout from "../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    quote: "Church Nepal has transformed how our small congregation connects online. The intuitive tools saved us countless hours.",
    author: "Rajesh K.",
    position: "Pastor",
    church: "Grace Community Church",
    location: "Kathmandu",
    category: "small-church",
    featured: true,
  },
  {
    id: 2,
    quote: "Managing multiple services and events was chaotic until we found this platform. It’s a game-changer!",
    author: "Sita M.",
    position: "Admin",
    church: "Hope Fellowship",
    location: "Pokhara",
    category: "event-management",
    featured: false,
  },
  {
    id: 3,
    quote: "The donation system is seamless and secure. Our giving has increased significantly since the integration.",
    author: "Michael T.",
    position: "Finance Lead",
    church: "New Life Assembly",
    location: "Lalitpur",
    category: "donations",
    featured: false,
  },
  {
    id: 4,
    quote: "Our members love the mobile experience. Attendance tracking and group coordination made so much easier.",
    author: "Priya S.",
    position: "Group Leader",
    church: "Faith Community",
    location: "Biratnagar",
    category: "mobile",
    featured: false,
  },
  {
    id: 5,
    quote: "Setting up our website took less than an hour. The templates perfectly matched our vision.",
    author: "David L.",
    position: "Web Coordinator",
    church: "Cornerstone Church",
    location: "Bharatpur",
    category: "setup",
    featured: false,
  },
  {
    id: 6,
    quote: "Prayer requests and community building features have deepened our spiritual bonds beyond Sunday services.",
    author: "Anita G.",
    position: "Ministry Leader",
    church: "Trinity Grace",
    location: "Dharan",
    category: "community",
    featured: false,
  },
];

const categories = [
  { id: "all", label: "All" },
  { id: "small-church", label: "Small Church" },
  { id: "event-management", label: "Events" },
  { id: "donations", label: "Giving" },
  { id: "mobile", label: "Mobile" },
  { id: "setup", label: "Setup" },
  { id: "community", label: "Community" },
];

export default function TestimonialsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTestimonials = selectedCategory === "all"
    ? testimonials
    : testimonials.filter(t => t.category === selectedCategory);

  // Find the first featured testimonial for the big quote
  const featuredTestimonial = testimonials.find(t => t.featured) || testimonials[0];

  return (
    <PublicLayout>
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-strong)] mb-4">Hear From Our Churches</h1>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Discover how churches across Nepal are transforming their digital presence and community engagement.
          </p>
        </div>

        {/* Featured Big Quote */}
        {featuredTestimonial && (
          <Card className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-xl p-8 mb-16">
            <CardContent className="p-0">
              <div className="flex flex-col items-center text-center">
                <svg 
                  className="w-12 h-12 text-[var(--accent-soft)] mb-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <blockquote className="text-2xl italic text-[var(--text)] mb-8 max-w-3xl">
                  "{featuredTestimonial.quote}"
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="bg-[var(--accent)] w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold">
                      {featuredTestimonial.author.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[var(--text-strong)]">{featuredTestimonial.author}</p>
                    <p className="text-sm text-[var(--muted)]">{featuredTestimonial.position}, {featuredTestimonial.church}</p>
                    <p className="text-xs text-[var(--muted)]">{featuredTestimonial.location}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              className={`rounded-full ${
                selectedCategory === cat.id
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials
            .filter(t => !t.featured) // Don't duplicate the featured one
            .map((testimonial) => (
              <Card 
                key={testimonial.id} 
                className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[var(--border-soft)]"
              >
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-[var(--accent-soft)] w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-strong)]">{testimonial.author}</p>
                      <p className="text-sm text-[var(--muted)]">{testimonial.position}, {testimonial.church}</p>
                      <p className="text-xs text-[var(--muted)]">{testimonial.location}</p>
                    </div>
                  </div>
                  <p className="text-[var(--text)] mb-4 italic">"{testimonial.quote}"</p>
                  <Badge variant="secondary" className="bg-[var(--accent-soft)]/20 text-[var(--accent)]">
                    {categories.find(c => c.id === testimonial.category)?.label}
                  </Badge>
                </CardContent>
              </Card>
            ))
          }
        </div>
      </div>
    </PublicLayout>
  );
}
