'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const OnboardingChecklist = () => {
  const [steps, setSteps] = useState([
    { id: 'first-church', label: 'Create your first church', completed: false },
    { id: 'base-domain', label: 'Set base domain', completed: false },
    { id: 'configure-billing', label: 'Configure billing settings', completed: false },
    { id: 'invite-admin', label: 'Invite an admin', completed: false },
    { id: 'brand-platform', label: 'Brand the platform', completed: false },
  ]);

  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleToggleStep = (id: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === id ? { ...step, completed: !step.completed } : step
      )
    );
  };

  // Check if all steps are completed to determine if the widget should be dismissed
  const isComplete = completedSteps === totalSteps;

  if (isComplete) {
    return null; // Hide the component when all steps are completed
  }

  // Calculate ring properties for visual progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 mb-6">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Progress Ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="var(--border-soft)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)" // Rotate to start from top
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-[var(--text-strong)]">{progressPercentage}%</span>
              <span className="text-xs text-[var(--muted)]">Complete</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text-strong)] mb-3">Setup Checklist</h3>
            <ul className="space-y-2">
              {steps.map((step) => (
                <li key={step.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => handleToggleStep(step.id)}
                    className="mt-1 h-4 w-4 text-[var(--accent)] border-[var(--border-soft)] rounded focus:ring-[var(--accent)] focus:ring-offset-0"
                  />
                  <div className="flex-grow min-w-0">
                    <span className={`${step.completed ? 'text-[var(--muted)] line-through' : 'text-[var(--text)]'}`}>
                      {step.label}
                    </span>
                    {!step.completed && (
                      <div className="mt-1">
                        <Link href="#" passHref>
                          <Button variant="link" size="sm" className="h-auto p-0 text-[var(--accent)] underline">
                            Take action
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;
