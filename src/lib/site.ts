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

// ── Opening hours ────────────────────────────────────────────────────
// Everything hours-related derives from the single structured `hours` field
// (see the schema): the display table, the live open/closed pill, and the
// Google (schema.org) hours. Sun=0 to match JS getDay().
const DAY_IDX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_SHORT: Record<string, string> = { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' };
type HoursRow = Settings['hours'][number];

/** "07:00" → "7am", "16:00" → "4pm", "10:30" → "10:30am". */
function prettyTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ap = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ap}` : `${h12}:${String(m).padStart(2, '0')}${ap}`;
}

/** The rows shown in the on-page hours table: friendly day + time labels. */
export function hoursRows(s: Settings) {
  return s.hours.map((r) => ({
    day: r.toDay && r.toDay !== r.fromDay
      ? `${DAY_SHORT[r.fromDay]} – ${DAY_SHORT[r.toDay]}`
      : DAY_SHORT[r.fromDay],
    time: r.closed ? 'Closed' : `${prettyTime(r.open)} – ${prettyTime(r.close)}`,
  }));
}

/** The Google/schema.org format, e.g. ["Tu-Fr 07:00-16:00", "Sa 09:00-15:00"]. */
export function openingHoursList(s: Settings) {
  return s.hours
    .filter((r): r is HoursRow & { open: string; close: string } => !r.closed && !!r.open && !!r.close)
    .map((r) => `${r.fromDay}${r.toDay && r.toDay !== r.fromDay ? '-' + r.toDay : ''} ${r.open}-${r.close}`);
}

/**
 * The machine-readable map the client script uses for the live "open now /
 * closed" pill: { 0..6: [[openMins, closeMins], …] }, Sun=0.
 */
export function hoursData(s: Settings) {
  const days: Record<number, [number, number][]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const r of s.hours) {
    if (r.closed || !r.open || !r.close) continue;
    const [oh, om] = r.open.split(':').map(Number);
    const [ch, cm] = r.close.split(':').map(Number);
    const open = oh * 60 + om;
    const close = ch * 60 + cm;
    const start = DAY_IDX[r.fromDay];
    if (start == null) continue;
    const end = r.toDay ? DAY_IDX[r.toDay] : start;
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
    ...((list) => (list.length ? { openingHours: list } : {}))(openingHoursList(s)),
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
