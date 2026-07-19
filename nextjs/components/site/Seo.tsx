'use client'

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useContentBlock, useContentBlocks } from "@/lib/hooks";

// Per-route defaults — overridden by content_blocks when available.
const PAGE_DEFAULTS: Record<string, { title: string; desc: string }> = {
  "/": { title: "Faith, Hope & Love in Nepal", desc: "A Christ-centred community in Kathmandu, Nepal — worshipping Jesus, growing in faith, and serving every village with the gospel." },
  "/visit": { title: "Plan Your Visit", desc: "Everything you need for a warm, relaxed first Sunday — service times, what to expect, kids, parking and directions." },
  "/about": { title: "About Us", desc: "Our story, mission and what we believe as a Christ-centred church in Nepal." },
  "/pastor": { title: "Our Pastor", desc: "Meet our senior pastor and learn about his heart for discipleship." },
  "/leadership": { title: "Leadership", desc: "Meet the servant-hearted team leading our church." },
  "/ministries": { title: "Ministries", desc: "Discover a ministry where you can grow, serve and belong." },
  "/sermons": { title: "Sermons", desc: "Watch and listen to Bible-based messages." },
  "/events": { title: "Events", desc: "Upcoming services, camps, conferences and gatherings." },
  "/gallery": { title: "Gallery", desc: "Moments of worship, fellowship and mission." },
  "/prayer": { title: "Prayer Request", desc: "Submit a confidential prayer request. Our prayer team commits to praying over every one." },
  "/give": { title: "Give", desc: "Support our mission through your generous giving." },
  "/contact": { title: "Contact", desc: "Reach out, drop by, or send us a message." },
  "/live": { title: "Watch Live", desc: "Join our live Sunday service online, wherever you are." },
  "/privacy": { title: "Privacy Policy", desc: "How we collect, use and protect your personal information." },
  "/terms": { title: "Terms of Service", desc: "Guidelines for using our website." },
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function Seo() {
  const pathname = usePathname();
  const brand = useContentBlock('site_brand');
  const { data: blocks } = useContentBlocks();

  // Extract site-level SEO data from content_blocks
  const churchName = brand?.title || "Grace Nepal Church";
  const tagline = brand?.subtitle || "Faith • Hope • Love";

  // Build page-specific metadata from content_blocks where available
  const defaults = PAGE_DEFAULTS[pathname] || {};

  // Try to find a content block matching the current route for dynamic meta
  let pageTitle = defaults.title || "";
  let pageDesc = defaults.desc || "";

  // For dynamic routes, check content_blocks
  if (pathname.startsWith("/sermons/")) {
    pageTitle = "Sermon";
    pageDesc = "Listen to this Bible-based message.";
  } else if (pathname.startsWith("/events/")) {
    pageTitle = "Event";
    pageDesc = "Event details.";
  } else if (pathname.startsWith("/ministries/")) {
    pageTitle = "Ministry";
    pageDesc = "Learn about this ministry.";
  }

  // Build full title
  const fullTitle = pageTitle ? `${pageTitle} — ${churchName}` : `${churchName} — ${tagline}`;

  useEffect(() => {
    document.title = fullTitle;
    setMeta("description", pageDesc);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", pageDesc, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", churchName, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", pageDesc);
  }, [fullTitle, pageDesc, churchName]);

  // Organisation / Church structured data
  useEffect(() => {
    const id = "ld-church";
    if (document.getElementById(id)) return;

    // Try to pull real data from content_blocks
    const contactBlock = blocks?.find((b: any) => b.sectionKey === 'footer');
    const socialBlock = blocks?.find((b: any) => b.sectionKey === 'social_links');
    const footerItems = (contactBlock?.items || []) as any[];
    const connectedGroup = footerItems.find((g: any) => g.group === "Stay Connected");
    const contactLinks = connectedGroup?.links || [];
    const addressLink = contactLinks.find((l: any) => l.label?.includes("Kathmandu") || l.label?.includes("Nepal"));
    const phoneLink = contactLinks.find((l: any) => l.href?.startsWith("tel:"));
    const emailLink = contactLinks.find((l: any) => l.href?.startsWith("mailto:"));

    const socialUrls: Record<string, string> = {};
    const socialItems = (socialBlock?.items || []) as any[];
    socialItems.forEach((s: any) => {
      if (s.url) socialUrls[s.icon?.toLowerCase()] = s.url;
    });

    const ld: any = {
      "@context": "https://schema.org",
      "@type": "Church",
      name: churchName,
      description: pageDesc || "A Christ-centred community in Nepal.",
      url: typeof window !== 'undefined' ? window.location.origin : '',
    };

    if (addressLink?.label) {
      ld.address = {
        "@type": "PostalAddress",
        streetAddress: addressLink.label,
        addressCountry: "NP",
      };
    }
    if (phoneLink?.href) {
      ld.telephone = phoneLink.href.replace("tel:", "");
    }
    if (emailLink?.href) {
      ld.email = emailLink.href.replace("mailto:", "");
    }
    if (Object.keys(socialUrls).length > 0) {
      ld.sameAs = Object.values(socialUrls);
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
  }, [churchName, pageDesc, blocks]);

  return null;
}
