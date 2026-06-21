# Ranny's — Brand Guidelines

*Coffee, cake & a proper natter. Hempshaw Lane, Stockport.*

Ranny's is an independent coffee shop with **hand-made, cut-and-paste charm** —
the site looks assembled by hand, like a page from Rhianne's notebook or the
café's community noticeboard: pinned notes with wobbly hand-drawn borders,
washi tape, pushpins, polaroids and handwritten margin notes, all on warm paper
in an olive "Fickle Pickle" palette. Friendly and a little playful, but always
legible — the imperfection lives on the frames and accents; body text stays on
flat paper. Because the olive (`#827d19`) is a mid-dark tone, text on it is
cream (large) or near-black ink (small) so everything meets WCAG AA contrast.

> The whole system is defined once as design tokens at the top of
> `src/styles.css` (`:root`). This document explains those tokens; change them
> there and the site re-themes.

---

## 1. The name & wordmark

- The name is always **"Ranny's"** — with the apostrophe.
- The hero/footer wordmark and all headings are set in **Baloo 2**, a rounded,
  friendly display face, in warm mixed case. The footer wordmark keeps the dot.
- Keep it title-case throughout ("Ranny's"); big headings use natural sentence
  case — friendly, not shouty. Only small labels/chips are uppercase.
- The favicon / app icon is an olive tile with a bold cream **"R"** (`assets/icon.svg`).

**Don't:** drop the apostrophe · stretch or outline the wordmark · recolour the
lime tile · crowd the logo with borders.

---

## 2. Colour palette

Defined as CSS custom properties at the top of `src/styles.css`:

| Token            | Hex        | Use                                            |
|------------------|------------|------------------------------------------------|
| `--lime`         | `#827d19`  | "Fickle Pickle" — primary accent, fascia panels, signs |
| `--ink`          | `#0a0703`  | Near-black, for small text on the olive accent  |
| `--terra-text`   | `#a8491a`  | Darker terracotta that meets contrast as body text |
| `--lime-deep`    | `#a4b918`  | Darker lime for depth                          |
| `--cream`        | `#f4ecd8`  | Page background (warm paper)                    |
| `--cream-warm`   | `#ece1c4`  | Alternate section background                    |
| `--board`        | `#fbf6e9`  | Sign/menu-board panels (lighter than cream)     |
| `--brown`        | `#241710`  | Ink — text, dark sections, rules               |
| `--brown-mid`    | `#4a3220`  | Secondary text                                 |
| `--terracotta`   | `#c4612a`  | Warm accent — links, prices, italics           |
| `--cork`         | `#c49a63`  | Corkboard tan behind the pinned "inside" notes  |
| `--tape`         | rose, 55%  | Translucent washi-tape strips on polaroids      |
| `--open` / `--soon` / `--closed` | green / amber / red | Live open-status dot colours    |

A subtle paper-grain texture (`body::before`) sits over everything in multiply
to keep surfaces feeling printed rather than flat.

---

## 3. Typography

Three self-hosted faces (`assets/fonts/`):

- **Baloo 2** (`--display`) — rounded and friendly. Headings, the wordmark, the
  ticker, prices and the open-status flags, in mixed case for a warm,
  hand-printed feel.
- **DM Sans** (`--text`) — body copy, buttons and meta. Weights 400–700.
- **Caveat** (`--hand`) — the handwriting. Used *sparingly* for the margin
  notes: eyebrows/labels, photo captions and the signature. Never for body copy.

---

## 4. The hand-made layer

Almost every surface is a **pinned piece of paper**, not a printed sign:

- **Wobbly hand-drawn borders** — a reusable SVG turbulence filter (`#wobble`
  / `#wobble2`, defined once in `layout.html`) displaces a panel's border so it
  reads as drawn by hand. Applied to a decorative `::after` so the text inside
  stays crisp.
- **Soft paper shadows** (not hard offsets), so panels feel pasted onto the page.
- **Pushpins, washi tape and a slight wonk** — cards and polaroids sit at a
  gentle rotation and straighten on hover. The "what's inside" notes are pinned
  to a **corkboard**; the gallery is **taped polaroids** with handwritten
  captions; the menu is a pinned card; the live status is a peel-off sticker.
- Rotations flatten on mobile, and all of this is decorative (`aria-hidden`).

---

## 5. Voice & tone

Warm, Northern, unpretentious. Talks like a person, not a brand: *"coffee, cake
& a proper natter"*, *"a half-ate butty in hand"*, *"the kind of vintage charm
that makes you want to linger."* Lower-case asides and a wink are welcome;
corporate polish is not.

---

## 6. Motion

Kept gentle and characterful — a slow "TODAY" ticker of taglines, a pulsing
live open/closed dot, a little cup that fills as you scroll, and a draggable
low-poly **3D enamel mug** at the foot of the home page (lazy-loaded; hidden
where WebGL or motion isn't available). Everything respects
`prefers-reduced-motion`. Nothing flashy; it should feel hand-made.
