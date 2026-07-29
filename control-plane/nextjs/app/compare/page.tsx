"use client";

import { useState } from "react";
import Link from "next/link";
import PublicLayout from "../public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ComparePage = () => {
  const [activeTab, setActiveTab] = useState("features");

  // Feature data for comparison
  const features = [
    { name: "Easy Website Builder", churchNepal: true, wix: true, squarespace: true, wordpress: true },
    { name: "Mobile Responsive", churchNepal: true, wix: true, squarespace: true, wordpress: true },
    { name: "SEO Optimized", churchNepal: true, wix: true, squarespace: true, wordpress: true },
    { name: "Multi-language Support", churchNepal: true, wix: false, squarespace: false, wordpress: true },
    { name: "Online Giving & Donations", churchNepal: true, wix: false, squarespace: false, wordpress: true },
    { name: "Event Management", churchNepal: true, wix: true, squarespace: true, wordpress: true },
    { name: "Member Directory", churchNepal: true, wix: false, squarespace: false, wordpress: true },
    { name: "Prayer Requests", churchNepal: true, wix: false, squarespace: false, wordpress: false },
    { name: "Sermon Upload & Streaming", churchNepal: true, wix: false, squarespace: false, wordpress: true },
    { name: "Group Management", churchNepal: true, wix: false, squarespace: false, wordpress: true },
    { name: "Attendance Tracking", churchNepal: true, wix: false, squarespace: false, wordpress: false },
    { name: "Newsletter & Communication", churchNepal: true, wix: false, squarespace: false, wordpress: true },
    { name: "Built for Churches", churchNepal: true, wix: false, squarespace: false, wordpress: false },
    { name: "Local Payment Integration", churchNepal: true, wix: false, squarespace: false, wordpress: false },
    { name: "Church-Specific Templates", churchNepal: true, wix: false, squarespace: false, wordpress: false },
    { name: "Multi-tenant Architecture", churchNepal: true, wix: false, squarespace: false, wordpress: false },
  ];

  const pricingData = [
    { name: "Pricing", churchNepal: "$49/month", wix: "$23/month", squarespace: "$16/month", wordpress: "Free*" }
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-[var(--accent-soft)] to-[var(--panel-2)]">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-strong)] mb-4">
              ChurchNepal vs Other Site Builders
            </h1>
            <p className="text-xl text-[var(--text)] max-w-3xl mx-auto">
              See why ChurchNepal is the best choice for churches in Nepal compared to general-purpose website builders.
            </p>
          </div>
        </section>

        {/* Comparison Tabs */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-[var(--panel-2)] p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("features")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "features"
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text)] hover:bg-[var(--panel)]"
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => setActiveTab("pricing")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "pricing"
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text)] hover:bg-[var(--panel)]"
                  }`}
                >
                  Pricing
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--panel-2)]">
                        <th className="text-left py-4 px-4 text-[var(--text-strong)] font-semibold">Feature</th>
                        <th className="text-center py-4 px-4 text-[var(--text-strong)] font-semibold">ChurchNepal</th>
                        <th className="text-center py-4 px-4 text-[var(--text-strong)] font-semibold">Wix</th>
                        <th className="text-center py-4 px-4 text-[var(--text-strong)] font-semibold">Squarespace</th>
                        <th className="text-center py-4 px-4 text-[var(--text-strong)] font-semibold">WordPress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTab === "features" &&
                        features.map((feature, index) => (
                          <tr 
                            key={index} 
                            className={index % 2 === 0 ? "bg-[var(--panel)]" : "bg-[var(--panel-2)]"}
                          >
                            <td className="py-3 px-4 text-[var(--text)]">{feature.name}</td>
                            <td className="py-3 px-4 text-center">
                              {feature.churchNepal ? (
                                <span className="text-[var(--good)]">✓</span>
                              ) : (
                                <span className="text-[var(--accent-soft)]">✗</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {feature.wix ? (
                                <span className="text-[var(--good)]">✓</span>
                              ) : (
                                <span className="text-[var(--accent-soft)]">✗</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {feature.squarespace ? (
                                <span className="text-[var(--good)]">✓</span>
                              ) : (
                                <span className="text-[var(--accent-soft)]">✗</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {feature.wordpress ? (
                                <span className="text-[var(--good)]">✓</span>
                              ) : (
                                <span className="text-[var(--accent-soft)]">✗</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {activeTab === "pricing" &&
                        pricingData.map((item, index) => (
                          <tr 
                            key={index} 
                            className={index % 2 === 0 ? "bg-[var(--panel)]" : "bg-[var(--panel-2)]"}
                          >
                            <td className="py-3 px-4 text-[var(--text)] font-medium">{item.name}</td>
                            <td className="py-3 px-4 text-center font-semibold text-[var(--accent)]">{item.churchNepal}</td>
                            <td className="py-3 px-4 text-center">{item.wix}</td>
                            <td className="py-3 px-4 text-center">{item.squarespace}</td>
                            <td className="py-3 px-4 text-center">{item.wordpress}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Built for Churches Callout */}
            <div className="mt-12 bg-[var(--accent-soft)] border border-[var(--accent)] rounded-xl p-6 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cross">
                    <path d="M12 3v14"/><path d="M5 10h14"/>
                  </svg>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-white">Built Specifically for Churches</h3>
                  <p className="text-white/90 mt-1">
                    ChurchNepal includes all the features your congregation needs - from online giving to member management,
                    designed specifically for the unique needs of churches in Nepal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[var(--panel-2)]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-[var(--text-strong)] mb-4">
              Ready to Build Your Church Website?
            </h2>
            <p className="text-lg text-[var(--text)] max-w-2xl mx-auto mb-8">
              Join hundreds of churches in Nepal using our platform to connect with their community.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default ComparePage;
