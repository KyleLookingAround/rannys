# Ranny's — Brand Guidelines

*Coffee, cake & a proper natter. Hempshaw Lane, Stockport.*

Ranny's is an independent coffee shop with **vintage charm** — mismatched mugs,
cake on grandma's plates, a room that feels like *somewhere*, not anywhere. The
brand is warm, hand-made and a little playful: cream paper, a bright lime
fascia, and big confident serif type. Everything (palette, type, motion, copy)
serves that warm-but-characterful feel.

> The whole system is defined once as design tokens at the top of
> `src/styles.css` (`:root`). This document explains those tokens; change them
> there and the site re-themes.

---

## 1. The name & wordmark

- The name is always **"Ranny's"** — with the apostrophe.
- The hero/footer wordmark is set in **Fraunces** at a heavy weight with a tight
  tracking and the trailing dot picked out in italic for a hand-finished feel.
- Keep it title-case ("Ranny's"); don't all-caps the wordmark.
- The favicon / app icon is a lime tile with an italic serif **"R"**
  (`assets/icon.svg`).

**Don't:** drop the apostrophe · stretch or outline the wordmark · recolour the
lime tile · crowd the logo with borders.

---

## 2. Colour palette

Defined as CSS custom properties at the top of `src/styles.css`:

| Token            | Hex        | Use                                            |
|------------------|------------|------------------------------------------------|
| `--lime`         | `#c5dd24`  | Primary accent — fascia, marquee, highlights   |
| `--lime-deep`    | `#a4b918`  | Darker lime for depth                          |
| `--cream`        | `#f4ecd8`  | Page background (warm paper)                   |
| `--cream-warm`   | `#ece1c4`  | Alternate section background                   |
| `--brown`        | `#2a1c10`  | Text, dark sections, ink                       |
| `--brown-mid`    | `#4a3220`  | Secondary text                                 |
| `--terracotta`   | `#c4612a`  | Warm accent — links, italics, shadows          |
| `--rose`         | `#d8a89b`  | Soft accent                                    |

A subtle paper-grain texture (`body::before`) sits over everything in multiply
to keep surfaces feeling printed rather than flat.

---

## 3. Typography

Loaded from Google Fonts in `src/index.html`:

- **Fraunces** (serif) — headings, the wordmark, story copy and pull-quotes.
  Uses optical sizing and the `SOFT`/`WONK` axes for a friendly, slightly
  wonky character. Italics are used liberally for warmth.
- **Bricolage Grotesque** (sans) — body text and card copy.
- **DM Mono** (monospace) — eyebrows, labels, buttons and small meta text,
  set uppercase with wide tracking.

---

## 4. Voice & tone

Warm, Northern, unpretentious. Talks like a person, not a brand: *"coffee, cake
& a proper natter"*, *"a half-ate butty in hand"*, *"the kind of vintage charm
that makes you want to linger."* Lower-case asides and a wink are welcome;
corporate polish is not.

---

## 5. Motion

Kept gentle and characterful — a bobbling "It's Official!" badge, a slow
scrolling marquee of taglines, a pulsing status dot, and chunky offset
box-shadows that lift on hover. Nothing flashy; it should feel hand-made.
