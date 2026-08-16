import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PlaceDirectory, { placeMetadata } from '@/components/place-directory';

// Rendered per request, not at build.
//
// These pages read the church list from the control API, which only exists
// inside the cluster — at build time on a CI runner the fetch fails, and with
// static generation that empty result is what gets frozen into the HTML. The
// directory shipped saying "being populated" and every city page said "No
// churches in ...", which is the exact failure this content was added to avoid.
// The underlying fetch still caches for an hour, so this costs a render, not a
// round trip per visitor.
export const dynamic = 'force-dynamic';

// `/churches/district` and `/churches/province` are the parents of the
// district and province routes. Without this they match [city] and render a
// straight-faced "Churches in District" page.
const RESERVED = new Set(['district', 'province']);

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
): Promise<Metadata> {
  const { city } = await params;
  if (RESERVED.has(city)) return {};
  return placeMetadata('city', 'en', city);
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  if (RESERVED.has(city)) notFound();
  return <PlaceDirectory kind="city" lang="en" slug={city} />;
}
