'use client';

import { useState, useEffect } from 'react';
import { convertPrice, PricingCurrencyToggle } from './pricing-currency';

const BASE_PRICE_NPR = 2500; // Basic plan price in NPR
const PRICE_PER_MEMBER_NPR = 10; // Additional cost per member in NPR

export function PricingCalculator() {
  const [members, setMembers] = useState<number>(100);
  const [currency, setCurrency] = useState<'NPR' | 'USD'>('USD');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(BASE_PRICE_NPR);

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

  useEffect(() => {
    // Calculate base price plus additional cost per member above 100
    let calculatedPrice = BASE_PRICE_NPR;
    if (members > 100) {
      calculatedPrice += (members - 100) * PRICE_PER_MEMBER_NPR;
    }
    
    const convertedPrice = convertPrice(calculatedPrice, currency);
    setEstimatedPrice(convertedPrice);
  }, [members, currency]);

  const handleCurrencyChange = (newCurrency: 'NPR' | 'USD') => {
    setCurrency(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
  };

  return (
    <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6 max-w-md mx-auto">
      <h3 className="text-lg font-bold text-[var(--text)] mb-4">Estimate Your Costs</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">
            Number of Members: {members}
          </label>
          <input
            type="range"
            min="10"
            max="5000"
            value={members}
            onChange={(e) => setMembers(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
            <span>10</span>
            <span>5000</span>
          </div>
        </div>
        
        <div className="pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--text)]">Estimated Monthly Cost:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${currency === 'NPR' ? 'text-[var(--text)] font-medium' : 'text-[var(--muted)]'}`}>NPR</span>
              <button 
                onClick={() => handleCurrencyChange(currency === 'NPR' ? 'USD' : 'NPR')}
                className="relative rounded-full w-10 h-5 bg-[var(--accent-soft)]"
              >
                <span 
                  className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    currency === 'NPR' 
                      ? 'left-0.5 bg-[var(--accent)]' 
                      : 'left-5 bg-[var(--accent)]'
                  }`}
                />
              </button>
              <span className={`text-sm ${currency === 'USD' ? 'text-[var(--text)] font-medium' : 'text-[var(--muted)]'}`}>USD</span>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-[var(--text)]">
            {currency === 'NPR' ? 'रू' : '$'}{estimatedPrice.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0 })}
          </div>
        </div>
        
        <div className="pt-4">
          <PricingCurrencyToggle />
        </div>
      </div>
    </div>
  );
}
