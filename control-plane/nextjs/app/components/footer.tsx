"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";

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
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <Logo className="transition-transform group-hover:scale-105" />
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
            
            {/* Social links removed. They pointed at twitter.com and github.com
                themselves rather than at any ChurchNepal account, so they sent
                people off the site for nothing - and the GitHub path data was
                malformed, which is why that icon rendered as a faint smudge.
                Put them back when there are real accounts to link to. */}
          </div>

           {/* Product Links */}
           <div>
             <h3 className="text-sm font-semibold text-[var(--text-strong)] mb-3 uppercase tracking-wider">
               Product
             </h3>
             <ul className="space-y-2">
               <li>
                 <Link href="/features" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Features
                 </Link>
               </li>
               <li>
                 <Link href="/pricing" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Pricing
                 </Link>
               </li>
               <li>
                 <Link href="/signup" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Sign up
                 </Link>
               </li>
               <li>
                 <Link href="/status" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Status
                 </Link>
               </li>
             </ul>
           </div>

           {/* Church Life
               These are the topic pages. A sitemap entry alone leaves a page
               orphaned and it crawls badly, so each cluster gets a site-wide
               link here; the cluster siblings (youth, children, family,
               missions) are reached from the pages themselves. */}
           <div>
             <h3 className="text-sm font-semibold text-[var(--text-strong)] mb-3 uppercase tracking-wider">
               Church Life
             </h3>
             <ul className="space-y-2">
               {[
                 ['/worship', 'Worship'],
                 ['/bible-study', 'Bible Study'],
                 ['/prayer', 'Prayer'],
                 ['/fellowship', 'Fellowship'],
                 ['/ministries', 'Ministries'],
                 ['/events', 'Events'],
                 ['/denominations', 'Denominations'],
               ].map(([href, label]) => (
                 <li key={href}>
                   <Link href={href} className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                     {label}
                   </Link>
                 </li>
               ))}
             </ul>
           </div>

           {/* Resources Links */}
           <div>
             <h3 className="text-sm font-semibold text-[var(--text-strong)] mb-3 uppercase tracking-wider">
               Resources
             </h3>
             <ul className="space-y-2">
               <li>
                 <Link href="/docs" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Docs
                 </Link>
               </li>
               <li>
                 <Link href="/blog" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Blog
                 </Link>
               </li>
               <li>
                 <Link href="/changelog" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Changelog
                 </Link>
               </li>
               <li>
                 <Link href="/security" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Security
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
                 <Link href="/customers" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Customers
                 </Link>
               </li>
               <li>
                 <Link href="/careers" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Careers
                 </Link>
               </li>
               <li>
                 <Link href="/contact" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                   Contact
                 </Link>
               </li>
             </ul>
           </div>
        </div>

         {/* Bottom Bar */}
         <div className="py-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
             <p className="text-sm text-[var(--muted)]">
               © {new Date().getFullYear()} ChurchNepal. All rights reserved.
             </p>
             <div className="flex items-center gap-4">
               <Link href="/privacy" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                 Privacy
               </Link>
               <Link href="/terms" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                 Terms
               </Link>
             </div>
           </div>
           
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
