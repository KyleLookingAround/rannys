/**
 * Ranny's — build
 *
 * Reads the content in /content (YAML), fills it into the shared layout +
 * page templates in /src, and writes the deployable multi-page site to /dist.
 *
 *   content/site.yml   → all the editable text (name, address, menu, events…)
 *   src/layout.html    → the shared shell (head, header nav, footer)
 *   src/pages/*.html   → the body of each page ({{tokens}} + {{#each}} / {{#if}})
 *   src/styles.css     → styles (minified into dist)
 *
 * Output:
 *   dist/index.html, dist/menu.html, dist/events.html, dist/photos.html,
 *   dist/bookings.html, dist/styles.css, dist/404.html, dist/site.webmanifest,
 *   dist/assets/  (+ dist/CNAME if src/CNAME exists)
 *
 * Dependencies: js-yaml (content), esbuild (minify).   Run with:  npm run build
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { transformSync, buildSync } from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url));
const r = (...p) => join(root, ...p);

function loadYaml(rel) {
  const file = r(rel);
  if (!existsSync(file)) { console.warn(`!  missing ${rel} — skipping`); return undefined; }
  try {
    return yaml.load(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Couldn't read ${rel} — check the indentation/quotes.\n   ${err.message}`);
  }
}

// 1) content ------------------------------------------------------------
const data = loadYaml('content/site.yml') || {};
const shop = data.shop || {};
const site = data.site || {};

// 2) computed helpers used by the templates ----------------------------
const fullAddress = [shop.street, shop.locality, shop.postcode].filter(Boolean).join(', ');
const q = encodeURIComponent(fullAddress);
shop.mapEmbedUrl   = `https://maps.google.com/maps?q=${q}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
shop.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${q}`;

// social-share image → an absolute URL (what WhatsApp/Twitter need)
const previewImage = shop.previewImage || './assets/preview.jpg';
shop.ogImage = site.url ? site.url + previewImage.replace(/^\.?\//, '') : previewImage;

// menu: sections → items, rendered to HTML (avoids nested loops in templates)
shop.menuHtml = (shop.menu || []).map(sec => `
      <div class="menu-section">
        <h3 class="menu-cat">${sec.name || ''}</h3>
        ${sec.note ? `<p class="menu-cat-note">${sec.note}</p>` : ''}
        <ul class="menu-list">
          ${(sec.items || []).map(it => `
          <li class="menu-item">
            <span class="mi-name">${it.name || ''}${it.note ? ` <span class="mi-note">${it.note}</span>` : ''}</span>
            <span class="mi-dots"></span>
            <span class="mi-price">${it.price ?? ''}</span>
          </li>`).join('')}
        </ul>
      </div>`).join('\n');

// mailing list: a mailto button for now (paste a provider URL into
// shop.mailingList.action to switch it to a real subscribe form)
const ml = shop.mailingList || {};
shop.signupHtml = ml.action
  ? `<form class="signup-form" action="${ml.action}" method="post" target="_blank">
      <input class="signup-input" type="email" name="${ml.fieldName || 'email'}" placeholder="you@email.com" required aria-label="Email address">
      <button class="btn btn-signup" type="submit">Join the list</button>
    </form>`
  : `<a class="btn btn-signup" href="mailto:${shop.email}?subject=Add%20me%20to%20the%20${encodeURIComponent(shop.name || '')}%20list&body=Hi%2C%0A%0APop%20me%20on%20the%20list%20please.%0A%0AThanks%21">Join the list</a>`;

// photos: add 1-based index + wrapping prev/next for the CSS lightbox
const photoList = Array.isArray(shop.photos) ? shop.photos : [];
shop.photos = photoList.map((p, i) => ({
  ...p,
  n: i + 1,
  prev: ((i - 1 + photoList.length) % photoList.length) + 1,
  next: ((i + 1) % photoList.length) + 1,
}));

// events: derive the date pill (day / month) + an ISO date that the client
// JS uses to fade out past events and hide ones over a week old.
const EV_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
shop.events = (Array.isArray(shop.events) ? shop.events : []).map((ev) => {
  if (ev.date) {
    const d = new Date(ev.date + 'T00:00:00');
    if (!isNaN(d)) return { ...ev, day: String(d.getDate()), month: EV_MONTHS[d.getMonth()], dateISO: ev.date };
  }
  return { ...ev, dateISO: '' };
});
shop.eventsEmpty = !shop.events.length;

// partners: make the name a link when a `url` is given
shop.partners = (Array.isArray(shop.partners) ? shop.partners : []).map((p) => ({
  ...p,
  nameHtml: p.url
    ? `<a class="partner-link" href="${p.url}" target="_blank" rel="noopener">${p.name} ↗</a>`
    : p.name,
}));

// opening hours → a machine-readable map the client JS uses for the live
// "open now / closed" status. Parses shop.openingHours (Google format, e.g.
// "Tu-Fr 07:00-16:00") into { 0..6: [[openMins, closeMins], …] }, Sun=0.
const DAY_IDX = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_ORDER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function parseHours(list) {
  const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const line of (Array.isArray(list) ? list : [])) {
    const m = /^([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(line.trim());
    if (!m) continue;
    const [, d1, d2, oh, om, ch, cm] = m;
    const open = (+oh) * 60 + (+om);
    const close = (+ch) * 60 + (+cm);
    const start = DAY_IDX[d1];
    if (start == null) continue;
    const end = d2 != null ? DAY_IDX[d2] : start;
    for (let i = start; ; i = (i + 1) % 7) {
      map[i].push([open, close]);
      if (i === end) break;
    }
  }
  return map;
}
const hoursData = { tz: 'Europe/London', days: parseHours(shop.openingHours) };

const ctx = { ...data, shop, site, year: new Date().getFullYear(), hoursJson: JSON.stringify(hoursData) };

// 3) a tiny template engine --------------------------------------------
//    {{ a.b.c }}                 → value (dotted path, array indices ok)
//    {{ this }}                  → the current item inside an #each block
//    {{#each list}} … {{/each}}  → repeat for each item in the array
//    {{#if value}} … {{/if}}     → include only when value is truthy/non-empty
//    Values are inserted as-is (so YAML can contain <br>, &amp; etc.).
//    (Note: #each / #if are not nested in templates — render nested data to
//     HTML in JS above instead, like shop.menuHtml.)
const get = (obj, path) =>
  path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

function render(tpl, scope, rootScope) {
  tpl = tpl.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_m, path, inner) => {
    const list = get(scope, path) ?? get(rootScope, path) ?? [];
    if (!Array.isArray(list)) return '';
    return list.map((item, i) => {
      const itemScope = (item && typeof item === 'object')
        ? { ...item, _num: i + 1 }
        : { this: item, _num: i + 1 };
      return render(inner, itemScope, rootScope);
    }).join('');
  });
  tpl = tpl.replace(/\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, path, inner) => {
    let v = get(scope, path);
    if (v === undefined) v = get(rootScope, path);
    const truthy = Array.isArray(v) ? v.length > 0 : !!v;
    return truthy ? inner : '';
  });
  tpl = tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, path) => {
    let v = get(scope, path);
    if (v === undefined) v = get(rootScope, path);
    return v == null ? '' : String(v);
  });
  return tpl;
}

// 4) JSON-LD so search engines + Maps understand the business ----------
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CafeOrCoffeeShop',
  name: shop.name,
  description: shop.description,
  ...(site.url ? { url: site.url } : {}),
  ...(shop.email ? { email: shop.email } : {}),
  address: {
    '@type': 'PostalAddress',
    streetAddress: shop.street,
    addressLocality: shop.locality,
    addressRegion: shop.region,
    postalCode: shop.postcode,
    addressCountry: shop.country || 'GB',
  },
  ...(shop.locality ? { areaServed: shop.locality } : {}),
  ...(Array.isArray(shop.openingHours) && shop.openingHours.length ? { openingHours: shop.openingHours } : {}),
  servesCuisine: ['Coffee', 'Cake', 'Bakery'],
  ...(shop.priceRange ? { priceRange: shop.priceRange } : {}),
  sameAs: [shop.instagram, shop.facebook].filter(Boolean),
};
const esc = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const jsonLdTag = `<script type="application/ld+json">${esc(jsonLd)}</script>`;

// 5) build each page ----------------------------------------------------
const layout = readFileSync(r('src/layout.html'), 'utf8');
if (!layout.includes('<!-- page:content -->') || !layout.includes('<!-- build:site-data -->')) {
  throw new Error('src/layout.html is missing the <!-- page:content --> or <!-- build:site-data --> marker.');
}
const name = shop.name || 'Ranny’s';
const loc = shop.locality || '';
const pages = [
  { src: 'home.html',     out: 'index.html',    nav: 'home',     title: `${name} — coffee, cake & a proper natter`, description: shop.description },
  { src: 'menu.html',     out: 'menu.html',     nav: 'menu',     title: `Menu — ${name}`,     description: `The ${name} menu — proper coffee, cake and the good stuff. ${loc}.` },
  { src: 'events.html',   out: 'events.html',   nav: 'events',   title: `Events — ${name}`,   description: `What's on at ${name}, ${shop.street}, ${loc}.` },
  { src: 'bookings.html', out: 'bookings.html', nav: 'bookings', title: `Bookings — ${name}`, description: `Book the space at ${name} for your group. ${loc}.` },
];

mkdirSync(r('dist'), { recursive: true });
const leftovers = new Set();

for (const page of pages) {
  const inner = readFileSync(r('src/pages', page.src), 'utf8');
  const renderedInner = render(inner, ctx, ctx);

  const nav = { home: '', menu: '', events: '', photos: '', bookings: '' };
  if (page.nav) nav[page.nav] = 'active';
  const pageUrl = site.url ? (page.out === 'index.html' ? site.url : site.url + page.out) : '';
  const pageCtx = { ...ctx, nav, title: page.title, description: page.description, pageUrl };

  let html = render(layout, pageCtx, pageCtx)
    .replace('<!-- page:content -->', renderedInner)
    .replace('<!-- build:site-data -->', jsonLdTag);

  (html.match(/\{\{[^}]+\}\}/g) || []).forEach(t => leftovers.add(`${page.out}: ${t}`));
  writeFileSync(r('dist', page.out), html);
}

if (leftovers.size) console.warn(`!  unfilled token(s):\n   ${[...leftovers].join('\n   ')}`);

// 6) static assets ------------------------------------------------------
const minify = (file, loader) =>
  transformSync(readFileSync(r('src', file), 'utf8'), { loader, minify: true }).code;

writeFileSync(r('dist/styles.css'), minify('styles.css', 'css'));

// app.js — small progressive-enhancement layer (live status, a11y, scroll cup).
// No npm imports, so a transform/minify is enough; it dynamically imports mug.js.
if (existsSync(r('src/app.js'))) writeFileSync(r('dist/app.js'), minify('app.js', 'js'));

// mug.js — the lazy-loaded 3D enamel mug. Bundled (it imports three) into a
// standalone module that app.js only fetches on the home hero, on demand.
if (existsSync(r('src/mug.js'))) {
  buildSync({
    entryPoints: [r('src/mug.js')],
    outfile: r('dist/mug.js'),
    bundle: true, format: 'esm', minify: true, target: 'es2019', legalComments: 'none',
  });
}

cpSync(r('src/404.html'), r('dist/404.html'));
cpSync(r('src/site.webmanifest'), r('dist/site.webmanifest'));
if (existsSync(r('src/CNAME'))) cpSync(r('src/CNAME'), r('dist/CNAME'));   // GitHub Pages custom domain
if (existsSync(r('assets'))) cpSync(r('assets'), r('dist/assets'), { recursive: true });

console.log(`✓ Built dist/  —  ${pages.length} pages · ${(shop.menu || []).reduce((n, s) => n + (s.items || []).length, 0)} menu items · ${(shop.events || []).length} events · ${(shop.photos || []).length} photos`);
