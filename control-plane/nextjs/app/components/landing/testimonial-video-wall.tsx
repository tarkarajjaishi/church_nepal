'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

type TestimonialType = 'quote' | 'video';
type Category = 'faith' | 'community' | 'growth' | 'service';

interface Testimonial {
  id: string;
  type: TestimonialType;
  content: string;
  author: string;
  role?: string;
  churchName: string;
  category: Category[];
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    type: 'quote',
    content: 'Churchnepal has transformed how we connect with our congregation. The tools are intuitive and the support is exceptional.',
    author: 'Pastor Rajesh Sharma',
    role: 'Senior Pastor',
    churchName: 'Grace Community Church',
    category: ['faith', 'community'],
  },
  {
    id: '2',
    type: 'video',
    content: 'Hear how New Life Fellowship used Churchnepal to engage their members during challenging times.',
    author: 'Sarah Karki',
    role: 'Minister of Communications',
    churchName: 'New Life Fellowship',
    category: ['growth', 'community'],
  },
  {
    id: '3',
    type: 'quote',
    content: 'Our online giving increased by 40% after switching to Churchnepal. The platform just works seamlessly.',
    author: 'David Lama',
    role: 'Finance Director',
    churchName: 'Himalayan Hope Church',
    category: ['service'],
  },
  {
    id: '4',
    type: 'video',
    content: 'Watch how St. Mary\'s Cathedral manages their events and volunteers with our tools.',
    author: 'Maria Gurung',
    role: 'Event Coordinator',
    churchName: 'St. Mary\'s Cathedral',
    category: ['community', 'service'],
  },
  {
    id: '5',
    type: 'quote',
    content: 'The multilingual support was a game-changer for our diverse congregation. Truly built for Nepal.',
    author: 'Michael Thapa',
    role: 'IT Administrator',
    churchName: 'Kathmandu International Church',
    category: ['faith', 'growth'],
  },
  {
    id: '6',
    type: 'video',
    content: 'Learn how Riverside Church improved their member engagement with our CRM features.',
    author: 'Priya Magar',
    role: 'Membership Coordinator',
    churchName: 'Riverside Church',
    category: ['community', 'growth'],
  },
];

const logos = [
  { name: 'Grace Community', initials: 'GC' },
  { name: 'New Life Fellowship', initials: 'NLF' },
  { name: 'Himalayan Hope', initials: 'HH' },
  { name: 'St. Mary\'s', initials: 'SM' },
  { name: 'Kathmandu Intl', initials: 'KI' },
  { name: 'Riverside', initials: 'RC' },
];

const categories = [
  { id: 'all', label: 'All Stories' },
  { id: 'faith', label: 'Faith Journeys' },
  { id: 'community', label: 'Community Impact' },
  { id: 'growth', label: 'Growth & Outreach' },
  { id: 'service', label: 'Service & Giving' },
];

export default function TestimonialVideoWall() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const filteredTestimonials = selectedCategory === 'all'
    ? testimonials
    : testimonials.filter(t => t.category.includes(selectedCategory as Category));

  const openVideoModal = (id: string) => {
    setCurrentVideoId(id);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setCurrentVideoId(null);
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--panel-2)] text-[var(--text)] hover:bg-[var(--panel-3)]'
            }`}
            aria-pressed={selectedCategory === category.id}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Testimonial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredTestimonials.map((testimonial) => (
          <Card 
            key={testimonial.id} 
            className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex flex-col h-full"
          >
            {testimonial.type === 'quote' ? (
              <>
                <div className="text-[var(--accent)] text-3xl mb-2">“</div>
                <p className="text-[var(--text)] mb-4 flex-grow">{testimonial.content}</p>
                <div className="mt-auto pt-4 border-t border-[var(--border-soft)]">
                  <p className="font-semibold text-[var(--text-strong)]">{testimonial.author}</p>
                  {testimonial.role && <p className="text-sm text-[var(--muted)]">{testimonial.role}</p>}
                  <p className="text-xs text-[var(--muted)] mt-1">{testimonial.churchName}</p>
                </div>
              </>
            ) : (
              <>
                <div 
                  className="relative bg-[var(--panel-2)] rounded-lg overflow-hidden cursor-pointer group flex-grow flex items-center justify-center min-h-[160px]"
                  onClick={() => openVideoModal(testimonial.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openVideoModal(testimonial.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Play video testimonial from ${testimonial.author}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-soft)]/20 to-[var(--accent-2)]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[var(--text)] text-sm mb-2">{testimonial.content}</p>
                  <div>
                    <p className="font-semibold text-[var(--text-strong)] text-sm">{testimonial.author}</p>
                    {testimonial.role && <p className="text-xs text-[var(--muted)]">{testimonial.role}</p>}
                    <p className="text-xs text-[var(--muted)] mt-1">{testimonial.churchName}</p>
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Logo Wall */}
      <div className="mt-16 max-w-4xl mx-auto">
        <p className="text-center text-[var(--muted)] mb-8">Trusted by churches across Nepal</p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
          {logos.map((logo, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center w-16 h-16 rounded-lg bg-[var(--panel-2)] text-[var(--text)] font-bold"
              aria-label={logo.name}
            >
              {logo.initials}
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeVideoModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeVideoModal();
          }}
          tabIndex={-1}
        >
          <div 
            className="relative bg-[var(--panel)] rounded-xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--panel-2)] text-[var(--text)] hover:bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] z-10"
              onClick={closeVideoModal}
              aria-label="Close video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="aspect-video bg-[var(--panel-2)] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--accent)] mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--text-strong)] mb-2">Testimonial Video</h3>
                <p className="text-[var(--text)]">
                  {testimonials.find(t => t.id === currentVideoId)?.content}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[var(--border)]">
              <p className="font-semibold text-[var(--text-strong)]">
                {testimonials.find(t => t.id === currentVideoId)?.author}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {testimonials.find(t => t.id === currentVideoId)?.role},{' '}
                {testimonials.find(t => t.id === currentVideoId)?.churchName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
