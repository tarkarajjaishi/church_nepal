'use client';

import { useState, useEffect } from 'react';
import { PricingCurrencyToggle, convertPrice } from '@/components/pricing-currency';
import { Button } from '@/components/ui/button';

type Plan = {
  id: string;
  name: string;
  description: string;
  priceMonthlyNPR: number;
  priceYearlyNPR: number;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for small churches starting their online presence',
    priceMonthlyNPR: 2500,
    priceYearlyNPR: 25000,
    features: [
      'Up to 100 members',
      'Basic website',
      'Email support',
      'Online giving'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing churches with more engagement needs',
    priceMonthlyNPR: 5000,
    priceYearlyNPR: 50000,
    features: [
      'Up to 500 members',
      'Advanced website',
      'Priority support',
      'Online giving',
      'Event management',
      'Member directory'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large churches with complex needs',
    priceMonthlyNPR: 10000,
    priceYearlyNPR: 100000,
    features: [
      'Unlimited members',
      'Custom website',
      '24/7 dedicated support',
      'Advanced analytics',
      'Custom integrations',
      'Multi-site management'
    ]
  }
];

export function PricingSection() {
  const [currency, setCurrency] = useState<'NPR' | 'USD'>('USD');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const saved = localStorage.getItem('preferred_currency');
    if (saved === 'NPR' || saved === 'USD') {
      setCurrency(saved as 'NPR' | 'USD');
    } else {
      // Default logic for Nepal users
      const lang = navigator.language || 'en-US';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (lang.startsWith('ne') || timezone === 'Asia/Kathmandu') {
        setCurrency('NPR');
      } else {
        setCurrency('USD');
      }
    }
  }, []);

  const handleCurrencyChange = (newCurrency: 'NPR' | 'USD') => {
    setCurrency(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
  };

  return (
    <section className="py-16 bg-[var(--bg)]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[var(--text)]">Simple, transparent pricing</h2>
            <p className="text-[var(--muted)] mt-2">Choose the plan that fits your church's needs</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-sm ${currency === 'NPR' ? 'text-[var(--text)] font-medium' : 'text-[var(--muted)]'}`}>NPR</span>
            <button 
              onClick={() => handleCurrencyChange(currency === 'NPR' ? 'USD' : 'NPR')}
              className="relative rounded-full w-12 h-6 bg-[var(--accent-soft)]"
            >
              <span 
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                  currency === 'NPR' 
                    ? 'left-1 bg-[var(--accent)]' 
                    : 'left-7 bg-[var(--accent)]'
                }`}
              />
            </button>
            <span className={`text-sm ${currency === 'USD' ? 'text-[var(--text)] font-medium' : 'text-[var(--muted)]'}`}>USD</span>
            
            <PricingCurrencyToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const monthlyPrice = billingCycle === 'monthly' 
              ? plan[`price${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}NPR` as keyof Plan] as number
              : plan[`price${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}NPR` as keyof Plan] as number;
              
            const convertedPrice = convertPrice(monthlyPrice, currency);

            return (
              <div 
                key={plan.id} 
                className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 flex flex-col"
              >
                <h3 className="text-xl font-bold text-[var(--text)]">{plan.name}</h3>
                <p className="text-[var(--muted)] text-sm mt-1">{plan.description}</p>
                
                <div className="my-4">
                  <div className="text-3xl font-bold text-[var(--text)]">
                    {currency === 'NPR' ? 'रू' : '$'}{convertedPrice.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0 })}
                    <span className="text-base font-normal text-[var(--muted)]">/{billingCycle}</span>
                  </div>
                </div>
                
                <ul className="mb-6 space-y-2 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-[var(--good)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-[var(--text)] text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full mt-auto">
                  Get Started
                </Button>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 text-center text-sm text-[var(--muted)]">
          All prices are exclusive of applicable taxes where required. Prices shown in {currency}.
        </div>
      </div>
    </section>
  );
}
