'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const RoiCalculator = () => {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    churchSize: '',
    currentCost: '',
    currentHours: '',
    email: ''
  });

  // Example calculations based on inputs
  const calculateSavings = () => {
    const size = parseInt(values.churchSize, 10) || 0;
    const cost = parseFloat(values.currentCost) || 0;
    const hours = parseFloat(values.currentHours) || 0;

    // Example calculation logic
    const staffHoursSaved = hours * 0.3; // Assume 30% saved
    const softwareSavings = cost * 0.4; // Assume $40% saved on software
    const totalAnnualSavings = staffHoursSaved * 25 * 12 + softwareSavings; // $25/hr est

    return {
      staffHoursSaved,
      softwareSavings,
      totalAnnualSavings
    };
  };

  const handleInputChange = (field: keyof typeof values, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailSubmit = () => {
    if (!values.email) return;
    setStep(4); // Go to report preview step
  };

  const results = calculateSavings();

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text)]">Calculate Your Church's Potential Savings</h2>
        <p className="text-[var(--muted)] mt-1">Answer a few quick questions to see how much time and money you could save.</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Approximate Weekly Attendance</label>
            <Input
              type="number"
              value={values.churchSize}
              onChange={(e) => handleInputChange('churchSize', e.target.value)}
              placeholder="e.g. 200"
              className="w-full"
            />
          </div>
          <Button onClick={() => values.churchSize ? setStep(2) : null} disabled={!values.churchSize}>
            Next
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Current Annual Software Costs ($)</label>
            <Input
              type="number"
              value={values.currentCost}
              onChange={(e) => handleInputChange('currentCost', e.target.value)}
              placeholder="e.g. 1200"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => values.currentCost ? setStep(3) : null} disabled={!values.currentCost}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Weekly Hours Spent on Administration</label>
            <Input
              type="number"
              value={values.currentHours}
              onChange={(e) => handleInputChange('currentHours', e.target.value)}
              placeholder="e.g. 10"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => values.currentHours ? setStep(4) : null} disabled={!values.currentHours}>
              Get My Report
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Email Collection */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-[var(--text)]">Get Your Free ROI Report</h3>
            <p className="text-[var(--muted)] mt-1">Enter your email to receive a detailed summary of potential savings.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">Email Address</label>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button onClick={handleEmailSubmit} disabled={!values.email}>Generate Report</Button>
          </div>
        </div>
      )}

      {/* Final Results Preview */}
      {step === 4 && values.email && (
        <div className="mt-6 p-4 bg-[var(--panel-2)] rounded-lg border border-[var(--border-soft)]">
          <h3 className="font-semibold text-lg text-[var(--text)]">Your Estimated Savings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-[var(--bg)] rounded-lg">
              <Badge variant="secondary" className="bg-[var(--good-soft)] text-[var(--good)]">Staff Time Saved</Badge>
              <p className="text-2xl font-bold mt-2 text-[var(--text)]">{results.staffHoursSaved.toFixed(1)} hrs/wk</p>
            </div>
            
            <div className="text-center p-3 bg-[var(--bg)] rounded-lg">
              <Badge variant="secondary" className="bg-[var(--good-soft)] text-[var(--good)]">Software Cost Savings</Badge>
              <p className="text-2xl font-bold mt-2 text-[var(--text)]">${results.softwareSavings.toFixed(0)}/yr</p>
            </div>
            
            <div className="text-center p-3 bg-[var(--bg)] rounded-lg">
              <Badge variant="secondary" className="bg-[var(--accent-soft)] text-[var(--accent)]">Total Annual Savings</Badge>
              <p className="text-2xl font-bold mt-2 text-[var(--text)]">${results.totalAnnualSavings.toFixed(0)}</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => window.print()} 
              className="bg-[var(--accent)] hover:bg-[var(--accent-2)]"
            >
              Print Full Report
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RoiCalculator;
