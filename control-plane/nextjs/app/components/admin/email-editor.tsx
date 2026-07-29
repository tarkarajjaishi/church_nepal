'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

const VARIABLE_CHIP_MAP: Record<string, string> = {
  '{{name}}': 'Recipient Name',
  '{{email}}': 'Recipient Email',
  '{{date}}': 'Current Date',
  '{{amount}}': 'Amount Value',
  '{{receipt_id}}': 'Receipt ID',
  '{{login_link}}': 'Login Link',
  '{{reset_link}}': 'Reset Link',
  '{{invoice_number}}': 'Invoice Number',
  '{{amount_due}}': 'Amount Due',
  '{{due_date}}': 'Due Date',
  '{{invoice_link}}': 'Invoice Link',
  '{{church_name}}': 'Church Name',
  '{{reason}}': 'Reason',
  '{{suspension_date}}': 'Suspension Date',
};

export function EmailEditor({ template }: { template: EmailTemplate }) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  // Update state when template changes
  useEffect(() => {
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  const handleVariableInsert = (variable: string) => {
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = body.substring(0, start) + variable + body.substring(end);
    
    setBody(newValue);
  };

  const handleSendTest = () => {
    // Simulate sending test email
    toast.success(`Test email sent to admin@example.com for ${template.name}`);
  };

  // Generate preview by replacing variables
  const generatePreview = () => {
    let previewSubject = subject;
    let previewBody = body;

    Object.entries(previewData).forEach(([key, value]) => {
      previewSubject = previewSubject.replace(new RegExp(key, 'g'), value || key);
      previewBody = previewBody.replace(new RegExp(key, 'g'), value || key);
    });

    return { subject: previewSubject, body: previewBody };
  };

  const { subject: previewSubject, body: previewBody } = generatePreview();

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Subject</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Body</label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(VARIABLE_CHIP_MAP).map(([variable, label]) => (
              <button
                key={variable}
                type="button"
                onClick={() => handleVariableInsert(variable)}
                className="text-xs px-2 py-1 bg-[var(--accent-soft)] hover:bg-[var(--accent)] text-[var(--text)] rounded-md"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="email-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--panel-2)] text-[var(--text)]"
          placeholder="Email body content..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 bg-[var(--panel-2)] border border-[var(--border-soft)]">
          <h3 className="font-medium mb-2">Preview Data</h3>
          <div className="space-y-2">
            {Object.keys(VARIABLE_CHIP_MAP).map((variable) => (
              <div key={variable} className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-[var(--panel-3)] rounded">{variable}</span>
                <input
                  type="text"
                  value={previewData[variable] || ''}
                  onChange={(e) => setPreviewData(prev => ({
                    ...prev,
                    [variable]: e.target.value
                  }))}
                  placeholder={`Enter value for ${variable}`}
                  className="flex-1 p-1 text-sm border border-[var(--border)] rounded bg-[var(--panel-2)] text-[var(--text)]"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-[var(--panel-2)] border border-[var(--border-soft)]">
          <h3 className="font-medium mb-2">Live Preview</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-[var(--muted)]">Subject:</h4>
              <p>{previewSubject}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--muted)]">Body:</h4>
              <pre className="whitespace-pre-wrap p-3 bg-[var(--panel-3)] rounded text-sm">
                {previewBody}
              </pre>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSendTest}>Send Test Email</Button>
      </div>
    </div>
  );
}
