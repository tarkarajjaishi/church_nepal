import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopicPage, { topicMetadata } from '@/components/topic-page';
import { FLAT_TOPICS, findTopic } from '@/lib/topics';

/**
 * Root-level topic pages: /worship, /bible-study, /prayer, /events, /youth …
 *
 * One dynamic segment rather than ten near-identical route files. Next gives
 * static routes precedence over a dynamic sibling, so /about and /pricing are
 * unaffected, and `dynamicParams = false` means anything not in FLAT_TOPICS
 * 404s instead of rendering an empty topic page for any URL a crawler invents.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return FLAT_TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ topic: string }> },
): Promise<Metadata> {
  const { topic } = await params;
  const t = findTopic(topic);
  return t ? topicMetadata(t) : {};
}

export default async function Page({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = findTopic(topic);
  if (!t) notFound();
  return <TopicPage topic={t} />;
}
