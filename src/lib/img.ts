/**
 * Responsive photos for the site.
 *
 * scripts/images.mjs (run before every build) writes WebP copies of each photo
 * at a few widths and lists them in src/generated/images.json. `pic()` turns a
 * content image path into <img> attributes with a srcset, so a phone downloads
 * a ~400–800px copy instead of the owner's 4 MB original. If a photo has no
 * copies yet (or the list is missing), it falls back to the original file.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

type Entry = { w: number; h: number; variants: [number, string][]; og?: string };
let manifest: Record<string, Entry> | null = null;

function load(): Record<string, Entry> {
  if (manifest) return manifest;
  try {
    manifest = JSON.parse(readFileSync(path.join(process.cwd(), 'src/generated/images.json'), 'utf8'));
  } catch {
    manifest = {};
  }
  return manifest!;
}

/** "./assets/x.jpg" or "assets/x.jpg" → "/assets/x.jpg" */
export const abs = (p: string) => '/' + p.replace(/^\.?\//, '');

export interface Pic {
  src: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

/**
 * @param src   the image path from content (any of ./assets/…, /assets/…)
 * @param sizes the `sizes` attribute: how wide the image shows at each breakpoint
 */
export function pic(src: string, sizes = '100vw'): Pic {
  const key = abs(src);
  const e = load()[key];
  if (!e || !e.variants.length) return { src: encodeURI(key) };
  const mid = e.variants.find(([w]) => w >= 800) ?? e.variants[e.variants.length - 1];
  return {
    src: mid[1],
    srcset: e.variants.map(([w, u]) => `${u} ${w}w`).join(', '),
    sizes,
    width: e.w,
    height: e.h,
  };
}

/** The largest web copy, for "open full size" links (falls back to the original). */
export function full(src: string): string {
  const key = abs(src);
  const e = load()[key];
  return e?.variants.length ? e.variants[e.variants.length - 1][1] : encodeURI(key);
}

/** A 1200×630 JPEG copy for og:image (falls back to the original). */
export function ogCopy(src: string): string {
  const key = abs(src);
  return load()[key]?.og ?? encodeURI(key);
}
