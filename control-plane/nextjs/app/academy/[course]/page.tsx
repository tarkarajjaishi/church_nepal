'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PublicLayout from '@/public-layout';

// Define types for our lessons
type Lesson = {
  id: string;
  title: string;
  type: 'video' | 'article'; // Determines whether to show a video player or article content
  duration: string;
};

// Mock data for lessons based on course ID
const getLessonsForCourse = (courseId: string): Lesson[] => {
  switch (courseId) {
    case 'getting-started':
      return [
        { id: 'lesson-1', title: 'Introduction to Church Nepal', type: 'video', duration: '15m' },
        { id: 'lesson-2', title: 'Setting Up Your Profile', type: 'video', duration: '20m' },
        { id: 'lesson-3', title: 'Navigating the Dashboard', type: 'article', duration: '10m' },
        { id: 'lesson-4', title: 'Managing Your Content', type: 'video', duration: '25m' },
        { id: 'lesson-5', title: 'Best Practices', type: 'article', duration: '15m' },
      ];
    case 'content-management':
      return [
        { id: 'lesson-1', title: 'Creating Blog Posts', type: 'video', duration: '20m' },
        { id: 'lesson-2', title: 'Adding Events', type: 'article', duration: '15m' },
        { id: 'lesson-3', title: 'Managing Images & Media', type: 'video', duration: '22m' },
        { id: 'lesson-4', title: 'Customizing Layouts', type: 'video', duration: '18m' },
        { id: 'lesson-5', title: 'SEO Basics', type: 'article', duration: '25m' },
        { id: 'lesson-6', title: 'Using Templates', type: 'video', duration: '20m' },
        { id: 'lesson-7', title: 'Review & Publish', type: 'article', duration: '10m' },
      ];
    case 'advanced-features':
      return [
        { id: 'lesson-1', title: 'Custom Code Integration', type: 'article', duration: '30m' },
        { id: 'lesson-2', title: 'API Usage', type: 'video', duration: '25m' },
        { id: 'lesson-3', title: 'Advanced Analytics', type: 'video', duration: '20m' },
        { id: 'lesson-4', title: 'Member Management', type: 'article', duration: '25m' },
        { id: 'lesson-5', title: 'Donation Systems', type: 'video', duration: '30m' },
        { id: 'lesson-6', title: 'Integration with Other Tools', type: 'article', duration: '20m' },
      ];
    default:
      return [];
  }
};

export default function CoursePage() {
  const { course } = useParams<{ course: string }>();
  const lessons = getLessonsForCourse(course);
  
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  // Load completed lessons from localStorage on initial render
  useEffect(() => {
    const saved = localStorage.getItem(`course-${course}-completed`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedLessons(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse completed lessons from localStorage');
      }
    }
  }, [course]);

  // Update localStorage when completedLessons changes
  useEffect(() => {
    localStorage.setItem(`course-${course}-completed`, JSON.stringify([...completedLessons]));
    
    // Also update the overall course progress
    const totalLessons = lessons.length;
    const completedCount = completedLessons.size;
    localStorage.setItem(`course-${course}-progress`, completedCount.toString());
  }, [completedLessons, course, lessons.length]);

  const toggleLessonCompletion = (lessonId: string) => {
    const newCompleted = new Set(completedLessons);
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    setCompletedLessons(newCompleted);
  };

  const handleLessonSelect = (index: number) => {
    setCurrentLessonIndex(index);
  };

  const currentLesson = lessons[currentLessonIndex];
  if (!currentLesson) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[var(--text)]">Course Not Found</h1>
            <p className="mt-4 text-lg text-[var(--muted)]">The requested course does not exist.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with lesson list */}
          <div className="lg:w-1/3">
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Lessons</h2>
            
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <div 
                  key={lesson.id}
                  onClick={() => handleLessonSelect(index)}
                  className={`cursor-pointer p-3 rounded-lg transition-colors ${
                    index === currentLessonIndex 
                      ? 'bg-[var(--panel-2)] border border-[var(--border)]' 
                      : 'hover:bg-[var(--panel-2)]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {lesson.type === 'video' ? (
                        <svg className="w-5 h-5 mr-2 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-2 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      )}
                      <span className="font-medium text-[var(--text)]">{lesson.title}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-[var(--muted)]">{lesson.duration}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLessonCompletion(lesson.id);
                        }}
                        className={`ml-2 w-6 h-6 rounded-full border flex items-center justify-center ${
                          completedLessons.has(lesson.id)
                            ? 'bg-[var(--good)] border-[var(--good)]'
                            : 'border-[var(--border)]'
                        }`}
                      >
                        {completedLessons.has(lesson.id) && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:w-2/3">
            <div className="card bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6">
              <h1 className="text-2xl font-bold text-[var(--text)] mb-2">{currentLesson.title}</h1>
              
              <div className="flex items-center text-sm text-[var(--muted)] mb-6">
                <span>{currentLesson.duration}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{currentLesson.type}</span>
              </div>

              {/* Video or Article Placeholder */}
              <div className="mb-6">
                {currentLesson.type === 'video' ? (
                  <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p className="mt-2 text-[var(--muted)]">Video Player Placeholder</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-[var(--muted)]">This is where the article content would appear.</p>
                    <div className="mt-4 space-y-4">
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.</p>
                      <p>Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum.</p>
                      <p>Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor. Suspendisse dictum feugiat nisl ut dapibus.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mark Complete Button */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => toggleLessonCompletion(currentLesson.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    completedLessons.has(currentLesson.id)
                      ? 'bg-[var(--good-soft)] text-[var(--good)] border border-[var(--good)]'
                      : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]'
                  }`}
                >
                  {completedLessons.has(currentLesson.id) ? 'Mark as Incomplete' : 'Mark Complete'}
                </button>

                <div className="text-sm text-[var(--muted)]">
                  {completedLessons.size} of {lessons.length} lessons completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
