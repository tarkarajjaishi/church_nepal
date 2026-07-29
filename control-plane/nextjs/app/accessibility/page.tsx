'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AccessibilityStatement() {
  return (
    <div className="min-h-screen bg-[var(--bg)] py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-6">Accessibility Statement</h1>
          
          <div className="prose prose-invert max-w-none text-[var(--text)]">
            <p className="mb-4">
              We are committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the 
              relevant accessibility standards.
            </p>

            <h2 className="text-xl font-semibold text-[var(--text)] mt-8 mb-4">Conformance Status</h2>
            <p className="mb-4">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers 
              and developers to improve accessibility for people with disabilities. We are 
              partially conformant with WCAG 2.1 level AA. Partially conformant means that 
              some parts of the content do not fully conform to the accessibility standard.
            </p>

            <h2 className="text-xl font-semibold text-[var(--text)] mt-8 mb-4">Feedback</h2>
            <p className="mb-4">
              We welcome your feedback on the accessibility of our website. Please let us know 
              if you encounter accessibility barriers or have suggestions for improvement.
            </p>
            <p className="mb-6">
              Contact us at: <Link href="mailto:accessibility@churchnepal.com" className="text-[var(--accent)] hover:underline">accessibility@churchnepal.com</Link>
            </p>

            <Button asChild variant="outline" className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
