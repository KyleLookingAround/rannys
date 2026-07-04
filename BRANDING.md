# Ranny's — Brand Guidelines

*Coffee, cake & a proper natter. Hempshaw Lane, Stockport.*

Ranny's is the little **green-and-orange coffee shop** on Hempshaw Lane in
Offerton, Stockport — and the site is built to look like the real place:
her **bright green shopfront**, the **warm orange retro wordmark**, a
**wooden chalkboard menu** in white chalk, **speckled stoneware**, fresh
flowers, and her own photos. It keeps a hand-made, cut-and-paste warmth
(pinned notes, wobbly borders, washi tape, polaroids, handwritten captions)
but grounded in her real materials. Friendly and a little playful, but always
legible — the green is light, so text on it is dark ink, and everything meets
WCAG AA contrast.

> The whole system is defined once as design tokens at the top of
> `public/styles.css` (`:root`). This document explains those tokens; change them
> there and the site re-themes.

---

## 1. The name & wordmark

- The name is always **"Ranny's"** — with the apostrophe.
- The wordmark recreates her fascia sign: **Bagel Fat One** in **orange**, with
  a cream/dark outline, in the topbar and footer. Headings are **Baloo 2** in
  warm mixed (sentence) case — friendly, not shouty. Only small labels/chips
  are uppercase.
- The favicon / app icon is a green tile with a bold **"R"** (`public/assets/icon.svg`).

**Don't:** drop the apostrophe · set the wordmark in anything but the rounded
orange · recolour the green · crowd the logo with borders.

---

## 2. Colour palette

Defined as CSS custom properties at the top of `public/styles.css`:

| Token            | Hex        | Use                                            |
|------------------|------------|------------------------------------------------|
| `--green`        | `#a7bd1c`  | Her shopfront — primary (sections, signs, highlights) |
| `--orange`       | `#db5e20`  | Her logo orange — the wordmark & accents        |
| `--orange-text`  | `#a8420c`  | Darker orange, safe as small text on cream      |
| `--cream`        | `#f4ecd8`  | Page background (warm paper)                    |
| `--board`        | `#fbf6e9`  | Note / panel paper (lighter than cream)         |
| `--mustard`      | `#c89a40`  | Stoneware saucers / ceramic                     |
| `--terracotta`   | `#b4502a`  | Ceramic bands, plant pots                       |
| `--wood`         | `#5b3a24`  | The chalkboard menu (walnut)                    |
| `--brown`        | `#241710`  | Ink — text, dark sections, rules               |
| `--ink`          | `#1a1206`  | Near-black, for small text on the green accent  |
| `--cork`         | `#c49a63`  | Corkboard tan behind the pinned "inside" notes  |
| `--open` / `--soon` / `--closed` | green / amber / red | Live open-status dot colours    |

Text on **green** is always dark ink (green is light); **white chalk** on the
walnut menu; **cream** on the brown footer and terracotta band.

A subtle paper-grain texture (`body::before`) sits over everything in multiply
to keep surfaces feeling printed rather than flat.

---

## 3. Typography

Four self-hosted faces (`public/assets/fonts/`):

- **Bagel Fat One** (`--logo`) — the fat rounded orange wordmark, matching her
  fascia sign. Used only for the "Ranny's" lockup (topbar + footer).
- **Baloo 2** (`--display`) — rounded and friendly. Headings, ticker, prices,
  in mixed case for a warm, hand-printed feel.
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
