"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    id: "esewa",
    name: "eSewa",
    description: "Nepali digital payment gateway for seamless transactions.",
    category: "Payments",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "khalti",
    name: "Khalti",
    description: "Popular Nepali payment solution trusted by thousands.",
    category: "Payments",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 12h-4v4" />
      </svg>
    ),
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Global payment processing for online donations and payments.",
    category: "Payments",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync events and services seamlessly with your calendar.",
    category: "Comms",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Manage newsletters and email campaigns effectively.",
    category: "Comms",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6-.9 8-3 2.4 2.1 5.8 5.4 6 8 1.4 1.3 2 3.4 2 3.4z" />
      </svg>
    ),
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Embed sermons and media directly from your channel.",
    category: "Media",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    ),
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Share updates and live stream events effortlessly.",
    category: "Media",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Integrate virtual meetings and online services.",
    category: "Comms",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 7h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1h2" />
        <rect x="8" y="5" width="8" height="14" rx="2" />
        <path d="M12 12v.01" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Send group messages and updates instantly.",
    category: "Comms",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    id: "sms",
    name: "SMS",
    description: "Reach members with critical updates via text.",
    category: "Comms",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const categories = ["All", ...Array.from(new Set(integrations.map((i) => i.category)))];

export default function IntegrationsGrid() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredIntegrations = activeCategory === "All" 
    ? integrations 
    : integrations.filter((integration) => integration.category === activeCategory);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      {/* Category Filter Chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--panel-2)] text-[var(--text)] hover:bg-[var(--panel-3)]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card
            key={integration.id}
            className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
          >
            <CardContent className="p-0">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-strong)]">{integration.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{integration.description}</p>
                  <Badge variant="secondary" className="mt-3 text-xs bg-[var(--panel-2)] text-[var(--muted)]">
                    {integration.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
