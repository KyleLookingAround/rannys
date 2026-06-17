# Ranny's — website

The site for **Ranny's**, an independent coffee shop on Hempshaw Lane,
Stockport. A warm, vintage five-page site — Home, Menu, Events, Photos and
Bookings — all driven from a single plain-text content file so anyone can
update it.

It's a **static site**. A small build step turns the content file into the
finished pages in `dist/`, and GitHub Pages serves it. There's no database and
nothing to run in the background. The pages themselves are pure HTML + CSS (no
client-side JavaScript), so they load fast and are easy to host anywhere.

---

## ✏️ Updating the site (no coding needed)

You only ever touch one file: **`content/site.yml`**.

It holds everything editable across all five pages — the shop name, address,
opening hours, the hero copy, the marquee words, your story, the "what's
inside" cards, the partners, the **coffee menu**, the **events**, the **photos**,
the **bookings** options, the mailing-list blurb and your contact/social links.
Each block is labelled with a comment explaining what it does. Change the text
inside the `"quotes"`, keep the labels and the indentation as they are.

The site has five pages, all built from that one file:
**Home**, **Menu**, **Events**, **Photos** and **Bookings**.

- **Menu** — add/remove sections (Coffee, Cake…) and items under `shop.menu`.
  `price` and `note` are optional on each item.
- **Events** — add a block per event under `shop.events` (`day`, `month`,
  `title`, `when`, `description`). Empty the list and the page shows a tidy
  "nothing on right now" note automatically.
- **Photos** — drop image files into `assets/` and point each `src` under
  `shop.photos` at them (e.g. `./assets/inside-1.jpg`). Until then they show a
  placeholder tile.
- **Bookings** — intro + the "what you can book" cards under `shop.bookingTypes`.
  The enquiry button opens a pre-filled email to you.
- **Mailing list** — a one-tap email for now. To use a real signup form, paste
  your provider's form URL into `shop.mailingList.action` (see the comment there).

> **Editing on github.com is the easy way:** open `content/site.yml`, click the
> ✏️ pencil, make your change, and hit *Commit*. The site rebuilds and goes
> live on its own a minute or two later.

A couple of gentle rules so nothing breaks: use spaces (never tabs) for
indentation, keep values inside quotes, and line up the `-` in a list with the
examples already there. (The map and "get directions" links are generated
automatically from the address — no need to touch any URLs.)

---

## 🛠️ Running it locally (for developers)

```bash
npm install      # one time
npm run build    # writes the finished site to dist/
npm run serve    # builds, then serves dist/ at http://localhost:5173
```

---

## 🚀 How it gets published

Pushing to the `main` branch (including editing content on github.com) triggers
the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the
site and deploys `dist/` to **GitHub Pages**.

One-time setup: in the repo, go to **Settings → Pages → Build and deployment**
and set **Source = "GitHub Actions"**.

---

## 📁 Project structure

```
rannys/
├── content/
│   └── site.yml              ← edit this (plain text, no code): all the site's content
├── src/                      ← the site itself (for developers)
│   ├── layout.html           ← shared shell (head, header nav, footer)
│   ├── pages/                ← the body of each page ({{tokens}} + {{#each}}/{{#if}})
│   │   ├── home.html
│   │   ├── menu.html
│   │   ├── events.html
│   │   ├── photos.html
│   │   └── bookings.html
│   ├── pour-coffee.svg       ← the animated "pouring coffee" graphic ({{pourSvg}})
│   ├── styles.css            ← all styling (design tokens at the top)
│   ├── 404.html              ← "not found" page
│   └── site.webmanifest      ← PWA / home-screen metadata
├── assets/                   ← icons & images copied into the site as-is
│   ├── icon.svg              ← the lime "R" favicon / app icon
│   └── photo-placeholder.svg ← shown on the Photos page until real photos are added
├── build.mjs                 ← fills content/site.yml into the templates → dist/
├── package.json
├── .github/workflows/        ← deploy.yml (publish on main) · ci.yml (PR build check)
└── dist/                     ← the built site (generated; not committed)
```

**How the build works:** `build.mjs` reads `content/site.yml` and, for each
page, fills the values into `src/pages/<page>.html`, wraps it in
`src/layout.html`, and writes the finished page to `dist/`. Repeating sections
use `{{#each list}}…{{/each}}` and `{{#if value}}…{{/if}}`; the coffee menu
(nested sections → items) is assembled in `build.mjs`. It also generates the
Google Maps embed, the animated pour graphic and JSON-LD for search engines. So
the *content* lives in `content/` and the *markup* lives in `src/` — they're
never tangled together.

---

## 📌 Good to know / nice next steps

- **Brand palette** — the whole look is driven by a few colours (lime
  `#c5dd24`, cream `#f4ecd8`, brown `#2a1c10`, terracotta `#c4612a`), defined
  once as design tokens at the top of `src/styles.css` (`:root`). Change them
  there and the entire site re-themes.
- **Real photos** — the Photos page uses a placeholder tile until you add
  images. Drop JPGs into `assets/` and point `shop.photos[].src` at them.
- **Share image** — link previews currently use the title/description only.
  To get a rich image card on WhatsApp/Instagram/Facebook, add a 1200×630 JPG to
  `assets/` and wire up `og:image`/`twitter:image` in `src/layout.html`.
- **Custom domain** — to use a domain like `auntyrannys.com`, add a file
  `src/CNAME` containing just the domain (the build copies it to `dist/`),
  update `site.url` in `content/site.yml`, then point the domain's DNS at GitHub
  Pages and tick *Settings → Pages → Enforce HTTPS*.
