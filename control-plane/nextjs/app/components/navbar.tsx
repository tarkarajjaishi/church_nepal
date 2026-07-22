"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useTranslation } from "./i18n-hook";

// Nav links configuration
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Mark as mounted after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mobile menu focus trap and ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsLangOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus first focusable element in mobile menu
      const firstFocusable = mobileMenuRef.current?.querySelector(
        "button, a"
      ) as HTMLElement;
      firstFocusable?.focus();
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(e.target as Node)
      ) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) {
      return pathname === "/" && typeof window !== "undefined" && window.location.hash === href.substring(1);
    }
    return pathname === href;
  };

  // Smooth scroll for hash links
  const handleHashLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      if (pathname === "/") {
        e.preventDefault();
        const targetId = href.substring(2);
        const element = document.getElementById(targetId);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${isScrolled ? "bg-[var(--panel-2)]/80 backdrop-blur-md shadow-md" : "bg-transparent"}
          border-b border-[var(--border)]/0 ${isScrolled ? "border-[var(--border)]" : ""}
        `}
      >
        <nav className="max-w-[var(--max)] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="lp-logo transition-transform group-hover:scale-105" />
            <span className="font-bold text-lg text-[var(--text-strong)]">
              ChurchNepal
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleHashLink(e, link.href)}
                  className={`
                    text-sm font-medium transition-colors relative
                    ${isActive ? "text-[var(--text-strong)]" : "text-[var(--muted)]"}
                    hover:text-[var(--text-strong)]
                  `}
                >
                  {t(link.label) !== link.label ? t(link.label) : link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle - Desktop */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text-strong)] hover:bg-[var(--panel-2)] transition-colors"
              aria-label={mounted && theme === "dark" ? "Switch to light theme" : mounted ? "Switch to dark theme" : "Toggle theme"}
            >
              {mounted && theme === "dark" ? (
                // Moon icon - switch to light
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1111.21 3c-.34 0-.67.02-1 .05a7 7 0 109.79 9.74c.03-.33.04-.66.04-1z" />
                </svg>
              ) : mounted ? (
                // Sun icon - switch to dark
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                // Loading placeholder - neutral icon
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--text-strong)] bg-[var(--panel-2)] hover:bg-[var(--panel-3)] rounded-md transition-colors"
                aria-label="Select language"
                aria-expanded={isLangOpen}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.083 9h11.834c.076-.429-.068-.91-.37-1.238l-4.918-5.41c-.448-.5-1.152-.5-1.598 0L4.453 7.762c-.3.329-.408.81-.282 1.238zm0 2h11.834c.076.429-.068.91-.37 1.238l-4.918 5.41c-.448.5-1.152.5-1.598 0L4.453 12.238c-.3-.329-.408-.81-.282-1.238H4.083z" clipRule="evenodd" />
                </svg>
                EN
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-[var(--panel)] border border-[var(--border)] rounded-md shadow-lg z-50">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--panel-2)] transition-colors"
                    onClick={() => {
                      setIsLangOpen(false);
                      // Would trigger language change
                    }}
                  >
                    English
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--panel-2)] transition-colors"
                    onClick={() => {
                      setIsLangOpen(false);
                      // Would trigger language change
                    }}
                  >
                    नेपाली
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Theme Toggle (mobile) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text-strong)] hover:bg-[var(--panel-2)] transition-colors"
              aria-label={mounted && theme === "dark" ? "Switch to light theme" : mounted ? "Switch to dark theme" : "Toggle theme"}
            >
              {mounted && theme === "dark" ? (
                // Moon icon - switch to light
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1111.21 3c-.34 0-.67.02-1 .05a7 7 0 109.79 9.74c.03-.33.04-.66.04-1z" />
                </svg>
              ) : mounted ? (
                // Sun icon - switch to dark
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                // Loading placeholder - neutral icon
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text-strong)] hover:bg-[var(--panel-2)] transition-colors"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            ref={mobileMenuRef}
            className="
              absolute top-0 right-0 h-full w-80 max-w-[85vw]
              bg-[var(--panel)] border-l border-[var(--border)]
              shadow-lg transform transition-transform
              flex flex-col
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <span className="font-bold text-lg">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--text-strong)] hover:bg-[var(--panel-2)] transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      handleHashLink(e, link.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className="
                      px-3 py-2.5 rounded-md text-base font-medium
                      text-[var(--text)] hover:bg-[var(--panel-2)] hover:text-[var(--text-strong)]
                      transition-colors
                    "
                  >
                    {t(link.label) !== link.label ? t(link.label) : link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}
