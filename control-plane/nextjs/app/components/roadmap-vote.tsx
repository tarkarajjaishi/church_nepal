'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Idea {
  id: string;
  title: string;
  description: string;
  votes: number;
}

interface IdeaWithVoted extends Idea {
  voted: boolean;
}

interface FormData {
  name: string;
  email: string;
  idea: string;
}

export default function RoadmapVote({ initialIdeas }: { initialIdeas: Idea[] }) {
  const [ideas, setIdeas] = useState<IdeaWithVoted[]>(() => {
    if (typeof window !== 'undefined') {
      const savedVotes = localStorage.getItem('roadmap-votes');
      const parsedVotes = savedVotes ? JSON.parse(savedVotes) : {};
      
      return initialIdeas.map(idea => ({
        ...idea,
        voted: !!parsedVotes[idea.id]
      }));
    }
    return initialIdeas.map(idea => ({ ...idea, voted: false }));
  });
  
  const [sortByVotes, setSortByVotes] = useState(false);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', idea: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Persist votes to localStorage
  useEffect(() => {
    const votes: Record<string, boolean> = {};
    ideas.forEach(idea => {
      votes[idea.id] = idea.voted;
    });
    localStorage.setItem('roadmap-votes', JSON.stringify(votes));
  }, [ideas]);

  const handleVote = (id: string) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === id 
        ? { ...idea, voted: true, votes: idea.voted ? idea.votes : idea.votes + 1 } 
        : idea
    ));
  };

  const handleSubmitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', idea: '' });
      setIsSubmitting(false);
    }, 500);
  };

  const resetForm = () => {
    setSubmitted(false);
  };

  // Sort ideas based on votes if toggle is active
  const sortedIdeas = sortByVotes 
    ? [...ideas].sort((a, b) => b.votes - a.votes) 
    : [...ideas];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[var(--text-strong)]">Feature Ideas</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSortByVotes(!sortByVotes)}
            className="bg-[var(--panel)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]"
          >
            {sortByVotes ? 'Sort by New' : 'Sort by Votes'}
          </Button>
        </div>
        
        <div className="space-y-4">
          {sortedIdeas.map((idea) => (
            <Card key={idea.id} className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex flex-col items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => !idea.voted && handleVote(idea.id)}
                    disabled={idea.voted}
                    className={`w-10 h-10 rounded-full flex items-center justify-center p-0 ${
                      idea.voted 
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)] cursor-default' 
                        : 'bg-[var(--panel-2)] border-[var(--border-soft)] hover:bg-[var(--panel-3)]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                  </Button>
                  <span className="mt-1 text-sm font-medium text-[var(--text-strong)]">{idea.votes}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-strong)] text-lg">{idea.title}</h3>
                  <p className="text-[var(--muted)] mt-1">{idea.description}</p>
                  
                  {idea.voted && (
                    <Badge variant="secondary" className="mt-3 bg-[var(--accent-soft)] text-[var(--accent)]">
                      Voted ✓
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div>
        <Card className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 sticky top-6">
          <h3 className="text-xl font-semibold text-[var(--text-strong)] mb-4">Suggest a Feature</h3>
          
          {submitted ? (
            <div className="py-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--good-soft)] mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--good)]">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-[var(--text-strong)] mb-2">Thank You!</h4>
              <p className="text-[var(--muted)]">
                Your suggestion has been received. We appreciate your input in helping us improve!
              </p>
              <Button 
                onClick={resetForm}
                className="mt-4 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
              >
                Submit Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSuggestion}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--text)] mb-1">Name</label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)]"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-1">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="bg-[var(--panel-2)] border-[var(--border-soft)] text-[var(--text)]"
                  />
                </div>
                
                <div>
                  <label htmlFor="idea" className="block text-sm font-medium text-[var(--text)] mb-1">Idea</label>
                  <textarea
                    id="idea"
                    rows={4}
                    placeholder="Describe your feature idea..."
                    value={formData.idea}
                    onChange={(e) => setFormData({...formData, idea: e.target.value})}
                    required
                    className="w-full resize-none bg-[var(--panel-2)] border border-[var(--border-soft)] rounded-md px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Idea'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
