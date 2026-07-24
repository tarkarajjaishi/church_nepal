'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Event } from '@/types';

interface CalendarViewProps {
  events: Event[];
  selectedCategory: string | null;
}

export default function CalendarView({ events, selectedCategory }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Filter events by category if selected
  const filteredEvents = events.filter(event => {
    if (!selectedCategory) return true;
    return event.category === selectedCategory;
  });

  // Group events by day
  const eventsByDay: Record<number, Event[]> = {};
  filteredEvents.forEach(event => {
    const eventDate = new Date(event.date);
    const day = eventDate.getDate();
    if (!eventsByDay[day]) {
      eventsByDay[day] = [];
    }
    eventsByDay[day].push(event);
  });

  // Get first day of the month
  const firstDay = new Date(year, month, 1);
  const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: number[][] = [];
  let week: number[] = [];

  // Add empty days for the start of the month
  for (let i = 0; i < startingDay; i++) {
    week.push(0);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  // Fill remaining days of the last week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(0);
    }
    weeks.push(week);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center wrap gap-4">
        <h2 className="text-2xl font-bold">{monthNames[month]} {year}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className="btn btn-ghost hover:btn-active"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1))}
            className="btn btn-ghost hover:btn-active"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-box shadow">
        <div className="grid grid-cols-7 text-center font-bold bg-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day, dayIndex) => {
                const isToday = day === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();
                const dayEvents = eventsByDay[day] || [];

                return (
                  <div
                    key={dayIndex}
                    className={`border border-base-300 min-h-[80px] flex flex-col p-2 ${isToday ? 'border-primary' : ''} hover:bg-muted cursor-pointer`}
                  >
                    {day !== 0 && (
                      <>
                        <div className="font-bold text-right">{day}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          {dayEvents.map((ev, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                              <div className="truncate w-full max-w-xs" title={ev.title}>
                                {ev.title.length > 15 ? ev.title.substring(0, 15) + '...' : ev.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}