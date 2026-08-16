import type { Metadata } from 'next';
import PlaceDirectory, { placeMetadata } from '@/components/place-directory';

// Same as the city pages: the church list only resolves inside the cluster, so
// building this statically freezes an empty list into the HTML.
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ province: string }> },
): Promise<Metadata> {
  const { province } = await params;
  return placeMetadata('province', 'en', province);
}

export default async function ProvincePage({ params }: { params: Promise<{ province: string }> }) {
  const { province } = await params;
  return <PlaceDirectory kind="province" lang="en" slug={province} />;
}
