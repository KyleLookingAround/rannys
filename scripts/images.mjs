// Ranny's — makes web-sized copies of the photos in public/assets/.
//
// The owner uploads full-size phone photos (often 3–5 MB). Before every build
// (and `npm run dev`) this writes smaller WebP copies to public/assets/_w/ and
// a size list to src/generated/images.json, which the redesign pages use for
// `srcset`, so phones download a few hundred KB instead of megabytes. It also
// makes a 1200×630 JPEG of each photo for link previews.
// Both outputs are git-ignored and rebuilt as needed; unchanged photos are skipped.
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC_DIR = path.join(ROOT, 'public/assets');
const OUT_DIR = path.join(SRC_DIR, '_w');
const MANIFEST = path.join(ROOT, 'src/generated/images.json');
const WIDTHS = [400, 800, 1200, 1600];
const SKIP = /^(icon|share-card|ranny-sign|shopfront-line|photo-placeholder)/i;

// must match slug() in src/lib/img.ts
export const slug = (file) => path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const newer = async (a, b) => {
  try { return (await stat(a)).mtimeMs >= (await stat(b)).mtimeMs; } catch { return false; }
};

await mkdir(OUT_DIR, { recursive: true });
await mkdir(path.dirname(MANIFEST), { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !SKIP.test(f));
const manifest = {};
let made = 0;

for (const file of files) {
  const src = path.join(SRC_DIR, file);
  const img = sharp(src, { failOn: 'none' }).rotate(); // honour the phone's EXIF rotation
  const meta = await img.metadata();
  const upright = (meta.orientation ?? 1) >= 5;
  const w = upright ? meta.height : meta.width;
  const h = upright ? meta.width : meta.height;
  if (!w || !h) continue;

  const widths = WIDTHS.filter((x) => x < w);
  if (!widths.length || widths[widths.length - 1] < Math.min(w, 1600)) widths.push(Math.min(w, 1600));

  const variants = [];
  for (const vw of widths) {
    const name = `${slug(file)}-${vw}.webp`;
    const out = path.join(OUT_DIR, name);
    if (!(await newer(out, src))) {
      await sharp(src, { failOn: 'none' }).rotate().resize({ width: vw }).webp({ quality: 72 }).toFile(out);
      made++;
    }
    variants.push([vw, `/assets/_w/${name}`]);
  }
  // a 1200×630 JPEG for link previews (WhatsApp/Facebook), cropped around the subject
  const ogName = `${slug(file)}-og.jpg`;
  const ogOut = path.join(OUT_DIR, ogName);
  if (!(await newer(ogOut, src))) {
    await sharp(src, { failOn: 'none' }).rotate()
      .resize({ width: 1200, height: 630, fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 80, mozjpeg: true }).toFile(ogOut);
    made++;
  }
  manifest[`/assets/${file}`] = { w, h, variants, og: `/assets/_w/${ogName}` };
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`images: ${files.length} photos, ${made} new web copies`);
