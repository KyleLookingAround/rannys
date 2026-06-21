# Ranny's — Brand Guidelines

*Coffee, cake & a proper natter. Hempshaw Lane, Stockport.*

Ranny's is an independent coffee shop with **retro-caff charm** — the look of a
proper British corner café's frontage: painted signs, rounded friendly
lettering, hard-edged drop-shadows and an olive "Fickle Pickle" fascia. Warm,
hand-made and a little playful, but confident and legible — sign-written, not
twee. Because the olive (`#827d19`) is a mid-dark tone, text on it is cream
(large) or near-black ink (small) so everything meets WCAG AA contrast.

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
| `--open` / `--soon` / `--closed` | green / amber / red | Live open-status dot colours    |

A subtle paper-grain texture (`body::before`) sits over everything in multiply
to keep surfaces feeling printed rather than flat.

---

## 3. Typography

Two families, loaded from Google Fonts in `src/layout.html`:

- **Baloo 2** (display) — rounded and friendly. Headings, the wordmark, the
  ticker, prices and the open-status flags, in mixed case for a warm,
  hand-printed feel.
- **DM Sans** (text) — body copy, labels, buttons and meta. Weights 400–700;
  small labels are set bold, uppercase, with wide tracking.

---

## 4. The "sign panel" motif

Almost every surface is a painted enamel sign: a **thick brown rule** (`--rule`,
2.5px), **rounded corners**, and a **hard offset drop-shadow** (e.g.
`box-shadow: 6px 6px 0`). Cards, the menu board, event tickets, buttons, the map
and the status pill all share this language. Shadows lift on hover.

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
