import { NextResponse } from 'next/server';
import { fetchTenant } from '@/lib/serverApi';
import { generateICalFeed } from '@/lib/ical';
import type { ChurchEvent } from '@/lib/hooks/events';

export const dynamic = 'force-dynamic';

/**
 * iCal feed of this church's events.
 *
 * Uses fetchTenant rather than the axios client: this runs on the server, where
 * the browser's hostname is not available, and the church API picks its
 * database from the Host header. The axios path sent no Host and so asked the
 * wrong tenant — the route answered 500 "Error generating calendar" for every
 * church. It also read the response as a bare array when list endpoints wrap
 * results in `{ data: [...] }`; fetchTenant unwraps that.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const events = (await fetchTenant<ChurchEvent[]>('/api/events')) ?? [];
    const filtered = category
      ? events.filter((e) => e.category === category)
      : events;

    return new Response(generateICalFeed(filtered), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="church-events.ics"',
      },
    });
  } catch (error) {
    console.error('Failed to generate iCal feed:', error);
    return new Response('Error generating calendar', { status: 500 });
  }
}
