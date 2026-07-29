"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const QuickActions = () => {
  const actions = [
    {
      title: "Create Church",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 10v8"/>
          <path d="M16 14a4 4 0 1 0-8 0"/>
          <path d="M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/>
          <path d="M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10"/>
        </svg>
      ),
      href: "/admin/churches",
      description: "Add a new church instance"
    },
    {
      title: "Invite Admin",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      href: "/admin/admins",
      description: "Invite new administrators"
    },
    {
      title: "View Invoices",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <line x1="8" y1="8" x2="16" y2="8"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="8" y1="16" x2="14" y2="16"/>
        </svg>
      ),
      href: "/admin/billing",
      description: "Manage billing and invoices"
    },
    {
      title: "Broadcast",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10"/>
          <path d="M12 2v8l3 3"/>
          <path d="M12 12v10"/>
        </svg>
      ),
      href: "/admin/blog",
      description: "Send system-wide announcements"
    },
    {
      title: "Settings",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v5M12 18v5M4.22 4.22l3.5 3.5M16.28 16.28l3.5 3.5M1 12h5M18 12h5M4.22 19.78l3.5-3.5M16.28 7.72l3.5-3.5"/>
        </svg>
      ),
      href: "/admin/settings",
      description: "System configuration"
    },
  ];

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button 
                variant="ghost" 
                className="flex flex-col items-center justify-center h-auto py-4 px-2 w-full hover:bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-lg transition-all duration-200"
              >
                <span className="mb-2 text-[var(--accent)]">{action.icon}</span>
                <h3 className="font-medium text-[var(--text-strong)] mb-1">{action.title}</h3>
                <p className="text-xs text-[var(--muted)] text-center">{action.description}</p>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
