"use client";

import PublicLayout from "../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PressKitPage = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Sample news items
  const newsItems = [
    { id: 1, title: "Church Nepal Launches New Digital Platform", date: "2024-06-15", source: "Tech Nepal Weekly" },
    { id: 2, title: "Revolutionizing Church Management in Nepal", date: "2024-05-22", source: "Religion & Tech Journal" },
    { id: 3, title: "Digital Tools Transforming Nepali Churches", date: "2024-04-10", source: "Nepal Times" },
    { id: 4, title: "Innovative Platform Supports Local Ministries", date: "2024-03-05", source: "Faith & Community" },
  ];

  // Brand assets
  const brandAssets = [
    { name: "Logo (PNG)", description: "High-resolution logo in PNG format", link: "#" },
    { name: "Logo (SVG)", description: "Vector version of the logo", link: "#" },
  ];

  // Brand colors
  const brandColors = [
    { name: "Primary Blue", value: "#3b82f6", hex: "#3b82f6" },
    { name: "Accent Green", value: "#10b981", hex: "#10b981" },
    { name: "Supporting Orange", value: "#f97316", hex: "#f97316" },
    { name: "Neutral Gray", value: "#6b7280", hex: "#6b7280" },
  ];

  const boilerplateText = `Church Nepal is a leading provider of digital solutions for churches in Nepal. Our platform helps churches manage their operations, engage their communities, and grow their ministries through innovative technology.`;

  const handleCopy = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-strong)]">Press & Media Kit</h1>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Resources for journalists, bloggers, and content creators covering Church Nepal and our impact on faith communities in Nepal.
          </p>
        </section>

        {/* In the News Section */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-[var(--text-strong)]">In the News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newsItems.map((item) => (
              <Card key={item.id} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
                <CardContent className="p-5">
                  <span className="text-sm text-[var(--muted)]">{item.date}</span>
                  <h3 className="text-lg font-medium mt-2 mb-1 text-[var(--text-strong)]">{item.title}</h3>
                  <p className="text-[var(--muted)]">{item.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Brand Assets Section */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-[var(--text-strong)]">Brand Assets</h2>
          
          {/* Logo Downloads */}
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-4 text-[var(--text-strong)]">Logos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandAssets.map((asset, index) => (
                <Card key={index} className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-[var(--text-strong)]">{asset.name}</h4>
                      <p className="text-sm text-[var(--muted)]">{asset.description}</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-3)]">
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Brand Colors */}
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-4 text-[var(--text-strong)]">Brand Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {brandColors.map((color, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-full h-16 rounded-lg mb-2 border border-[var(--border-soft)]" 
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <p className="text-sm font-medium text-[var(--text-strong)]">{color.name}</p>
                  <div className="flex items-center justify-center mt-1">
                    <span className="text-xs text-[var(--muted)] mr-2">{color.hex}</span>
                    <button 
                      onClick={() => handleCopy(color.hex, `color-${index}`)}
                      className="text-[var(--accent)] hover:text-[var(--accent-2)] focus:outline-none"
                    >
                      {copiedItem === `color-${index}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boilerplate */}
          <div>
            <h3 className="text-xl font-medium mb-4 text-[var(--text-strong)]">Company Boilerplate</h3>
            <Card className="bg-[var(--panel-2)] border border-[var(--border)] rounded-lg p-4">
              <p className="text-[var(--text)] mb-4">{boilerplateText}</p>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCopy(boilerplateText, 'boilerplate')}
                  className="border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-3)]"
                >
                  {copiedItem === 'boilerplate' ? 'Copied!' : 'Copy Text'}
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Press Contact */}
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-[var(--text-strong)]">Press Contact</h2>
          <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 max-w-2xl">
            <CardContent className="p-0">
              <p className="text-[var(--text)] mb-2">
                For media inquiries, review requests, or interview opportunities, please contact our press team:
              </p>
              <div className="mt-4">
                <p className="font-medium text-[var(--text-strong)]">Media Relations</p>
                <p className="text-[var(--text)]">press@churchnepal.com</p>
                <p className="text-[var(--text)] mt-2">+977-123456789</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PressKitPage;
