"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[var(--panel)] border-t border-[var(--border)]">
      <div className="max-w-[var(--max)] mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <span className="lp-logo transition-transform group-hover:scale-105" />
              <span className="font-bold text-lg text-[var(--text-strong)]">
                ChurchNepal
              </span>
            </Link>
            <p className="text-sm text-[var(--muted)] mb-6 max-w-xs">
              Building digital homes for churches worldwide. One platform, many churches,
              fully isolated and beautifully designed.
            </p>
            
            {/* Newsletter Signup */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-[var(--text-strong)] mb-3">
                Stay Updated
              </h4>
              {subscribed ? (
                <p className="text-sm text-[var(--good)]">
                  Thank you for subscribing!
                </p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 min-w-0"
                  />
                  <Button type="submit" size="sm">
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
            
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--panel-2)] transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--panel-2)] transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-3.002.653-3.667-1.512-3.667-1.512-.453-1.155-1.107-1.462-1.107-1.462-.904-.623.069-.61.069-.61 1.004.07 1.586 1.028 1.586 1.028.89 1.528 2.34 1.087 2.907.83.092-.646.35-1.086.636-1.336-2.556-.29-5.239-1.279-5.239-5.726 0-1.258.438-2.28 1.167-3.1-.577-.157-1.215-.26-1.91-.26-1.02 0-1.95.377-2.63.995-.102-.29-.248-.56-.428-.795 0 0 .005-.02.015-.05-.002-.02-.008-.04-.015-.06 0 0 .005-.02.015-.05-.002-.02-.008-.04-.015-.06 0 0 .005-.02.015-.05-.002-.02-.008-.04-.015-.06 0 0 .005-.02.015-.05-.002-.02-.008-.04-.015-.06 0 0 .005-.02.015-.05-.002-.02-.008-.04-.015-.06 0 0 .005-.02.015-.05-.002-.02-.008-.04-.015-.06z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-strong)] mb-3 uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#how" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  How it works
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-strong)] mb-3 uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-strong)] mb-3 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Refund
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--muted)]">
            © {new Date().getFullYear()} ChurchNepal. All rights reserved.
          </p>
          
          <a
            href="https://tarkarajjaishi.com.np/"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            Developed by Tarka Raj Jaishi
          </a>
        </div>
      </div>
    </footer>
  );
}