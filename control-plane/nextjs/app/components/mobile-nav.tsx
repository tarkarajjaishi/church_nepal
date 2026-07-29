"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleMenu = (_e: React.MouseEvent) => setIsOpen(!isOpen);
  const closeMenu = (_e: React.MouseEvent) => setIsOpen(false);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    { href: "/docs", label: "Docs" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6 text-[var(--text)]"
        >
          {isOpen ? (
            // Close icon (X)
            <>
              <path d="M18 6L6 18M6 6l12 12" />
            </>
          ) : (
            // Menu icon (hamburger)
            <>
              <path d="M3 12h18M3 6h18M3 18h18" />
            </>
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeMenu}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-sm z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } bg-[var(--panel)] border-l border-[var(--border)]`}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="p-4 flex justify-end">
            <button
              onClick={closeMenu}
              aria-label="Close menu"
              className="p-2 rounded-md hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6 text-[var(--text)]"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-lg font-medium text-[var(--text)] hover:text-[var(--accent)] border-b border-[var(--border-soft)] last:border-0"
                onClick={closeMenu} // Close menu on link click
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Theme Toggle & CTA - Placeholder for now */}
          <div className="p-4 border-t border-[var(--border)]">
            {/* Theme toggle would go here */}
            <Button
              asChild
              className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
              onClick={closeMenu} // Close menu after clicking sign up
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
