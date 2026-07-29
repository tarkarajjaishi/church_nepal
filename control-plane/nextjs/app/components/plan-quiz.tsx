'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Question = {
  id: string;
  question: string;
  type: 'select' | 'range';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
};

const questions: Question[] = [
  {
    id: 'size',
    question: 'How many members does your church have?',
    type: 'select',
    options: [
      { value: 'small', label: 'Under 50' },
      { value: 'medium', label: '50 - 200' },
      { value: 'large', label: 'Over 200' },
    ],
  },
  {
    id: 'features',
    question: 'Which features do you need most?',
    type: 'select',
    options: [
      { value: 'basic', label: 'Basic website & events' },
      { value: 'standard', label: 'Members, donations & groups' },
      { value: 'advanced', label: 'All features including CRM' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your monthly budget?',
    type: 'range',
    min: 0,
    max: 200,
    step: 10,
  },
];

type QuizAnswers = {
  [key: string]: string | number;
};

type RecommendedPlan = {
  name: string;
  description: string;
  features: string[];
  ctaText: string;
  link: string;
};

const getRecommendedPlan = (answers: QuizAnswers): RecommendedPlan => {
  const { size = '', features = '', budget = 0 } = answers;

  // Simple logic to determine plan based on answers
  if (size === 'small' && features === 'basic' && Number(budget) < 50) {
    return {
      name: 'Starter Plan',
      description: 'Perfect for small churches just getting started online.',
      features: ['Basic Website', 'Event Management', 'Contact Form'],
      ctaText: 'Get Started Free',
      link: '/signup',
    };
  }

  if ((size === 'medium' || size === 'small') && features !== 'advanced' && Number(budget) >= 50 && Number(budget) <= 100) {
    return {
      name: 'Growth Plan',
      description: 'Ideal for growing churches needing member management.',
      features: ['Everything in Starter', 'Member Directory', 'Donation Processing', 'Groups & Teams'],
      ctaText: 'Start Growing Today',
      link: '/signup',
    };
  }

  return {
    name: 'Pro Plan',
    description: 'For established churches requiring full functionality.',
    features: ['Everything in Growth', 'Advanced CRM', 'Custom Integrations', 'Priority Support'],
    ctaText: 'Go Pro Now',
    link: '/signup',
  };
};

export default function PlanQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [recommendedPlan, setRecommendedPlan] = useState<RecommendedPlan | null>(null);

  const handleAnswerChange = (value: string | number) => {
    const newAnswers = { ...answers, [questions[currentStep].id]: value };
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last question - calculate recommendation
      setRecommendedPlan(getRecommendedPlan(answers));
    }
  };

  const prevQuestion = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendedPlan(null);
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (recommendedPlan) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 transition-all duration-500 animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-4">Recommended Plan</h2>
          <div className="text-center py-6">
            <h3 className="text-3xl font-bold text-[var(--accent)]">{recommendedPlan.name}</h3>
            <p className="mt-2 text-[var(--text)]">{recommendedPlan.description}</p>
            
            <ul className="mt-4 space-y-2 text-left">
              {recommendedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg 
                    className="w-5 h-5 text-[var(--good)] mr-2 mt-0.5 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-[var(--text)]">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button asChild className="mt-6 w-full max-w-xs mx-auto">
              <a href={recommendedPlan.link}>{recommendedPlan.ctaText}</a>
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={resetQuiz}>
              Retake Quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4">
        <div className="w-full bg-[var(--panel-2)] rounded-full h-2.5">
          <div 
            className="bg-[var(--accent)] h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-center mt-2 text-[var(--muted)]">
          Question {currentStep + 1} of {questions.length}
        </p>
      </div>

      <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-strong)]">
          {currentQuestion.question}
        </h2>

        {currentQuestion.type === 'select' && currentQuestion.options ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className={`w-full justify-start ${answers[currentQuestion.id] === option.value ? 'bg-[var(--accent-soft)] border-[var(--accent)]' : ''}`}
                onClick={() => handleAnswerChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : currentQuestion.type === 'range' ? (
          <div className="space-y-4">
            <input
              type="range"
              min={currentQuestion.min}
              max={currentQuestion.max}
              step={currentQuestion.step}
              value={answers[currentQuestion.id] as number || 0}
              onChange={(e) => handleAnswerChange(Number(e.target.value))}
              className="w-full h-2 bg-[var(--panel-2)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-sm text-[var(--muted)]">
              <span>${currentQuestion.min}</span>
              <span>${currentQuestion.max}</span>
            </div>
            <div className="text-center text-lg font-medium text-[var(--text)]">
              ${answers[currentQuestion.id] || 0}
            </div>
          </div>
        ) : null}

        <div className="flex justify-between mt-6 gap-3">
          <Button variant="outline" onClick={prevQuestion} disabled={currentStep === 0}>
            Back
          </Button>
          <Button onClick={nextQuestion} disabled={answers[currentQuestion.id] === undefined}>
            {currentStep === questions.length - 1 ? 'Show Recommendation' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
