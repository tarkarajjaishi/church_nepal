import type { Metadata } from 'next';
import PlaceDirectory, { placeMetadata } from '@/components/place-directory';

// Same as the English city pages: the church list only resolves inside the
// cluster, so building this statically freezes an empty list into the HTML.
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
): Promise<Metadata> {
  const { city } = await params;
  return placeMetadata('city', 'ne', city);
}

export default async function NeCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  return <PlaceDirectory kind="city" lang="ne" slug={city} />;
}
