# Ranny's — website

The site for **Ranny's**, an independent coffee shop on Hempshaw Lane,
Stockport. A warm, retro-caff site — Home, Menu, Events, Photos and Bookings —
all driven from a handful of plain-text content files so anyone can update it.

It's a **static site**, built with [Astro](https://astro.build). The build
turns the content files into finished pages in `dist/`, and GitHub Pages
serves them. There's no database and nothing to run in the background. The
pages are plain HTML + CSS and load fast; a small JavaScript layer
(`src/scripts/app.ts`) adds progressive-enhancement touches — a live "open
now / closed" status, keyboard support for the menu and photo lightbox, a cup
that fills as you scroll, and a lazy-loaded 3D mug at the foot of the home
page. Everything still works with JavaScript switched off.

---

## ✏️ Updating the site (no coding needed)

**The easy way: the editor at [`/admin/`](https://kylelookingaround.github.io/rannys/admin/).**
It shows every page's content as simple forms — text boxes, photo uploads,
add/remove buttons for lists. Hit **Save** and the site rebuilds and goes live
on its own a minute or two later.

Signing in: the editor uses a GitHub account. You need a (free) GitHub
account that's been added as a **collaborator** on this repository (repo
Settings → Collaborators → Add people). On first sign-in the editor asks for
a *personal access token*:

1. On github.com go to **Settings → Developer settings → Personal access
   tokens → Tokens (classic) → Generate new token (classic)**.
2. Name it (e.g. "Ranny's site editor"), pick an expiry you're comfortable
   with, and tick the **`repo`** scope — nothing else.
3. Generate, copy the token, and paste it into the editor's sign-in box.
   It's remembered on that device after that.

(It must be a *classic* token: GitHub's newer fine-grained tokens can't yet
be used on a repository you've been invited to as a collaborator. When the
token expires, editing stops working with an authentication error — just
generate a new one the same way.)

**The hands-on way:** edit the files in [`content/`](content/) directly on
github.com (open a file, click the ✏️ pencil, commit). One file per page:

| File | What's in it |
|---|---|
| `content/settings.yml` | Name, address, contact, opening hours, press links |
| `content/home.yml` | Hero, ticker, the story, suppliers, local credits, mailing list |
| `content/menu.yml` | The menu photo cards + the house special |
| `content/gallery.yml` | The photos (the first six also show on the home page) |
| `content/events.yml` | What's on — past events fade, then hide themselves |
| `content/bookings.yml` | The bookings cards + intro |

A couple of gentle rules for hand-editing: use spaces (never tabs) for
indentation, keep values inside quotes, and line up the `-` in a list with the
examples already there.

**A safety net either way:** every edit is checked when the site rebuilds. If
something's off — a missing field, broken indentation — the build stops with a
clear message and **the live site stays exactly as it was**. If that happens
you'll get an email from GitHub saying the workflow failed; it just means the
last edit didn't go live. Open the edit again and fix it (or ask a developer
to look at the error in the repo's *Actions* tab).

---

## 🛠️ Running it locally (for developers)

```bash
npm install      # one time
npm run dev      # live-reloading dev server at http://localhost:4321/rannys
npm run build    # writes the finished site to dist/
npm run preview  # serves the built dist/ locally
```

---

## 🚀 How it gets published

Pushing to the `main` branch (including saving in `/admin/` or editing content
on github.com) triggers the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys `dist/` to
**GitHub Pages**. Pull requests get a build check (`ci.yml`) so a broken edit
can't merge unnoticed.

One-time setup: in the repo, go to **Settings → Pages → Build and deployment**
and set **Source = "GitHub Actions"**.

---

## 📁 Project structure

```
rannys/
├── content/                  ← edit these (plain text, no code): all the site's content
│   ├── settings.yml            shop identity, hours, contact, press
│   ├── home.yml                the home page
│   ├── menu.yml                menu photo cards + house special
│   ├── gallery.yml             the photos page (+ home teaser)
│   ├── events.yml              what's on
│   └── bookings.yml            bookings
├── src/                      ← the site itself (for developers)
│   ├── content.config.ts       schemas that guard every content file at build time
│   ├── layouts/Base.astro      shared shell (head, meta/OG/JSON-LD, nav, footer)
│   ├── components/             shared pieces (the photo grid + lightbox)
│   ├── pages/                  one .astro file per page → one .html in dist/
│   ├── scripts/app.ts          progressive enhancement (live status, a11y, scroll cup)
│   ├── scripts/mug.ts          the lazy-loaded 3D enamel mug (three.js)
│   └── lib/site.ts             build-time helpers (hours parsing, map URLs, JSON-LD)
├── public/                   ← copied into the site as-is
│   ├── assets/                 photos, fonts, icons
│   ├── admin/                  the content editor (Sveltia CMS)
│   ├── styles.css              all styling (design tokens at the top)
│   ├── robots.txt · 404.html · site.webmanifest
├── astro.config.mjs          ← site URL/base, sitemap
├── package.json
├── .github/workflows/        ← deploy.yml (publish on main) · ci.yml (PR build check)
└── dist/                     ← the built site (generated; not committed)
```

**How the build works:** each file in `src/pages/` reads its content from
`content/*.yml` (validated against the schemas in `src/content.config.ts` —
a bad edit fails the build loudly instead of shipping), renders inside
`src/layouts/Base.astro`, and is written to `dist/` as a plain `.html` page.
The Google Maps embed, JSON-LD for search engines, the sitemap, and the
machine-readable opening hours are generated automatically. `three.js` (the
mug) is bundled into its own file that only the home page fetches, on demand.

---

## 📌 Good to know / nice next steps

- **Brand palette** — the whole look is driven by her shopfront colours (green
  `#a7bd1c`, orange `#db5e20`, cream `#f4ecd8`, mustard, terracotta, walnut),
  defined once as design tokens at the top of `public/styles.css` (`:root`).
  Change them there and the entire site re-themes. See `BRANDING.md` for the
  full system. Fonts (Bagel Fat One, Baloo 2, DM Sans, Caveat) are self-hosted
  in `public/assets/fonts/`.
- **As featured in** — add press links under `press` in `content/settings.yml`;
  the strip above the footer hides itself when the list is empty.
- **Share image** — link previews on WhatsApp/Instagram/Facebook use the enamel
  card at `public/assets/share-card.png` (1200×630), wired up via `og:image` /
  `twitter:image` in the layout. Replace that file to change the card.
- **One-click editor sign-in** — the editor currently uses a personal access
  token. A "Sign in with GitHub" button needs a small (free) OAuth helper
  hosted elsewhere; worth adding if the token dance gets annoying.
- **Custom domain** — to use a domain like `auntyrannys.com`, add a file
  `public/CNAME` containing just the domain, update `site`/`base` in
  `astro.config.mjs` and `url` in `content/settings.yml`, then point the
  domain's DNS at GitHub Pages and tick *Settings → Pages → Enforce HTTPS*.
