"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import PublicLayout from "../../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Sample data map for case studies
const CASE_STUDIES = {
  "grace-community": {
    id: "grace-community",
    name: "Grace Community Church",
    hero: "How Grace Community Church increased online engagement by 200% with Churchnepal",
    challenge: "Grace Community Church was struggling with fragmented communication tools, low attendance tracking, and limited online presence. Their volunteers spent countless hours managing multiple platforms for events, donations, and member communications.",
    solution: "We implemented Churchnepal's comprehensive church management system, integrating event scheduling, donation processing, member directories, and automated communication tools. The unified dashboard allowed staff to manage all operations from one place.",
    results: [
      "Online engagement increased by 200%",
      "Event RSVP completion rose by 150%",
      "Administrative tasks reduced by 60%",
      "Donation processing became 3x faster"
    ],
    stats: [
      { value: "200%", label: "Engagement Increase" },
      { value: "150%", label: "RSVP Growth" },
      { value: "60%", label: "Time Saved" }
    ],
    quote: "Churchnepal transformed how we connect with our congregation. Our staff can now focus on ministry instead of administrative tasks.",
    quoteAuthor: "Pastor John Doe, Lead Pastor"
  },
  "mountain-hope": {
    id: "mountain-hope",
    name: "Mountain Hope Fellowship",
    hero: "Mountain Hope Fellowship streamlined their operations with Churchnepal",
    challenge: "Mountain Hope Fellowship needed a way to coordinate multiple small groups across different locations while maintaining consistent communication with over 500 members.",
    solution: "We deployed Churchnepal's group management features, integrated communication tools, and mobile-friendly interface. This allowed leaders to manage groups effectively and members to stay connected regardless of location.",
    results: [
      "Group participation increased by 75%",
      "Communication response rates improved by 120%",
      "Member retention grew by 40%",
      "Small group leaders reported 50% less administrative burden"
    ],
    stats: [
      { value: "75%", label: "Group Participation" },
      { value: "120%", label: "Response Rates" },
      { value: "40%", label: "Retention Growth" }
    ],
    quote: "The platform helped us maintain personal connections even as we expanded our reach. It’s been invaluable for our growth.",
    quoteAuthor: "Sarah Williams, Ministry Coordinator"
  },
  "river-valley": {
    id: "river-valley",
    name: "River Valley Church",
    hero: "River Valley Church enhanced donor experience with Churchnepal's giving tools",
    challenge: "River Valley Church had complex donation tracking needs with multiple funds, recurring givers, and seasonal campaigns. Manual processes were error-prone and time-consuming.",
    solution: "We configured Churchnepal's donation management system with custom fund allocation, automated receipts, recurring giving options, and real-time reporting dashboards.",
    results: [
      "Online donations increased by 180%",
      "Giving transparency improved significantly",
      "Donation processing time reduced by 70%",
      "Fund allocation accuracy reached 99.5%"
    ],
    stats: [
      { value: "180%", label: "Donation Growth" },
      { value: "70%", label: "Processing Time Saved" },
      { value: "99.5%", label: "Accuracy Rate" }
    ],
    quote: "Our donors love the seamless giving experience, and our finance team appreciates the clear reporting. It’s been transformative.",
    quoteAuthor: "Michael Chen, Finance Director"
  }
};

export default function CustomerCaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const caseStudy = CASE_STUDIES[slug as keyof typeof CASE_STUDIES];
  
  if (!caseStudy) {
    notFound();
  }

  return (
    <PublicLayout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to customers link */}
          <div className="mb-8">
            <Link href="/customers" passHref legacyBehavior>
              <Button variant="link" className="text-[var(--accent)] hover:text-[var(--accent-2)] pl-0">
                ← Back to Customers
              </Button>
            </Link>
          </div>

          {/* Hero section */}
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-10">
            <CardContent className="p-0">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] mb-4">
                {caseStudy.hero}
              </h1>
              <Badge variant="secondary" className="bg-[var(--accent-soft)] text-[var(--text-strong)]">
                {caseStudy.name}
              </Badge>
            </CardContent>
          </Card>

          {/* Stats section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {caseStudy.stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-lg p-5 text-center"
              >
                <div className="text-3xl font-bold text-[var(--accent)] mb-2">{stat.value}</div>
                <div className="text-[var(--text)] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Challenge section */}
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-8">
            <CardContent className="p-0">
              <h2 className="text-2xl font-semibold text-[var(--text-strong)] mb-4">Challenge</h2>
              <p className="text-[var(--text)] leading-relaxed">
                {caseStudy.challenge}
              </p>
            </CardContent>
          </Card>

          {/* Solution section */}
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-8">
            <CardContent className="p-0">
              <h2 className="text-2xl font-semibold text-[var(--text-strong)] mb-4">Solution</h2>
              <p className="text-[var(--text)] leading-relaxed">
                {caseStudy.solution}
              </p>
            </CardContent>
          </Card>

          {/* Results section */}
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-10">
            <CardContent className="p-0">
              <h2 className="text-2xl font-semibold text-[var(--text-strong)] mb-4">Results</h2>
              <ul className="space-y-3">
                {caseStudy.results.map((result, index) => (
                  <li key={index} className="flex items-start">
                    <svg 
                      className="w-5 h-5 text-[var(--good)] mt-0.5 mr-3 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[var(--text)]">{result}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Pull quote */}
          <div className="relative bg-[var(--accent-soft)] rounded-xl p-8 mb-12 border border-[var(--accent-2)]">
            <svg 
              className="absolute top-4 left-4 w-12 h-12 text-[var(--accent-2)] opacity-20" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <blockquote className="relative text-xl italic text-[var(--text-strong)] z-10">
              "{caseStudy.quote}"
            </blockquote>
            <div className="mt-4 text-right">
              <cite className="text-[var(--text)] not-italic">
                — {caseStudy.quoteAuthor}
              </cite>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Link href="/contact" passHref legacyBehavior>
              <Button size="lg" className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white">
                Start Your Success Story
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
