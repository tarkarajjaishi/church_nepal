import { Suspense } from 'react';
import PublicLayout from '../public-layout';
import RoadmapVote from '@/components/roadmap-vote';

export const metadata = {
  title: 'Roadmap - Church Nepal',
  description: 'See what features we\'re working on next and vote on what matters most to you.',
};

const initialIdeas = [
  { id: '1', title: 'Mobile App', description: 'Native iOS and Android apps for better engagement.', votes: 12 },
  { id: '2', title: 'Multi-language Support', description: 'Support for local languages to reach more communities.', votes: 8 },
  { id: '3', title: 'Event Calendar Sync', description: 'Integrate with Google Calendar and Outlook for seamless scheduling.', votes: 15 },
  { id: '4', title: 'Advanced Analytics', description: 'Deeper insights into attendance, donations, and engagement.', votes: 5 },
  { id: '5', title: 'Volunteer Management', description: 'Streamlined tools for organizing volunteers and teams.', votes: 20 },
];

export default function RoadmapPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-[var(--bg)] py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--text-strong)] mb-4">Our Product Roadmap</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              See what we're building next. Vote for the features you want most, and suggest your own ideas!
            </p>
          </div>
          
          <Suspense fallback={<div className="text-center text-[var(--muted)] py-12">Loading roadmap...</div>}>
            <RoadmapVote initialIdeas={initialIdeas} />
          </Suspense>
        </div>
      </div>
    </PublicLayout>
  );
}
