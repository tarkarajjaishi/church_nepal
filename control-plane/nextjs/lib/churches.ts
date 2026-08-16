export type Church = {
  name: string;
  slug: string;
  subdomain: string;
  city?: string | null;
  district?: string | null;
  province?: string | null;
};

const API = process.env.NEXT_PUBLIC_CONTROL_API || '/api';

/**
 * Server-side base for the control API.
 *
 * NEXT_PUBLIC_CONTROL_API is "/api" so the browser stays same-origin, but a
 * relative URL has no host to resolve against on the server, so anything
 * rendering on the server has to name the in-cluster service.
 */
export function apiBase(): string {
  return API.startsWith('http') ? API : 'http://control-api:3100/api';
}

export async function getChurches(): Promise<Church[]> {
  try {
    const res = await fetch(`${apiBase()}/public/churches`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    // A directory missing its listings is recoverable; a 500 on the page is not.
    return [];
  }
}

/** URL-safe city key: "Kathmandu" -> "kathmandu", "Bharatpur " -> "bharatpur". */
export function citySlug(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, '-');
}

/** Title-cased display name recovered from a slug, for pages with no listings yet. */
export function cityLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Cities that get a page.
 *
 * The union of cities we actually have churches in and a fixed list of Nepal's
 * larger cities. The fixed list exists so the pages are reachable and coherent
 * before the directory fills up — each one says plainly when it has no
 * listings rather than implying churches exist there.
 */
export const SEED_CITIES = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Bharatpur',
  'Biratnagar', 'Dharan', 'Itahari', 'Butwal', 'Nepalgunj', 'Hetauda',
  'Birgunj', 'Dhangadhi', 'Janakpur',
] as const;

export function allCities(churches: Church[]): string[] {
  const seen = new Map<string, string>();
  for (const c of SEED_CITIES) seen.set(citySlug(c), c);
  for (const c of churches) {
    if (c.city?.trim()) seen.set(citySlug(c.city), c.city.trim());
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function churchesInCity(churches: Church[], slug: string): Church[] {
  return churches.filter((c) => c.city && citySlug(c.city) === slug);
}

/** URL-safe key shared by city, district and province routes. */
export const slugify = citySlug;

/**
 * Nepal's seven provinces, fixed.
 *
 * A province page is only meaningful if the whole set exists — a visitor who
 * lands on Karnali and finds no page assumes the site is broken, not that the
 * directory has no church there yet.
 */
export const PROVINCES = [
  'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim',
] as const;

/** Districts we can name today: the seed cities' districts plus any in the data. */
export const SEED_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski', 'Chitwan', 'Morang', 'Sunsari',
  'Rupandehi', 'Banke', 'Makwanpur', 'Parsa', 'Kailali', 'Dhanusha',
] as const;

function unionBy(fixed: readonly string[], fromData: (string | null | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const v of fixed) seen.set(slugify(v), v);
  for (const v of fromData) if (v?.trim()) seen.set(slugify(v), v.trim());
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function allDistricts(churches: Church[]): string[] {
  return unionBy(SEED_DISTRICTS, churches.map((c) => c.district));
}

export function allProvinces(churches: Church[]): string[] {
  return unionBy(PROVINCES, churches.map((c) => c.province));
}

export function churchesInDistrict(churches: Church[], slug: string): Church[] {
  return churches.filter((c) => c.district && slugify(c.district) === slug);
}

export function churchesInProvince(churches: Church[], slug: string): Church[] {
  return churches.filter((c) => c.province && slugify(c.province) === slug);
}

/**
 * Nepali place names.
 *
 * Transliterating a place name algorithmically produces spellings no Nepali
 * reader would type, so the mapping is explicit and only covers names we can
 * state confidently. Anything absent falls back to the English form rather
 * than a guess — a wrong Devanagari spelling is worse than a familiar Latin one.
 */
const NE_PLACES: Record<string, string> = {
  kathmandu: 'काठमाडौं', lalitpur: 'ललितपुर', bhaktapur: 'भक्तपुर',
  pokhara: 'पोखरा', chitwan: 'चितवन', bharatpur: 'भरतपुर',
  biratnagar: 'विराटनगर', dharan: 'धरान', itahari: 'इटहरी',
  butwal: 'बुटवल', nepalgunj: 'नेपालगन्ज', hetauda: 'हेटौडा',
  birgunj: 'वीरगन्ज', dhangadhi: 'धनगढी', janakpur: 'जनकपुर',
  kaski: 'कास्की', morang: 'मोरङ', sunsari: 'सुनसरी', rupandehi: 'रुपन्देही',
  banke: 'बाँके', makwanpur: 'मकवानपुर', parsa: 'पर्सा', kailali: 'कैलाली',
  dhanusha: 'धनुषा',
  koshi: 'कोशी', madhesh: 'मधेश', bagmati: 'बागमती', gandaki: 'गण्डकी',
  lumbini: 'लुम्बिनी', karnali: 'कर्णाली', sudurpashchim: 'सुदूरपश्चिम',
};

export function nePlace(name: string): string {
  return NE_PLACES[slugify(name)] ?? name;
}
