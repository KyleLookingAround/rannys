/**
 * Ranny's — build-time helpers shared by the layout and pages.
 * (Ported from the old build.mjs: hours parsing, map URLs, JSON-LD.)
 */
import { getEntry } from 'astro:content';

export async function getSettings() {
  const entry = await getEntry('settings', 'main');
  if (!entry) throw new Error('content/settings.yml is missing');
  return entry.data;
}
type Settings = Awaited<ReturnType<typeof getSettings>>;

export function fullAddress(s: Settings) {
  return [s.street, s.locality, s.postcode].filter(Boolean).join(', ');
}

export function mapEmbedUrl(s: Settings) {
  const q = encodeURIComponent(fullAddress(s));
  return `https://maps.google.com/maps?q=${q}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
}

export function directionsUrl(s: Settings) {
  const q = encodeURIComponent(fullAddress(s));
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

/** Social-share image as the absolute URL that WhatsApp/Twitter need. */
export function ogImage(s: Settings) {
  return s.url + s.previewImage.replace(/^\.?\//, '');
}

/**
 * Opening hours → the machine-readable map the client script uses for the
 * live "open now / closed" status. Parses the Google format ("Tu-Fr
 * 07:00-16:00") into { 0..6: [[openMins, closeMins], …] }, Sun=0.
 */
const DAY_IDX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

export function hoursData(s: Settings) {
  const days: Record<number, [number, number][]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const line of s.openingHours) {
    const m = /^([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(line.trim());
    if (!m) continue;
    const [, d1, d2, oh, om, ch, cm] = m;
    const open = +oh * 60 + +om;
    const close = +ch * 60 + +cm;
    const start = DAY_IDX[d1];
    if (start == null) continue;
    const end = d2 != null ? DAY_IDX[d2] : start;
    for (let i = start; ; i = (i + 1) % 7) {
      days[i].push([open, close]);
      if (i === end) break;
    }
  }
  return { tz: 'Europe/London', days };
}

/** LocalBusiness structured data (helps Google Search & Maps). */
export function jsonLd(s: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: s.name,
    description: s.description,
    url: s.url,
    email: s.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.street,
      addressLocality: s.locality,
      addressRegion: s.region,
      postalCode: s.postcode,
      addressCountry: s.country,
    },
    areaServed: s.locality,
    ...(s.openingHours.length ? { openingHours: s.openingHours } : {}),
    servesCuisine: ['Coffee', 'Cake', 'Bakery'],
    ...(s.priceRange ? { priceRange: s.priceRange } : {}),
    sameAs: [s.instagram, s.facebook].filter(Boolean),
  };
}

/** Event date → the day/month pill + ISO date used to fade past events. */
const EV_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function eventPill(date: string) {
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d.getTime())) return { day: '', month: '', dateISO: '' };
  return { day: String(d.getDate()), month: EV_MONTHS[d.getMonth()], dateISO: date };
}
