'use client';

import { useState } from 'react';
import PublicLayout from '@/public-layout';

// Define types for our courses and lessons
type Lesson = {
  id: string;
  title: string;
  duration: string;
};

type Course = {
  id: string;
  title: string;
  description: string;
  lessonsCount: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
};

// Mock data for courses
const mockCourses: Course[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Church Nepal',
    description: 'Learn the basics of setting up and managing your church website.',
    lessonsCount: 5,
    duration: '1h 30m',
    level: 'Beginner',
  },
  {
    id: 'content-management',
    title: 'Content Management Mastery',
    description: 'Master how to create and manage content effectively.',
    lessonsCount: 7,
    duration: '2h 15m',
    level: 'Intermediate',
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features & Customization',
    description: 'Dive deep into advanced features and customization options.',
    lessonsCount: 6,
    duration: '2h',
    level: 'Advanced',
  },
];

export default function AcademyPage() {
  return (
    <PublicLayout>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--text)] sm:text-4xl md:text-5xl">
            Academy
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Learn how to manage and grow your church website with our comprehensive courses.
          </p>
        </div>

        <CourseGrid courses={mockCourses} />
      </div>
    </PublicLayout>
  );
}

function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const [progress, setProgress] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`course-${course.id}-progress`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Calculate percentage
  const percentage = Math.round((progress / course.lessonsCount) * 100);

  return (
    <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex flex-col h-full">
      <div className="mb-4">
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-[var(--accent-soft)] text-[var(--text)] rounded-full">
          {course.level}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-[var(--text)]">{course.title}</h3>
      <p className="mt-2 text-[var(--muted)] flex-grow">{course.description}</p>
      
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-[var(--muted)]">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {course.duration}
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          {course.lessonsCount} lessons
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {percentage}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full bg-[var(--panel-2)] rounded-full h-2.5">
        <div 
          className="bg-[var(--accent)] h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <a 
        href={`/academy/${course.id}`} 
        className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-2)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
      >
        Start Learning
      </a>
    </div>
  );
}
