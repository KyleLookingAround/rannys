/**
 * Ranny's — content collections.
 *
 * Each YAML file in /content is one collection with a single entry ("main"),
 * validated against a schema below at build time. A bad edit (missing field,
 * broken indentation, wrong type) fails the build with a clear message —
 * the previously deployed site stays live, so a mistake never ships.
 */
import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';
import { load, CORE_SCHEMA } from 'js-yaml';

// Wrap a whole YAML file as one entry so `getEntry(name, 'main')` returns it.
// CORE_SCHEMA keeps unquoted dates as plain strings (the default schema turns
// "date: 2026-06-30" into a Date object, which is what the /admin editor
// writes and would fail the string schemas below).
const single = (path: string) =>
  file(path, { parser: (text) => [{ id: 'main', ...(load(text, { schema: CORE_SCHEMA }) as Record<string, unknown>) }] });

// Image paths are stored as "/assets/…" (the form the /admin editor writes)
// and normalised to the relative "./assets/…" the pages need — every built
// page sits at the site root, so relative paths work directly on the
// rannys.co.uk domain.
const image = z.string()
  .regex(/^\/assets\//, 'image paths start with /assets/')
  .transform((path) => `.${path}`);

// Two-letter day codes (the /admin editor shows full day names but stores
// these) and 24-hour HH:MM times — the building blocks of the hours field.
const DAY = z.enum(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'use 24-hour time, e.g. 07:00');

const settings = defineCollection({
  loader: single('content/settings.yml'),
  schema: z.object({
    url: z.string().url(),
    name: z.string().min(1),
    description: z.string().min(1),
    priceRange: z.string(),
    street: z.string().min(1),
    locality: z.string().min(1),
    region: z.string(),
    postcode: z.string().min(1),
    country: z.string().default('GB'),
    email: z.string().email(),
    instagramHandle: z.string(),
    instagram: z.string().url(),
    facebook: z.string().url(),
    previewImage: image,
    statusShort: z.string(),
    hoursShort: z.string(),
    // One structured source of truth for opening hours. Editors pick days
    // from a dropdown and type 24-hour times; the display table, the live
    // open/closed pill and the Google (schema.org) hours are all derived
    // from this in src/lib/site.ts — nothing to keep in sync by hand.
    hours: z.array(
      z.object({
        fromDay: DAY,
        toDay: z.union([DAY, z.literal('')]).default(''),
        closed: z.boolean().default(false),
        open: z.union([HHMM, z.literal('')]).default(''),
        close: z.union([HHMM, z.literal('')]).default(''),
      }).refine((r) => r.closed || (r.open !== '' && r.close !== ''), {
        message: 'set both an opening and closing time, or tick "closed"',
      }),
    ),
    press: z.array(z.object({ name: z.string(), url: z.string().url() })).default([]),
  }),
});

const home = defineCollection({
  loader: single('content/home.yml'),
  schema: z.object({
    eyebrow: z.string(),
    tagline: z.string(),
    marquee: z.array(z.string()).min(1),
    story: z.object({
      name: z.string(),
      lede: z.string(),
      paragraphs: z.array(z.string()).min(1),
      signature: z.string(),
    }),
    inside: z.array(z.object({ title: z.string(), body: z.string() })).length(3, 'the "inside" section is three cards'),
    partners: z.array(z.object({
      category: z.string(),
      name: z.string(),
      url: z.string().url().optional(),
      body: z.string(),
    })),
    localArt: z.object({ image: image, caption: z.string(), blurb: z.string() }),
    localCredits: z.array(z.object({
      role: z.string(),
      name: z.string(),
      url: z.string().url().optional(),
      note: z.string().optional(),
    })),
    community: z.object({ blurb: z.string() }),
    quote: z.object({ text: z.string(), by: z.string(), image: image }),
    mailingList: z.object({
      blurb: z.string(),
      action: z.string().default(''),
      fieldName: z.string().default('email'),
    }),
  }),
});

const menu = defineCollection({
  loader: single('content/menu.yml'),
  schema: z.object({
    intro: z.string(),
    note: z.string(),
    cards: z.array(z.object({
      src: image,
      caption: z.string(),
      alt: z.string(),
    })).min(1),
    special: z.object({ name: z.string(), blurb: z.string(), image: image }),
  }),
});

const gallery = defineCollection({
  loader: single('content/gallery.yml'),
  schema: z.object({
    intro: z.string(),
    photos: z.array(z.object({ src: image, caption: z.string() })).min(1),
  }),
});

const events = defineCollection({
  loader: single('content/events.yml'),
  schema: z.object({
    intro: z.string(),
    events: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dates are YYYY-MM-DD'),
      title: z.string(),
      when: z.string(),
      description: z.string(),
      soldOut: z.boolean().optional(),
      poster: image.optional(),
      link: z.string().url().optional(),
      linkText: z.string().optional(),
    })).default([]),
  }),
});

const bookings = defineCollection({
  loader: single('content/bookings.yml'),
  schema: z.object({
    intro: z.string(),
    bookingTypes: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
  }),
});

export const collections = { settings, home, menu, gallery, events, bookings };
