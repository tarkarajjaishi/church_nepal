import type { Metadata } from 'next';
import PlaceDirectory, { placeMetadata } from '@/components/place-directory';

// Same as the city pages: the church list only resolves inside the cluster, so
// building this statically freezes an empty list into the HTML.
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ district: string }> },
): Promise<Metadata> {
  const { district } = await params;
  return placeMetadata('district', 'en', district);
}

export default async function DistrictPage({ params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  return <PlaceDirectory kind="district" lang="en" slug={district} />;
}
