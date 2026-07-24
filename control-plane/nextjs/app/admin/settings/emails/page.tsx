'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { EmailEditor } from '@/components/admin/email-editor';

const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Church Nepal!',
    body: 'Hello {{name}},\n\nThank you for joining us at Church Nepal! We\'re excited to have you as part of our community.\n\n{{login_link}}',
  },
  {
    id: 'receipt',
    name: 'Donation Receipt',
    subject: 'Your Donation Receipt - {{amount}}',
    body: 'Hi {{name}},\n\nThank you for your generous donation of {{amount}} made on {{date}}.\n\nReceipt ID: {{receipt_id}}\n\nGod bless you!',
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    body: 'Hello {{name}},\n\nClick the link below to reset your password:\n\n{{reset_link}}\n\nThis link will expire in 1 hour.',
  },
  {
    id: 'invoice',
    name: 'Billing Invoice',
    subject: 'Invoice #{{invoice_number}} - {{amount_due}}',
    body: 'Hello {{church_name}},\n\nYour monthly invoice (#{{invoice_number}}) is ready. Amount due: {{amount_due}}\n\nDue Date: {{due_date}}\n\n{{invoice_link}}',
  },
  {
    id: 'suspension',
    name: 'Account Suspension',
    subject: 'Account Suspended - Action Required',
    body: 'Dear {{church_name}},\n\nYour account has been suspended due to {{reason}}. Please contact support to resolve this issue.\n\nSuspension Date: {{suspension_date}}',
  }
];

export default function EmailSettingsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Email Templates</h1>
      
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold mb-3">Templates</h2>
            <ul className="space-y-2">
              {EMAIL_TEMPLATES.map((template) => (
                <li key={template.id}>
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left px-3 py-2 rounded-md ${
                      selectedTemplate.id === template.id 
                        ? 'bg-[var(--accent)] text-white' 
                        : 'hover:bg-[var(--panel-2)]'
                    }`}
                  >
                    {template.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Editor */}
          <div className="lg:col-span-3">
            <EmailEditor template={selectedTemplate} />
          </div>
        </div>
      </Card>
    </div>
  );
}
