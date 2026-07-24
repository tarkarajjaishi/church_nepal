"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const VsCompetitors = () => {
  // Data for the comparison table
  const capabilities = [
    {
      feature: "Multi-Tenant Architecture",
      churchnepal: true,
      genericBuilder: false,
      diy: true,
    },
    {
      feature: "Per-Church Database Isolation",
      churchnepal: true,
      genericBuilder: false,
      diy: true,
    },
    {
      feature: "Integrated Giving & Donations",
      churchnepal: true,
      genericBuilder: false,
      diy: true,
    },
    {
      feature: "Sermons & Media Management",
      churchnepal: true,
      genericBuilder: false,
      diy: true,
    },
    {
      feature: "Church-Specific Themes",
      churchnepal: true,
      genericBuilder: true,
      diy: true,
    },
    {
      feature: "Dedicated Church Support",
      churchnepal: true,
      genericBuilder: false,
      diy: false,
    },
    {
      feature: "Transparent Pricing",
      churchnepal: true,
      genericBuilder: false,
      diy: false,
    },
  ];

  // Checkmark Icon
  const CheckIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--good)]"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );

  // X Icon
  const XIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--muted)]"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--text-strong)]">
          Why ChurchNepal?
        </h2>
        <p className="text-center text-[var(--muted)] max-w-2xl mx-auto mb-12">
          See how ChurchNepal compares to generic website builders and DIY solutions.
        </p>

        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 border-b border-[var(--border-soft)] py-4 px-6 bg-[var(--panel-2)]">
              <div className="font-semibold text-[var(--text-strong)]">Capability</div>
              <div className="font-semibold text-center text-[var(--text-strong)]">ChurchNepal</div>
              <div className="font-semibold text-center text-[var(--text-strong)]">Generic Builder</div>
              <div className="font-semibold text-center text-[var(--text-strong)]">DIY Solution</div>
            </div>

            {/* Table Rows */}
            {capabilities.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-4 gap-4 py-4 px-6 ${
                  index % 2 === 0 ? "bg-[var(--panel)]" : "bg-[var(--panel-2)]"
                }`}
              >
                <div className="text-[var(--text)] flex items-center">{item.feature}</div>
                <div className="flex justify-center">
                  {item.churchnepal ? <CheckIcon /> : <XIcon />}
                </div>
                <div className="flex justify-center">
                  {item.genericBuilder ? <CheckIcon /> : <XIcon />}
                </div>
                <div className="flex justify-center">
                  {item.diy ? <CheckIcon /> : <XIcon />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-[var(--muted)]">
          * ChurchNepal offers specialized features tailored for Nepali churches with multi-tenant architecture and robust security.
        </div>
      </div>
    </section>
  );
};

export default VsCompetitors;
