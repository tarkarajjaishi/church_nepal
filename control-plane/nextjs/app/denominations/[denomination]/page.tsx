import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopicPage, { topicMetadata } from '@/components/topic-page';
import { DENOMINATIONS, findTopic } from '@/lib/topics';

export const dynamicParams = false;

export function generateStaticParams() {
  return DENOMINATIONS.map((t) => ({ denomination: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ denomination: string }> },
): Promise<Metadata> {
  const { denomination } = await params;
  const t = findTopic(denomination, 'denomination');
  return t ? topicMetadata(t) : {};
}

export default async function Page({ params }: { params: Promise<{ denomination: string }> }) {
  const { denomination } = await params;
  const t = findTopic(denomination, 'denomination');
  if (!t) notFound();
  return <TopicPage topic={t} />;
}
