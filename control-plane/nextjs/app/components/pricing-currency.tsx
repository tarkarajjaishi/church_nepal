'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const CURRENCY_KEY = 'preferred_currency';
const EXCHANGE_RATE_NPR_TO_USD = 0.0075; // Fixed rate: 1 NPR = 0.0075 USD

// Determine default currency based on locale/timezone
function getDefaultCurrency(): 'NPR' | 'USD' {
  const lang = navigator.language || 'en-US';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Default to NPR if language suggests Nepal (ne-NP) or timezone is Asia/Kathmandu
  if (lang.startsWith('ne') || timezone === 'Asia/Kathmandu') {
    return 'NPR';
  }
  return 'USD';
}

export function PricingCurrencyToggle() {
  const [currency, setCurrency] = useState<'NPR' | 'USD'>('USD');

  useEffect(() => {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved === 'NPR' || saved === 'USD') {
      setCurrency(saved as 'NPR' | 'USD');
    } else {
      setCurrency(getDefaultCurrency());
    }
  }, []);

  const toggleCurrency = () => {
    const newCurrency = currency === 'NPR' ? 'USD' : 'NPR';
    setCurrency(newCurrency);
    localStorage.setItem(CURRENCY_KEY, newCurrency);
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={toggleCurrency}
      className="text-sm"
    >
      {currency}
    </Button>
  );
}

export function convertPrice(price: number, targetCurrency: 'NPR' | 'USD', baseCurrency?: 'NPR' | 'USD'): number {
  const from = baseCurrency ?? 'NPR';
  if (from === targetCurrency) {
    return price;
  }
  
  if (from === 'NPR' && targetCurrency === 'USD') {
    return parseFloat((price * EXCHANGE_RATE_NPR_TO_USD).toFixed(2));
  }
  
  return Math.round(price / EXCHANGE_RATE_NPR_TO_USD);
}
