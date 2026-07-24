import { Event } from '@/types';

// iCal generator for a single event (returns VEVENT block only)
export function generateICal(event: Event): string {
  const start = new Date(event.date);
  const end = new Date(event.date);
  // Assume event lasts 2 hours if no end time provided
  end.setHours(end.getHours() + 2);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[:-]/g, '').split('.')[0]; // YYYYMMDDTHHMMSS
  };

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const uid = `${event.id}@church_nepal`;
  // Escape commas, semicolons, and newlines per iCal spec
  const description = `${event.description.replace(/[,;\n]/g, '\\$&')}\\nLocation: ${event.location.replace(/[,;\n]/g, '\\$&')}`;
  const summary = event.title.replace(/[,;\n]/g, '\\$&');
  const location = event.location.replace(/[,;\n]/g, '\\$&');

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
  ];

  return lines.join('\r\n');
}

// Generate a full iCal feed with multiple events
export function generateICalFeed(events: Event[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Church Nepal//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Church Nepal Events',
    'X-WR-TIMEZONE:Asia/Kathmandu',
  ];

  events.forEach(event => {
    lines.push(generateICal(event));
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}