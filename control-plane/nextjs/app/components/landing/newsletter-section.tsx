"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      toast.error("Invalid email address");
      return;
    }

    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // In a real app, this would be an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful subscription
      setSuccess(true);
      setEmail("");
      toast.success("Thank you for subscribing to our newsletter!");
    } catch (err) {
      toast.error("Failed to subscribe. Please try again.");
      setError("Subscription failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="newsletter" className="py-20 md:py-28 bg-[var(--panel-2)]">
      <div className="mx-auto max-w-[var(--max)] px-6">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
            STAY CONNECTED
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] mb-4">
            Join Our Newsletter
          </h2>
          <p className="text-[var(--muted)] max-w-md mb-8">
            Subscribe to receive updates, inspiring stories, and special offers.
          </p>
          
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email Address
                </label>
                <input
                  type="email"
                  id="newsletter-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    error ? "border-[var(--danger)]" : "border-[var(--border)]"
                  } bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0`}
                  aria-invalid={!!error}
                  aria-describedby={error ? "email-error" : undefined}
                  disabled={isSubmitting}
                />
                {error && (
                  <p id="email-error" className="mt-2 text-sm text-[var(--danger)]">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="mt-2 text-sm text-[var(--good)]">
                    Thank you for subscribing!
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || success}
                className={`px-6 py-3 rounded-lg bg-[var(--accent)] text-white font-medium flex items-center justify-center min-w-fit ${
                  isSubmitting || success 
                    ? "opacity-70 cursor-not-allowed" 
                    : "hover:bg-[var(--accent-soft)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0"
                }`}
              >
                {isSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
