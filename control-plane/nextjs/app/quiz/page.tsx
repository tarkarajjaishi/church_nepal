import { Metadata } from 'next';
import PublicLayout from '../public-layout';
import PlanQuiz from '@/components/plan-quiz';

export const metadata: Metadata = {
  title: 'Plan Recommendation Quiz | Church Nepal',
  description: 'Take our quick quiz to find the perfect plan for your church.',
};

export default function QuizPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-strong)] mb-4">
              Find Your Perfect Plan
            </h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Answer a few questions about your church and we'll recommend the best plan for your needs.
            </p>
          </div>
          
          <PlanQuiz />
        </div>
      </div>
    </PublicLayout>
  );
}
