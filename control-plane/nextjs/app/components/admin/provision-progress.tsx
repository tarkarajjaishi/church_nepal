'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface ProvisionProgressProps {
  churchData: {
    name: string;
    subdomain: string;
    plan: string;
    adminEmail: string;
  };
  onComplete: () => void;
}

export default function ProvisionProgress({ churchData, onComplete }: ProvisionProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([
    { id: 'subdomain', label: 'Setting up subdomain', status: 'pending' },
    { id: 'database', label: 'Creating database', status: 'pending' },
    { id: 'storage', label: 'Configuring storage', status: 'pending' },
    { id: 'admin', label: 'Creating admin account', status: 'pending' },
    { id: 'content', label: 'Adding sample content', status: 'pending' },
  ]);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'in-progress' };
        return newSteps;
      });

      // Simulate API call delay
      const apiTimer = setTimeout(() => {
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'completed' };
          return newSteps;
        });
        setCurrentStepIndex(prev => prev + 1);
      }, 1500);

      return () => clearTimeout(apiTimer);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps.length]);

  const getIcon = (status: StepStatus) => {
    if (status === 'in-progress') {
      return (
        <svg className="animate-spin h-5 w-5 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    if (status === 'completed') {
      return (
        <svg className="h-5 w-5 text-[var(--good)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    );
  };

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
      <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Creating {churchData.name}</h2>
      <p className="text-[var(--muted)] mb-6">Your church instance is being provisioned...</p>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="mr-3 flex-shrink-0">
              {getIcon(step.status)}
            </div>
            <div className="text-[var(--text)]">{step.label}</div>
          </div>
        ))}
      </div>

      {isComplete && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--good-soft)] mb-4">
            <svg className="h-6 w-6 text-[var(--good)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text)] mb-1">Church Created Successfully!</h3>
          <p className="text-[var(--muted)] mb-4">Your church is ready to go.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`https://${churchData.subdomain}.churchnepal.com`} target="_blank">
              <Button variant="outline">
                Visit Church Site
              </Button>
            </Link>
            <Link href={`/admin/churches/${churchData.subdomain}`}>
              <Button>
                Go to Admin Panel
              </Button>
            </Link>
            <Button variant="ghost" onClick={onComplete}>
              Back to Churches
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
