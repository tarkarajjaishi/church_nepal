"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FeatureTour = () => {
  const [activeTab, setActiveTab] = useState('Website');

  // Sample data for each feature tab
  const features = [
    {
      id: 'Website',
      title: 'Beautiful Websites',
      description: 'Easily customizable designs with mobile-first responsiveness.',
      preview: (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--border-soft)]">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[var(--good)]"></div>
              <div className="w-3 h-3 rounded-full bg-[var(--accent)]"></div>
              <div className="w-3 h-3 rounded-full bg-[var(--gold-soft)]"></div>
            </div>
            <div className="text-sm font-medium">Church Nepal</div>
            <div className="w-6"></div> {/* Spacer for symmetry */}
          </div>
          
          {/* Navigation */}
          <div className="p-3 border-b border-[var(--border-soft)] flex space-x-4">
            <div className="w-16 h-6 bg-[var(--accent-soft)] rounded"></div>
            <div className="w-16 h-6 bg-[var(--muted)] rounded"></div>
            <div className="w-16 h-6 bg-[var(--muted)] rounded"></div>
            <div className="w-16 h-6 bg-[var(--muted)] rounded"></div>
          </div>
          
          {/* Hero Section */}
          <div className="flex-grow p-4 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--panel)] to-[var(--panel-2)]">
            <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Welcome to Our Church</h2>
            <p className="text-center text-[var(--muted)] max-w-xs">Join us for worship every Sunday at 10 AM</p>
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-[var(--border-soft)] flex justify-between">
            <div className="text-xs">© 2026 Church Nepal</div>
            <div className="flex space-x-2">
              <div className="w-6 h-6 rounded-full bg-[var(--muted)]"></div>
              <div className="w-6 h-6 rounded-full bg-[var(--muted)]"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'Giving',
      title: 'Secure Online Giving',
      description: 'Accept donations seamlessly with multiple payment options.',
      preview: (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-soft)]">
            <h3 className="font-semibold">Give Online</h3>
          </div>
          
          {/* Content */}
          <div className="flex-grow p-4 flex flex-col">
            <div className="mb-4">
              <div className="text-sm mb-1">Select Amount</div>
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 250].map((amount) => (
                  <Button key={amount} variant="outline" className="border-[var(--border)] text-[var(--text)]">
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm mb-1">Or Enter Custom Amount</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]">$</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm mb-1">Fund</div>
              <select className="w-full p-2 bg-[var(--panel-2)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                <option>General Fund</option>
                <option>Building Project</option>
                <option>Youth Ministry</option>
              </select>
            </div>
            
            <div className="mt-auto pt-4">
              <Button className="w-full bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white">
                Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'Members',
      title: 'Member Management',
      description: 'Keep track of your congregation with our CRM tools.',
      preview: (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-soft)]">
            <h3 className="font-semibold">Members Directory</h3>
          </div>
          
          {/* Search Bar */}
          <div className="p-3 border-b border-[var(--border-soft)]">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search members..."
                className="w-full pl-10 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--border)] rounded-md text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
          </div>
          
          {/* Member List */}
          <div className="flex-grow overflow-y-auto p-2">
            {[
              { name: "John Smith", role: "Deacon", lastSeen: "Today" },
              { name: "Sarah Johnson", role: "Teacher", lastSeen: "Yesterday" },
              { name: "Michael Brown", role: "Volunteer", lastSeen: "2 days ago" },
              { name: "Emily Davis", role: "Member", lastSeen: "This week" }
            ].map((member, index) => (
              <div key={index} className="flex items-center p-3 border-b border-[var(--border-soft)]">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] flex items-center justify-center mr-3">
                  <span className="font-medium">{member.name.charAt(0)}</span>
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-[var(--muted)]">{member.role}</div>
                </div>
                <div className="text-xs text-[var(--muted)]">{member.lastSeen}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'Sermons',
      title: 'Sermon Library',
      description: 'Upload, organize, and share your sermons with your community.',
      preview: (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-soft)]">
            <h3 className="font-semibold">Recent Sermons</h3>
          </div>
          
          {/* Sermon List */}
          <div className="flex-grow overflow-y-auto p-2">
            {[
              { title: "Finding Peace in Troubling Times", speaker: "Pastor Williams", date: "Jul 17, 2026", duration: "32:45" },
              { title: "The Power of Faith", speaker: "Pastor Williams", date: "Jul 10, 2026", duration: "28:12" },
              { title: "Living with Purpose", speaker: "Pastor Johnson", date: "Jul 3, 2026", duration: "35:20" },
              { title: "God's Love for Us", speaker: "Pastor Williams", date: "Jun 26, 2026", duration: "30:05" }
            ].map((sermon, index) => (
              <div key={index} className="mb-3 p-3 bg-[var(--panel-2)] rounded-lg border border-[var(--border-soft)]">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-[var(--accent-soft)] rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                    </svg>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-medium truncate">{sermon.title}</h4>
                    <div className="text-sm text-[var(--muted)]">{sermon.speaker}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-[var(--muted)]">{sermon.date}</span>
                      <span className="text-xs text-[var(--muted)]">{sermon.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'Admin',
      title: 'Powerful Admin Dashboard',
      description: 'Manage your church operations from one central location.',
      preview: (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-soft)] flex justify-between items-center">
            <h3 className="font-semibold">Dashboard</h3>
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-[var(--good)]"></div>
              <div className="w-2 h-2 rounded-full bg-[var(--muted)]"></div>
              <div className="w-2 h-2 rounded-full bg-[var(--muted)]"></div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="bg-[var(--panel-2)] p-3 rounded-lg border border-[var(--border-soft)]">
              <div className="text-2xl font-bold">142</div>
              <div className="text-xs text-[var(--muted)]">Members</div>
            </div>
            <div className="bg-[var(--panel-2)] p-3 rounded-lg border border-[var(--border-soft)]">
              <div className="text-2xl font-bold">$2,450</div>
              <div className="text-xs text-[var(--muted)]">Last Month</div>
            </div>
            <div className="bg-[var(--panel-2)] p-3 rounded-lg border border-[var(--border-soft)]">
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-[var(--muted)]">Events</div>
            </div>
            <div className="bg-[var(--panel-2)] p-3 rounded-lg border border-[var(--border-soft)]">
              <div className="text-2xl font-bold">8</div>
              <div className="text-xs text-[var(--muted)]">Groups</div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="flex-grow p-4">
            <h4 className="font-medium mb-2">Recent Activity</h4>
            <div className="space-y-2">
              {[
                { action: "New donation received", time: "2 min ago", amount: "$50" },
                { action: "Event created", time: "1 hour ago", amount: "" },
                { action: "Member added", time: "3 hours ago", amount: "" },
                { action: "Sermon uploaded", time: "Yesterday", amount: "" }
              ].map((activity, index) => (
                <div key={index} className="flex justify-between text-sm p-2 border-l-2 border-[var(--accent)] bg-[var(--panel-2)]">
                  <span>{activity.action}</span>
                  <span className="text-[var(--muted)]">{activity.time}</span>
                  {activity.amount && <span className="text-[var(--good)]">{activity.amount}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeFeature = features.find(f => f.id === activeTab) || features[0];

  return (
    <section className="py-16 bg-[var(--bg)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Powerful Features</h2>
          <p className="text-[var(--muted)] max-w-2xl mx-auto">
            Discover how our platform can help manage your church more effectively
          </p>
        </div>
        
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="md:flex">
              {/* Vertical Tab List */}
              <div className="md:w-1/3 lg:w-1/4 p-4 border-r border-[var(--border-soft)] bg-[var(--panel-2)]">
                <div className="space-y-2">
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => setActiveTab(feature.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        activeTab === feature.id
                          ? 'bg-[var(--accent)] text-white'
                          : 'hover:bg-[var(--panel-3)] text-[var(--text)]'
                      }`}
                    >
                      {feature.title}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Preview Panel */}
              <div className="md:w-2/3 lg:w-3/4 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{activeFeature.title}</h3>
                  <p className="text-[var(--muted)]">{activeFeature.description}</p>
                </div>
                
                <div className="bg-[var(--bg)] border border-[var(--border-soft)] rounded-lg overflow-hidden h-96">
                  {activeFeature.preview}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FeatureTour;
