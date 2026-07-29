"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PublicLayout from "../public-layout";

const faqData = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      {
        question: "How do I sign up for Church Nepal?",
        answer: "Visit our website and click the 'Get Started' button. Fill in your church details and choose a plan to begin."
      },
      {
        question: "Do you offer a free trial?",
        answer: "Yes, we offer a 14-day free trial for all new churches so you can explore our features before committing."
      },
      {
        question: "How long does setup take?",
        answer: "Most churches can get their basic information online within 15-30 minutes of signing up."
      }
    ]
  },
  {
    id: "billing",
    title: "Billing",
    items: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept major credit cards, bank transfers, and digital wallets such as Khalti and eSewa."
      },
      {
        question: "Can I change my plan later?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated accordingly."
      },
      {
        question: "Is there a contract period?",
        answer: "No, all plans are month-to-month with no long-term contracts. Cancel anytime."
      }
    ]
  },
  {
    id: "features",
    title: "Features",
    items: [
      {
        question: "Can I manage multiple locations?",
        answer: "Yes, our system supports multi-location churches with centralized management capabilities."
      },
      {
        question: "Do you provide mobile apps?",
        answer: "Yes, we offer both iOS and Android apps for members to stay connected with your church community."
      },
      {
        question: "What kind of reporting tools do you offer?",
        answer: "Our platform includes attendance tracking, financial reports, member engagement metrics, and more."
      }
    ]
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        question: "Where is our data stored?",
        answer: "All data is securely stored on Nepal-based servers with daily backups and enterprise-grade security."
      },
      {
        question: "Is our data encrypted?",
        answer: "Yes, all data is encrypted both in transit and at rest using industry-standard encryption protocols."
      },
      {
        question: "Who has access to our church data?",
        answer: "Only authorized personnel from your church have access to your data. We never share information with third parties."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFAQs = faqData.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <PublicLayout>
      <div className="container py-8 px-4 max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-strong)]">Frequently Asked Questions</h1>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Find answers to common questions about using our church management platform
          </p>
        </div>

        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 text-[var(--text)] bg-[var(--bg)] border border-[var(--border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted)]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {filteredFAQs.map((category) => (
            <div key={category.id} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden">
              <Badge variant="secondary" className="m-4 bg-[var(--panel-2)] text-[var(--text-strong)]">
                {category.title}
              </Badge>
              <div className="divide-y divide-[var(--border-soft)]">
                {category.items.map((item, index) => (
                  <div key={`${category.id}-${index}`}>
                    <button
                      onClick={() => toggleAccordion(`${category.id}-${index}`)}
                      className="w-full flex justify-between items-center p-4 text-left hover:bg-[var(--panel-2)] transition-colors duration-200"
                    >
                      <span className="font-medium text-[var(--text-strong)]">{item.question}</span>
                      <svg
                        className={`w-5 h-5 text-[var(--muted)] transition-transform duration-200 ${
                          openId === `${category.id}-${index}` ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    {openId === `${category.id}-${index}` && (
                      <div className="p-4 pt-0 text-[var(--text)] bg-[var(--bg)]">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {searchQuery && filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--muted)]">No results found for "{searchQuery}". Try different keywords.</p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
