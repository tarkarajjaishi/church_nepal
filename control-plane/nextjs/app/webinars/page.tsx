"use client";

import { useState } from "react";
import PublicLayout from "../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Webinar {
  id: string;
  title: string;
  speaker: string;
  date: string;
  time: string;
  description: string;
  isPast?: boolean;
  recordingUrl?: string;
}

const sampleWebinars: Webinar[] = [
  {
    id: "1",
    title: "Building Community Through Digital Outreach",
    speaker: "Pastor John Doe",
    date: "2026-07-30",
    time: "19:00",
    description: "Learn effective strategies for engaging your congregation online and building meaningful connections through digital platforms.",
  },
  {
    id: "2",
    title: "Financial Stewardship in Modern Times",
    speaker: "Dr. Sarah Wilson",
    date: "2026-08-05",
    time: "18:30",
    description: "Explore biblical principles of giving and how churches can manage resources wisely in today's economic landscape.",
  },
  {
    id: "3",
    title: "Mental Health and Pastoral Care",
    speaker: "Dr. Michael Chen",
    date: "2026-08-12",
    time: "19:00",
    description: "Understanding mental health challenges in the congregation and providing compassionate pastoral support.",
  },
  {
    id: "4",
    title: "Youth Ministry in the Digital Age",
    speaker: "Rev. Emily Rodriguez",
    date: "2026-07-15",
    time: "17:00",
    description: "Engaging young people effectively in an increasingly digital world.",
    isPast: true,
    recordingUrl: "#",
  },
  {
    id: "5",
    title: "Worship Leading for New Times",
    speaker: "Marcus Thompson",
    date: "2026-06-28",
    time: "20:00",
    description: "Adapting worship styles to reach diverse audiences while maintaining spiritual depth.",
    isPast: true,
    recordingUrl: "#",
  },
  {
    id: "6",
    title: "Church Planting Fundamentals",
    speaker: "Bishop Robert King",
    date: "2026-06-10",
    time: "19:30",
    description: "Essential steps and considerations for starting a new church community.",
    isPast: true,
    recordingUrl: "#",
  },
];

export default function WebinarsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const upcomingWebinars = sampleWebinars.filter(w => !w.isPast);
  const pastWebinars = sampleWebinars.filter(w => w.isPast);

  return (
    <PublicLayout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-[var(--text-strong)]">
            Webinars & Events
          </h1>
          <p className="text-center text-[var(--muted)] mb-8">
            Join our community for insightful discussions and learning opportunities
          </p>

          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Tab Navigation */}
              <div className="flex border-b border-[var(--border-soft)]">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === "upcoming"
                      ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Upcoming Events
                </button>
                <button
                  onClick={() => setActiveTab("past")}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === "past"
                      ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Past Recordings
                </button>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {activeTab === "upcoming" && (
                  <div className="space-y-6">
                    {upcomingWebinars.length > 0 ? (
                      upcomingWebinars.map((webinar) => (
                        <div
                          key={webinar.id}
                          className="border border-[var(--border-soft)] rounded-lg p-6 hover:bg-[var(--panel-2)] transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-[var(--text-strong)]">
                                  {webinar.title}
                                </h3>
                                <Badge variant="secondary" className="bg-[var(--accent-soft)] text-[var(--accent)]">
                                  Live
                                </Badge>
                              </div>
                              <p className="text-[var(--muted)] mb-2">{webinar.description}</p>
                              <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                                <span>Speaker: {webinar.speaker}</span>
                                <span>Date: {new Date(webinar.date).toLocaleDateString()}</span>
                                <span>Time: {webinar.time}</span>
                              </div>
                            </div>
                            <Button className="shrink-0">
                              Register Now
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-[var(--muted)]">No upcoming events scheduled.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "past" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastWebinars.length > 0 ? (
                      pastWebinars.map((webinar) => (
                        <Card
                          key={webinar.id}
                          className="bg-[var(--panel-2)] border border-[var(--border-soft)] hover:border-[var(--accent-soft)] transition-colors cursor-pointer"
                        >
                          <CardContent className="p-5">
                            <div className="mb-3">
                              <Badge variant="outline" className="bg-[var(--good-soft)] text-[var(--good)]">
                                Recording Available
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-[var(--text-strong)] mb-2 line-clamp-2">
                              {webinar.title}
                            </h3>
                            <p className="text-sm text-[var(--muted)] mb-2">Speaker: {webinar.speaker}</p>
                            <p className="text-xs text-[var(--muted)] mb-4">
                              Recorded: {new Date(webinar.date).toLocaleDateString()}
                            </p>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => window.open(webinar.recordingUrl, '_blank')}
                            >
                              Watch Recording
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-[var(--muted)]">No past recordings available yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
