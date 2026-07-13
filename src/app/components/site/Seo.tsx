import { useEffect } from "react";
import { useLocation } from "react-router";

const SITE = "Grace Nepal Church";
const DESC = "A Christ-centred community in Kathmandu, Nepal — worshipping Jesus, growing in faith, and serving every village with the gospel. Join us this Sunday at 10:00 AM.";

// Per-route <title> and meta description.
const meta: Record<string, { title: string; desc: string }> = {
  "/": { title: `${SITE} — Faith, Hope & Love in Nepal`, desc: DESC },
  "/visit": { title: `Plan Your Visit — ${SITE}`, desc: "New here? Everything you need for a warm, relaxed first Sunday visit — service times, what to expect, kids, parking and directions in Kathmandu." },
  "/about": { title: `About Us — ${SITE}`, desc: "Learn about our story, mission and what we believe as a Christ-centred church in Nepal." },
  "/pastor": { title: `Our Pastor — ${SITE}`, desc: "Meet Ps. Bishal Rai, senior pastor of Grace Nepal Church." },
  "/leadership": { title: `Leadership — ${SITE}`, desc: "Meet the servant-hearted team leading Grace Nepal Church." },
  "/ministries": { title: `Ministries — ${SITE}`, desc: "Discover a ministry where you can grow, serve and belong — for children, youth, women, men and more." },
  "/sermons": { title: `Sermons — ${SITE}`, desc: "Watch and listen to Bible-based messages from Grace Nepal Church." },
  "/events": { title: `Events — ${SITE}`, desc: "Upcoming services, camps, conferences and gatherings at Grace Nepal Church." },
  "/gallery": { title: `Gallery — ${SITE}`, desc: "Moments of worship, fellowship and mission from the life of our church." },
  "/prayer": { title: `Prayer Request — ${SITE}`, desc: "Submit a confidential prayer request. Our prayer team commits to praying over every one." },
  "/give": { title: `Give — ${SITE}`, desc: "Support the mission of Grace Nepal Church through your generous giving." },
  "/contact": { title: `Contact — ${SITE}`, desc: "Reach out, drop by, or send us a message. We'd love to hear from you." },
  "/live": { title: `Watch Live — ${SITE}`, desc: "Join our live Sunday service online, wherever you are." },
  "/privacy": { title: `Privacy Policy — ${SITE}`, desc: "Learn how Grace Nepal Church collects, uses, and protects your personal information." },
  "/terms": { title: `Terms of Service — ${SITE}`, desc: "Guidelines for using the Grace Nepal Church website." },
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
  const { pathname } = useLocation();

  useEffect(() => {
    // Handle dynamic routes
    let m = meta[pathname];
    if (!m) {
      if (pathname.startsWith("/sermons/")) {
        m = { title: `Sermon — ${SITE}`, desc: "Listen to this Bible-based message from Grace Nepal Church." };
      } else if (pathname.startsWith("/events/")) {
        m = { title: `Event — ${SITE}`, desc: "Event details for Grace Nepal Church." };
      } else if (pathname.startsWith("/ministries/")) {
        m = { title: `Ministry — ${SITE}`, desc: "Learn about this ministry at Grace Nepal Church." };
      } else {
        m = { title: SITE, desc: DESC };
      }
    }
    document.title = m.title;
    setMeta("description", m.desc);
    setMeta("og:title", m.title, "property");
    setMeta("og:description", m.desc, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image");
  }, [pathname]);

  // Organisation / Church structured data (injected once).
  useEffect(() => {
    const id = "ld-church";
    if (document.getElementById(id)) return;
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = id;
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Church",
      name: SITE,
      description: DESC,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Baneshwor",
        addressLocality: "Kathmandu",
        postalCode: "44600",
        addressCountry: "NP",
      },
      telephone: "+977 1-4000000",
      email: "hello@gracenepal.org",
      openingHours: "Su 10:00-11:30",
    });
    document.head.appendChild(ld);
  }, []);

  return null;
}
