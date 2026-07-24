"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewsletterHero() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Simulate API call
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setEmail("");
      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1000);
  };

  return (
    <Card className="bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-none">
      <CardContent className="p-6 md:p-12 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] tracking-tight">
            Join Our Faith Community
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Subscribe to our newsletter for inspiring stories, event updates, and spiritual insights delivered straight to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isSubmitting || isSuccess}
                className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || isSuccess}
                className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-[var(--max)] rounded-lg transition-colors whitespace-nowrap"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </div>
            {error && <p className="mt-2 text-left text-[var(--good)]">{error}</p>}
            {isSuccess && <p className="mt-2 text-left text-[var(--good)]">Thank you for subscribing! Please check your email.</p>}
          </form>

          <p className="text-xs text-[var(--muted)] mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
