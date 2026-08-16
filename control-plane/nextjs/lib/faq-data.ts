export type FaqItem = { question: string; answer: string };
export type FaqCategory = { id: string; title: string; items: FaqItem[] };

// Shared with app/faq/layout.tsx, which turns this into FAQPage structured
// data. Google requires the marked-up Q&A to be the Q&A a visitor actually
// sees, so there is exactly one copy of it.
export const faqData: FaqCategory[] = [
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
