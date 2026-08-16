/**
 * Topic pages: services, ministries, denominations and events.
 *
 * These answer the questions people actually type ("where can I find Bible
 * study in Nepal", "Baptist church Nepal") that the place pages cannot — a
 * city page lists churches, it does not explain what a prayer meeting in
 * Nepal is like or when it happens.
 *
 * Deliberately NOT church-data-backed. There is no denomination or ministry
 * column on `churches`, so a page claiming to list "Baptist churches" would
 * list nothing, and a location page with no listings is the doorway page
 * Google penalises. These pages carry real content and link into the
 * directory instead of faking a filtered view of it.
 *
 * ponytail: no denomination/ministry column, so no filtered listings. When
 * churches self-report a denomination, add it to `churches` and give these
 * pages a real ItemList the way place-directory.tsx does.
 */

export type Faq = { q: string; a: string };

/** One <h2> and its paragraphs. Plain strings — no markdown parser needed. */
export type Section = { h2: string; body: string[] };

export type Cluster = 'service' | 'ministry' | 'denomination' | 'event';

export type Topic = {
  slug: string;
  cluster: Cluster;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  /** One sentence under the h1. Doubles as the AI-answer summary. */
  lede: string;
  sections: Section[];
  /** Rendered as visible text AND FAQPage schema. Google requires both. */
  faqs: Faq[];
};

/**
 * The fact that makes these pages worth reading.
 *
 * Nepal's weekly holiday is Saturday, so Nepali congregations gather on
 * Saturday, not Sunday — the opposite of what every "Sunday worship Nepal"
 * page assumes. Nepal moved to a two-day Saturday/Sunday weekend in April
 * 2026, so some churches now add a Sunday service, but Saturday is still the
 * main gathering. Any page that mentions service times must say this.
 */
export const SATURDAY_NOTE =
  'Most churches in Nepal hold their main worship service on Saturday, not Sunday, because Saturday is Nepal’s weekly holiday. Nepal moved to a two-day Saturday–Sunday weekend in April 2026, so some churches have added a Sunday service, but Saturday morning remains the main gathering for most congregations.';

import { SERVICE_TOPICS } from './topics/services';
import { MINISTRY_TOPICS } from './topics/ministries';
import { DENOMINATION_TOPICS } from './topics/denominations';
import { EVENT_TOPICS } from './topics/events';

export const TOPICS: Topic[] = [
  ...SERVICE_TOPICS,
  ...MINISTRY_TOPICS,
  ...DENOMINATION_TOPICS,
  ...EVENT_TOPICS,
];

/** Denominations live under /denominations/<slug>; everything else at the root. */
export function topicPath(t: Pick<Topic, 'slug' | 'cluster'>): string {
  return t.cluster === 'denomination' ? `/denominations/${t.slug}` : `/${t.slug}`;
}

export const DENOMINATIONS = TOPICS.filter((t) => t.cluster === 'denomination');

/** Root-level topics. The `[topic]` route accepts exactly these and 404s the rest. */
export const FLAT_TOPICS = TOPICS.filter((t) => t.cluster !== 'denomination');

export function findTopic(slug: string, cluster?: Cluster): Topic | undefined {
  return TOPICS.find(
    (t) => t.slug === slug && (cluster ? t.cluster === cluster : t.cluster !== 'denomination'),
  );
}

/** Siblings in the same cluster, for the cross-link block at the foot of a page. */
export function relatedTopics(t: Topic): Topic[] {
  return TOPICS.filter((o) => o.cluster === t.cluster && o.slug !== t.slug);
}
