import { request as httpRequest } from 'node:http';

/**
 * Read one church's public data from the church API.
 *
 * The control plane knows a church's name and location; everything a visitor
 * actually wants — when it meets, where it is, how to phone it — lives in that
 * church's own database, reachable only through the church API keyed by Host.
 *
 * `fetch` cannot do this: Host is a forbidden header in the Fetch spec, so
 * undici drops it and sends the connection target instead, which arrives as
 * tenant "church-api" and 404s. The stdlib client honours the header.
 */

const CHURCH_API = process.env.CHURCH_API_INTERNAL_ORIGIN || 'http://church-api:3002';

// A profile page is better off missing a section than slow. Every fetch here
// is one of several on the page and all of them are optional.
const TIMEOUT_MS = 2000;

export type ServiceTime = {
  name: string; name_ne?: string; day: string; time: string;
  enabled?: boolean | null; sort_order?: number | null;
};

export type ContactInfo = {
  address: string; phone: string; email: string; hours: string; map_url: string;
};

export type Ministry = { id: string; name: string; description?: string | null };

function getJson<T>(path: string, hostHeader: string): Promise<T | null> {
  return new Promise((resolve) => {
    let url: URL;
    try {
      url = new URL(`${CHURCH_API}${path}`);
    } catch {
      return resolve(null);
    }
    const req = httpRequest(
      {
        host: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        headers: { Host: hostHeader, Accept: 'application/json' },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          res.resume();
          return resolve(null);
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body) as T);
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.end();
  });
}

/**
 * Some list endpoints return a bare array and some return a paginated
 * envelope. Guessing wrong renders an empty section on a page that has data.
 */
function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    for (const key of ['data', 'items', 'results']) {
      const v = (payload as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

export type ChurchPublicData = {
  serviceTimes: ServiceTime[];
  contact: ContactInfo | null;
  ministries: Ministry[];
};

export async function getChurchPublicData(subdomain: string): Promise<ChurchPublicData> {
  const [times, contact, ministries] = await Promise.all([
    getJson<unknown>('/api/service-times', subdomain),
    getJson<unknown>('/api/contact-info', subdomain),
    getJson<unknown>('/api/ministries', subdomain),
  ]);

  return {
    serviceTimes: asList<ServiceTime>(times)
      .filter((t) => t.enabled !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    // /contact-info is a collection even though a church has one; take the first.
    contact: asList<ContactInfo>(contact)[0] ?? null,
    ministries: asList<Ministry>(ministries).slice(0, 12),
  };
}

/** Weekday names as schema.org wants them, from whatever the church typed. */
export function schemaDay(day: string): string | null {
  const d = day.trim().toLowerCase().slice(0, 3);
  const map: Record<string, string> = {
    sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
    thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
    // Nepali weekday names as they are entered on the church sites.
    आइत: 'Sunday', सोम: 'Monday', मङ्ग: 'Tuesday', बुध: 'Wednesday',
    बिह: 'Thursday', शुक: 'Friday', शनि: 'Saturday',
  };
  return map[d] ?? map[day.trim().slice(0, 3)] ?? null;
}
