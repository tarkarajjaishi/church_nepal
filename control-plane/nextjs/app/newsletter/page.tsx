'use client';

import { useState } from 'react';
import PublicLayout from '@/public-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [preferences, setPreferences] = useState({
    announcements: true,
    events: false,
    devotions: true,
    updates: false,
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate subscription process
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000); // Reset after 3 seconds
  };

  const handleUnsubscribe = () => {
    setUnsubscribed(true);
    setTimeout(() => setUnsubscribed(false), 3000); // Reset after 3 seconds
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Sample newsletter archive data
  const newsletters = [
    { id: 1, title: 'Weekly Devotion & Prayer Points', date: 'July 17, 2026' },
    { id: 2, title: 'Community Outreach Event Highlights', date: 'July 10, 2026' },
    { id: 3, title: 'Summer Camp Registration Now Open', date: 'July 3, 2026' },
    { id: 4, title: 'New Ministry Leadership Announcements', date: 'June 26, 2026' },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-[var(--text)] mb-4">Newsletter Center</h1>
            <p className="text-[var(--muted)]">
              Stay connected with our community through our weekly newsletter
            </p>
          </div>

          {/* Subscription Status Messages */}
          {subscribed && (
            <div className="mb-6 p-4 bg-[var(--good-soft)] border border-[var(--good)] rounded-lg text-[var(--text)]">
              Thank you for subscribing! Please check your email to confirm your subscription.
            </div>
          )}
          
          {unsubscribed && (
            <div className="mb-6 p-4 bg-[var(--accent-soft)] border border-[var(--accent)] rounded-lg text-[var(--text)]">
              You have been unsubscribed from our newsletter.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subscribe Section */}
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Subscribe to Our Newsletter</h2>
              
              {!subscribed && !unsubscribed ? (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
                  >
                    Subscribe
                  </Button>
                </form>
              ) : null}

              <p className="mt-4 text-sm text-[var(--muted)]">
                By subscribing, you agree to receive emails from us. You can unsubscribe at any time.
              </p>
            </Card>

            {/* Preferences Section */}
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Email Preferences</h2>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.announcements}
                    onChange={() => togglePreference('announcements')}
                    className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-[var(--text)]">Announcements</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.events}
                    onChange={() => togglePreference('events')}
                    className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-[var(--text)]">Events & Activities</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.devotions}
                    onChange={() => togglePreference('devotions')}
                    className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-[var(--text)]">Daily Devotions</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.updates}
                    onChange={() => togglePreference('updates')}
                    className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-[var(--text)]">Ministry Updates</span>
                </label>
              </div>
              
              <Button 
                onClick={handleUnsubscribe}
                className="mt-6 w-full bg-[var(--accent-soft)] hover:bg-[var(--accent)] text-[var(--text)]"
              >
                Unsubscribe
              </Button>
            </Card>
          </div>

          {/* Archive Section */}
          <Card className="mt-8 bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Past Issues</h2>
            
            <div className="space-y-4">
              {newsletters.map((newsletter) => (
                <div 
                  key={newsletter.id} 
                  className="flex justify-between items-center p-4 bg-[var(--bg)] border border-[var(--border-soft)] rounded-lg hover:bg-[var(--panel-2)] transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-[var(--text)]">{newsletter.title}</h3>
                    <p className="text-sm text-[var(--muted)]">{newsletter.date}</p>
                  </div>
                  <Button variant="link" className="text-[var(--accent)] hover:text-[var(--accent-2)]">
                    View Issue
                  </Button>
                </div>
              ))}
            </div>
            
            {newsletters.length === 0 && (
              <p className="text-center text-[var(--muted)] py-8">
                No newsletter issues available yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
