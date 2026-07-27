'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TaxSettingsPage() {
  const [formData, setFormData] = useState({
    enabled: false,
    name: 'VAT',
    rate: '',
    inclusive: false,
    businessId: '',
    footerText: ''
  });

  // Load initial data from API (mock for now)
  useEffect(() => {
    // Simulate loading saved settings
    const savedSettings = {
      enabled: true,
      name: 'VAT',
      rate: '13',
      inclusive: false,
      businessId: '123456789',
      footerText: 'Tax ID: 123456789'
    };
    setFormData(savedSettings);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send to API
    console.log('Saving tax settings:', formData);
    toast.success('Tax settings updated successfully!');
  };

  // Calculate example values for preview
  const subtotal = 100.00;
  const taxRate = parseFloat(formData.rate || '0') / 100;
  let taxAmount, total;

  if (formData.inclusive) {
    // If price includes tax
    const preTaxPrice = subtotal / (1 + taxRate);
    taxAmount = subtotal - preTaxPrice;
    total = subtotal;
  } else {
    // If tax is added on top
    taxAmount = subtotal * taxRate;
    total = subtotal + taxAmount;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h1 className="text-xl font-semibold mb-4">Tax Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={formData.enabled}
              onChange={handleChange}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            <label htmlFor="enabled" className="text-[var(--text)]">
              Enable Tax / VAT
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-[var(--text)]">
                Tax Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., VAT, GST"
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>

            <div>
              <label htmlFor="rate" className="block text-sm font-medium mb-1 text-[var(--text)]">
                Tax Rate (%)
              </label>
              <Input
                id="rate"
                name="rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.rate}
                onChange={handleChange}
                placeholder="e.g., 13.00"
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="inclusive"
              name="inclusive"
              checked={formData.inclusive}
              onChange={handleChange}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            <label htmlFor="inclusive" className="text-[var(--text)]">
              Prices Include Tax
            </label>
          </div>

          <div>
            <label htmlFor="businessId" className="block text-sm font-medium mb-1 text-[var(--text)]">
              Business Tax ID
            </label>
            <Input
              id="businessId"
              name="businessId"
              value={formData.businessId}
              onChange={handleChange}
              placeholder="Your tax registration number"
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div>
            <label htmlFor="footerText" className="block text-sm font-medium mb-1 text-[var(--text)]">
              Invoice Footer Text
            </label>
            <Input
              id="footerText"
              name="footerText"
              value={formData.footerText}
              onChange={handleChange}
              placeholder="Text shown on invoices (e.g., tax ID)"
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <Button 
            type="submit" 
            className="bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
          >
            Save Settings
          </Button>
        </form>
      </Card>

      {/* Live Preview Section */}
      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-lg font-medium mb-3">Invoice Preview</h2>
        <div className="bg-[var(--bg)] p-4 rounded-lg border border-[var(--border-soft)]">
          <div className="text-sm text-[var(--muted)] mb-2">Sample Invoice Line</div>
          
          <div className="space-y-1 text-[var(--text)]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {formData.enabled && (
              <div className="flex justify-between">
                <span>{formData.name} ({parseFloat(formData.rate || '0').toFixed(2)}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-medium pt-1 border-t border-[var(--border-soft)] mt-1">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {formData.footerText && (
            <div className="mt-3 pt-2 border-t border-[var(--border-soft)] text-xs text-[var(--muted)]">
              {formData.footerText}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
