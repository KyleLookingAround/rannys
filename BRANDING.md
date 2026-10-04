# Ranny's — Brand Guidelines

*Coffee, cake & a proper natter. Hempshaw Lane, Stockport.*

Ranny's already has a look on the street: the **brick-red fascia sign** with
its biscuit 3D shadow, the **event posters** in deep olive and burnt orange,
and the **line drawing of the shopfront** on the take-away cups and loyalty
cards. The website uses that same look. It should feel like one of her posters:
flat colour, bold wide capitals, the shopfront drawing, and her real photos.
Text always meets WCAG AA contrast.

> The tokens live at the top of `public/styles.css` (`:root`), under a short
> description of the system (bands, headings, spacing, surfaces, links). Change them there and the site re-themes.

---

## 1. The name & logo

- The name is always **"Ranny's"**, with the apostrophe.
- The logo **is the sign**: `public/assets/ranny-sign.png` (hero, 919px wide)
  and `ranny-sign-sm.png` (top bar and footer, 420px wide). It's artwork, so it
  is never retyped in a font.
- Put it on paper or white. On olive, orange or walnut, sit it on a paper
  panel (as in the footer and the share card), because brick on olive is too
  low-contrast.
- Keep clear space of at least the height of the apostrophe on every side.
  Smallest size: 120px wide on screen, 30mm in print.
- The favicon / app icon is an olive tile with a paper **"R"** and a biscuit
  shadow (`public/assets/icon.svg`).

**Don't:** drop the apostrophe · recolour, outline or stretch the sign · put it
straight onto a photo or a dark colour.

**Still to do:** the sign file is a cut-out of a photo. Get a vector redraw
before using it on signage or merchandise.

---

## 2. Colour palette

| Token          | Hex       | Use                                                        |
|----------------|-----------|------------------------------------------------------------|
| `--brick`      | `#882603` | The sign's letter face. Headings' accent words, links, buttons, small labels |
| `--biscuit`    | `#d09d5a` | The sign's 3D shadow. Card shadows, accents on dark grounds (large text only) |
| `--biscuit-lt` | `#e6c595` | Biscuit for small text on olive or walnut                   |
| `--olive`      | `#4f4c24` | Deep olive poster ground. "What you'll find" band, tab bar, footer |
| `--pickle`     | `#7f7a1a` | "Fickle Pickle". The shopfront drawing and big fills, never small text |
| `--burnt`      | `#a24d00` | Burnt-orange poster. The "Got a group?" blocks              |
| `--walnut`     | `#633924` | The menu board. The mailing-list band                       |
| `--paper`      | `#f3ead8` | Page background, from the wreath poster                     |
| `--paper-2`    | `#faf5ea` | Cards and panels                                            |
| `--paper-3`    | `#ebdfc6` | Alternate section background                                |
| `--ink`        | `#1a1206` | Body text and rules                                         |
| `--green`      | `#a7bd1c` | Shopfront lime. Only the live "Open now" sticker            |

Contrast rules:
- Small text on paper uses **ink** or **brick**, never burnt orange or pickle.
- Paper text on olive (7.4:1), walnut (8.2:1), brick (7.6:1) and burnt orange
  (4.9:1) is fine at any size.
- Biscuit on olive is 3.6:1, so use it only for large headings there. Use
  `--biscuit-lt` for small text.

---

## 3. Typography

All self-hosted in `public/assets/fonts/`:

- **Archivo** (`--poster`): headings, nav, buttons, labels. Wide (`font-stretch:
  125%`), heavy (800–900) and in capitals, like the Run MCR posters. Small labels
  use 12px with 0.2em letter-spacing.
- **Playfair Display** (`--serif`): event titles and the quote band, like the
  Christmas wreath poster. Use it for those two places only.
- **DM Sans** (`--text`): body copy.
- **Caveat** (`--hand`): handwriting, used sparingly for photo captions, the
  menu note, "As featured in" and the "Ranny's x" sign-off. Never for headings,
  labels or body copy.

---

## 4. Graphic language

- **The shopfront drawing** is the recurring motif:
  `shopfront-line.webp` (pickle ink) beside the home hero and in each page
  header, and `shopfront-line-cream.webp` in the footer.
- **Poster blocks**: each section is one flat colour (paper, olive, burnt
  orange or walnut) with one headline.
- **Square corners** (4px) and **hard offset shadows** in ink or olive, as if
  printed. Rounded pills only for status labels: Open now, Today, Next up, Sold out.
- **Photos** sit in plain square-cornered frames with a handwritten caption.

---

## 5. Voice & tone

Warm, Northern, unpretentious. Talks like a person, not a brand: *"coffee, cake
& a proper natter"*, *"a half-ate butty in hand"*, *"good runs, good coffee,
tired legs, full cups."* Lower-case asides and a wink are welcome; corporate
polish is not.

---

## 6. Motion

Gentle: a pulsing open/closed dot, pages that cross-fade into each other,
cards that ease up as they scroll into view, and shimmering placeholders while
photos load. Everything respects `prefers-reduced-motion`; with motion off, it
all stays still.

---

## 7. Mobile

- A tab bar at the bottom of the screen (Home, Menu, What's on, Photos, Book)
  is always one tap away; on computers it becomes the top navigation.
- The home page opens on the shopfront photo with "Open now", today's hours
  and a Get directions button, all without scrolling.
- Events, menu photos and gallery photos are swipeable rows with position dots.
- Photos open full screen; swipe between them, swipe down to close.
