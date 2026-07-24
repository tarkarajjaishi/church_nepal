"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface ActivityItem {
  id: number;
  icon: string;
  actor: string;
  action: string;
  target: string;
  timestamp: Date;
}

const generateSampleData = (): ActivityItem[] => {
  const now = new Date();
  return [
    {
      id: 1,
      icon: "👤",
      actor: "John Doe",
      action: "created",
      target: "New Member Profile",
      timestamp: new Date(now.getTime() - 10 * 60000), // 10 minutes ago
    },
    {
      id: 2,
      icon: "📅",
      actor: "Admin User",
      action: "updated",
      target: "Sunday Service Times",
      timestamp: new Date(now.getTime() - 45 * 60000),
    },
    {
      id: 3,
      icon: "💳",
      actor: "Finance Team",
      action: "processed",
      target: "Donation Payment",
      timestamp: new Date(now.getTime() - 120 * 60000),
    },
    {
      id: 4,
      icon: "📢",
      actor: "Pastor Smith",
      action: "published",
      target: "Weekly Announcement",
      timestamp: new Date(now.getTime() - 240 * 60000),
    },
    {
      id: 5,
      icon: "👥",
      actor: "Sarah Johnson",
      action: "joined",
      target: "Small Group Meeting",
      timestamp: new Date(now.getTime() - 360 * 60000),
    },
  ];
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000; // Years
  if (interval > 1) return Math.floor(interval) + "y ago";
  
  interval = seconds / 2592000; // Months
  if (interval > 1) return Math.floor(interval) + "mo ago";
  
  interval = seconds / 86400; // Days
  if (interval > 1) return Math.floor(interval) + "d ago";
  
  interval = seconds / 3600; // Hours
  if (interval > 1) return Math.floor(interval) + "h ago";
  
  interval = seconds / 60; // Minutes
  if (interval > 1) return Math.floor(interval) + "m ago";
  
  return Math.floor(seconds) + "s ago";
};

const ActivityTimeline: React.FC = () => {
  const activities = generateSampleData();

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <CardContent className="p-0">
        <div className="relative">
          {/* Connecting line */}
          <div 
            className="absolute left-4 top-0 h-full w-0.5 bg-[var(--border-soft)]" 
            style={{ left: '24px' }} 
          />
          
          <ul className="space-y-6 pl-8">
            {activities.map((activity, index) => (
              <li key={activity.id} className="relative">
                {/* Colored dot */}
                <div 
                  className="absolute -left-8 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-soft)] z-10"
                  style={{ left: '16px' }}
                >
                  <span className="text-xs">{activity.icon}</span>
                </div>
                
                <div className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <p className="text-[var(--text-strong)] font-medium">
                      <span className="font-semibold">{activity.actor}</span> {activity.action} <span className="text-[var(--accent)]">{activity.target}</span>
                    </p>
                    <span className="text-[var(--muted)] text-sm whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
