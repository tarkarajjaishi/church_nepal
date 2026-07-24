'use client';

import { useState } from 'react';
import PublicLayout from '../public-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MigratePage() {
  const [source, setSource] = useState<string | null>(null);

  // Define migration steps for each platform
  const migrationSteps: Record<string, string[]> = {
    wix: [
      'Export your images and media assets from your Wix site.',
      'Download any custom fonts or CSS if used.',
      'Prepare a list of your site pages and their content.',
      'Share your Wix site URL with our team for assessment.'
    ],
    wordpress: [
      'Export your content using WordPress\'s built-in export tool.',
      'Backup your theme files and plugins configurations.',
      'Extract media library assets and custom CSS.',
      'Provide database access or SQL dump if possible.'
    ],
    squarespace: [
      'Export your site content via the Advanced Export feature.',
      'Download images and files from your media library.',
      'Save your navigation structure and blog posts.',
      'Take screenshots of custom CSS or design elements used.'
    ],
    other: [
      'Gather all website content (text, images, documents).',
      'List out all pages and their intended functionality.',
      'Collect branding materials (logos, colors, fonts).',
      'Describe any special features or integrations needed.'
    ]
  };

  const importChecklist = [
    'Pages & Content',
    'Images & Media',
    'Navigation Structure',
    'Blog Posts',
    'Contact Forms',
    'Team/Staff Directory',
    'Events Calendar',
    'Sermons & Media Library',
    'Social Media Links'
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-12">
        <div className="container max-w-4xl px-4 mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--text)] mb-4">Migrate Your Church Website</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Seamlessly move your church website from Wix, WordPress, Squarespace, or another platform to our dedicated church management system.
            </p>
          </div>

          {/* Platform Selector */}
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">Select Your Current Platform</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['wix', 'wordpress', 'squarespace', 'other'].map((platform) => (
                <Button
                  key={platform}
                  variant={source === platform ? 'default' : 'outline'}
                  onClick={() => setSource(platform)}
                  className={`capitalize ${source === platform ? 'bg-[var(--accent)] text-white' : ''}`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Button>
              ))}
            </div>
          </Card>

          {source && (
            <>
              {/* Migration Steps */}
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">
                  Migration Steps for {source.charAt(0).toUpperCase() + source.slice(1)}
                </h2>
                <ol className="list-decimal pl-5 space-y-2">
                  {migrationSteps[source].map((step, index) => (
                    <li key={index} className="text-[var(--text)]">
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>

              {/* Import Checklist */}
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-4">What We Import</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {importChecklist.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <svg 
                        className="w-5 h-5 text-[var(--good)] mr-2 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-[var(--text)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* CTA Section */}
              <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 text-center">
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">Ready to Migrate?</h2>
                <p className="text-[var(--muted)] mb-6">
                  Our team will handle the technical details and ensure a smooth transition.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white">
                    <a href="/signup">Start Free Trial</a>
                  </Button>
                  <Button variant="outline" className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]">
                    <a href="/contact">Contact Us</a>
                  </Button>
                </div>
              </Card>
            </>
          )}

          {!source && (
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 text-center">
              <h3 className="text-xl font-medium text-[var(--text)] mb-2">Need Help Migrating?</h3>
              <p className="text-[var(--muted)]">
                Select your current platform to see specific migration instructions and what we can import for you.
              </p>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
