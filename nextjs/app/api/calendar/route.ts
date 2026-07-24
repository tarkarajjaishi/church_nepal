import { api } from '@/lib/admin/api';
import { API_ORIGIN } from '@/lib/apiBase';
import { NextResponse } from 'next/server';
import { generateICalFeed } from '@/lib/ical';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Fetch events from the backend API
    const { data } = await api.get(`/events`, {
      params: {
        limit: 1000, // Get all events (adjust if needed)
      },
    });

    // Filter by category if provided
    let events = data;
    if (category) {
      events = data.filter((event: any) => event.category === category);
    }

    // Generate iCal feed
    const icalContent = generateICalFeed(events);

    return new Response(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to generate iCal feed:', error);
    return new Response('Error generating calendar', { status: 500 });
  }
}