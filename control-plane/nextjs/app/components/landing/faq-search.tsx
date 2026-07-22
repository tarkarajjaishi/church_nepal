'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "What is tenant isolation?",
    answer: "Tenant isolation ensures that each church's data, settings, and users are completely separated from others. This means your congregation's information remains private and secure."
  },
  {
    question: "How does pricing work?",
    answer: "We offer tiered plans based on the size of your congregation and the features you need. All plans include core functionality like member management, events, and giving tools."
  },
  {
    question: "Can I use my own domain?",
    answer: "Yes! You can connect your own domain to your church's website. We provide step-by-step instructions to help you set up DNS records for seamless integration."
  },
  {
    question: "How do I migrate my existing data?",
    answer: "We provide tools and documentation to help you migrate your member data, events, and other content. Our support team is also available to guide you through the process."
  },
  {
    question: "Who can edit content?",
    answer: "Permissions are role-based. Administrators can manage all aspects, while pastors and staff members can be granted specific access levels depending on their responsibilities."
  },
  {
    question: "Do you offer support?",
    answer: "Yes, we offer email support for all plans. Premium plans include priority response times and dedicated account management."
  },
  {
    question: "How long does it take to launch?",
    answer: "Most churches can get their site live within a few hours of signing up. Customization and content setup might take longer depending on your needs."
  },
  {
    question: "Who owns my data?",
    answer: "You always own your data. We provide export tools so you can download your information at any time. Your data will never be sold or shared without permission."
  }
];

export default function FaqSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(query) || 
      faq.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Close accordion when search changes
  useEffect(() => {
    if (searchQuery.trim()) setOpenIndex(null);
  }, [searchQuery]);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-[var(--max)] px-6">
        {/* Eyebrow and Title */}
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)]">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative mb-8 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <Search className="w-5 h-5 text-[var(--muted)]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full p-4 ps-10 rounded-xl bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
            aria-label="Search FAQ"
          />
        </div>

        {/* Accordion List */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div 
                key={index} 
                className="rounded-xl overflow-hidden bg-[var(--panel)] border border-[var(--border)]"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className={`flex justify-between items-center w-full p-6 text-left ${openIndex === index ? 'bg-[var(--accent-soft)]' : ''} hover:bg-[var(--panel-2)]`}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-medium text-[var(--text-strong)]">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-[var(--muted)] transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                
                {openIndex === index && (
                  <>
                    <div className="border-t border-[var(--border)]"></div>
                    <div
                      id={`faq-answer-${index}`}
                      className="p-6 text-[var(--text)]"
                      aria-hidden={false}
                    >
                      {faq.answer}
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--muted)]">No questions match your search.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
