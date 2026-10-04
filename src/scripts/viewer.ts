/* Ranny's: full-screen photo viewer (Menu and Photos pages).

   The page ships a simple CSS-only viewer (one :target overlay per photo) so
   photos still open without JavaScript. When this script runs it takes over
   with a single overlay holding a horizontal strip of every photo, scrolled
   natively with scroll-snap: the photo follows your finger, one photo per
   swipe (even a hard flick), no "swap" moment for a fast tap to fall through,
   and Back on a phone closes it. Links like menu.html#shot-3 still open that
   photo, and the address keeps up with the photo you're on. */

import { trackPhoto } from './analytics';

type Slide = { src: string; srcset?: string; sizes?: string; width?: string; height?: string; alt: string; caption: string };

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function wireViewer() {
  const boxes = [...document.querySelectorAll<HTMLElement>('.lightbox[id^="shot-"]')];
  if (!boxes.length) return;
  document.documentElement.classList.add('has-viewer');   // hides the CSS-only overlays

  const slides: Slide[] = boxes.map((box) => {
    const img = box.querySelector('img')!;
    return {
      src: img.getAttribute('src') || '', srcset: img.getAttribute('srcset') || undefined, sizes: img.getAttribute('sizes') || undefined,
      width: img.getAttribute('width') || undefined, height: img.getAttribute('height') || undefined,
      alt: img.getAttribute('alt') || '', caption: box.getAttribute('aria-label') || '',
    };
  });
  const n = slides.length;

  // ---- build the overlay once ----
  const root = document.createElement('div');
  root.className = 'lbx';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Photo viewer');
  root.innerHTML = `
    <p class="lbx-count" aria-live="polite"></p>
    <div class="lbx-track">${slides.map((s, i) => `
      <figure class="lbx-slide" data-i="${i}">
        <img alt="" loading="lazy" decoding="async">
        <figcaption class="lb-cap"></figcaption>
      </figure>`).join('')}
    </div>
    ${n > 1 ? '<button type="button" class="lb-nav lb-prev" aria-label="Previous photo">‹</button><button type="button" class="lb-nav lb-next" aria-label="Next photo">›</button>' : ''}
    <button type="button" class="lb-close" aria-label="Close">✕</button>`;
  root.querySelectorAll<HTMLElement>('.lbx-slide').forEach((fig, i) => {
    const s = slides[i];
    const img = fig.querySelector('img')!;
    img.alt = s.alt;
    if (s.width) img.width = Number(s.width);
    if (s.height) img.height = Number(s.height);
    if (s.sizes) img.sizes = s.sizes;
    if (s.srcset) img.srcset = s.srcset;
    img.src = s.src;
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
    fig.querySelector('figcaption')!.textContent = s.caption;
  });
  document.body.append(root);

  const track = root.querySelector<HTMLElement>('.lbx-track')!;
  const count = root.querySelector<HTMLElement>('.lbx-count')!;
  const closeBtn = root.querySelector<HTMLButtonElement>('.lb-close')!;
  let index = 0;
  let pushed = false;          // did opening add a history entry (so Back closes)?
  let lastFocus: HTMLElement | null = null;
  let tracked = -1;
  let pending: number | null = null;   // where the last arrow tap is heading, so fast taps add up

  const width = () => track.clientWidth || innerWidth;
  const current = () => Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / width())));
  const setHash = (i: number) => history.replaceState(history.state, '', `#shot-${i + 1}`);

  function settle() {
    index = current();
    pending = null;
    count.textContent = `${index + 1} of ${n}`;
    if (!root.hidden) {
      setHash(index);
      if (tracked !== index) { tracked = index; trackPhoto(slides[index].caption); }
    }
  }
  let raf = 0, idle = 0;
  track.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; count.textContent = `${current() + 1} of ${n}`; });
    clearTimeout(idle); idle = window.setTimeout(settle, 140);   // fallback where 'scrollend' isn't supported
  }, { passive: true });
  track.addEventListener('scrollend', () => { clearTimeout(idle); settle(); });

  function goTo(i: number, smooth = true) {
    const target = (i + n) % n;   // the buttons wrap round; swiping stops at the ends
    pending = target;
    track.scrollTo({ left: target * width(), behavior: smooth && !reduceMotion() ? 'smooth' : 'instant' as ScrollBehavior });
  }

  function open(i: number, viaLink: boolean) {
    lastFocus = document.activeElement as HTMLElement | null;
    root.hidden = false;
    document.body.classList.add('lbx-open');
    tracked = -1;
    // tapping a photo adds a history entry so the phone's Back button closes
    // the viewer; arriving on menu.html#shot-3 from elsewhere doesn't
    if (!viaLink) { history.pushState({ lbx: true }, '', `#shot-${i + 1}`); pushed = true; } else { pushed = false; }
    goTo(i, false);
    settle();
    closeBtn.focus({ preventScroll: true });
  }

  function close(fromPopstate = false) {
    if (root.hidden) return;
    root.hidden = true;
    document.body.classList.remove('lbx-open');
    if (!fromPopstate) {
      if (pushed) { pushed = false; history.back(); return; }   // popstate finishes up
      history.replaceState(history.state, '', location.pathname + location.search);
    }
    const thumb = document.getElementById(`thumb-${index + 1}`);
    (thumb || lastFocus)?.focus({ preventScroll: true });
    thumb?.scrollIntoView({ block: 'nearest' });
  }

  addEventListener('popstate', () => {
    if (!root.hidden) { pushed = false; close(true); }
  });

  // open from the grid
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a.r-shot[href^="#shot-"]');
    if (!a) return;
    e.preventDefault();
    open(Number(a.getAttribute('href')!.slice(6)) - 1, false);
  });

  // controls
  const from = () => pending ?? index;
  root.querySelector('.lb-prev')?.addEventListener('click', () => goTo(from() - 1));
  root.querySelector('.lb-next')?.addEventListener('click', () => goTo(from() + 1));
  closeBtn.addEventListener('click', () => close());
  // clicking the dark area around a photo closes it, but only with a mouse:
  // on a phone a slightly missed tap shouldn't throw you out of the viewer
  track.addEventListener('click', (e) => {
    if (e.target === e.currentTarget || (e.target as Element).classList.contains('lbx-slide')) {
      if (matchMedia('(pointer: fine)').matches) close();
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(from() - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(from() + 1); }
    else if (e.key === 'Tab') {   // keep focus inside the viewer
      const f = [...root.querySelectorAll<HTMLElement>('button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipes. The strip follows the finger natively; on release, any clear
  // sideways swipe (40px+) moves exactly one photo, however slow or short,
  // instead of relying on a fast flick (scroll-snap alone snaps short or slow
  // swipes back to the same photo). A clear downward swipe (90px+) closes.
  let x0 = 0, y0 = 0, startIdx = 0;
  root.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; startIdx = pending ?? current();
  }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (e.touches.length) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (dy > 90 && dy > Math.abs(dx) * 2) { close(); return; }
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
      const to = Math.max(0, Math.min(n - 1, startIdx + (dx < 0 ? 1 : -1)));
      requestAnimationFrame(() => goTo(to));
    }
  }, { passive: true });

  // keep the current photo in place when the phone rotates or the window resizes
  addEventListener('resize', () => { if (!root.hidden) track.scrollTo({ left: index * width(), behavior: 'instant' as ScrollBehavior }); });

  // arriving on a link straight to a photo (e.g. from the home page), or the
  // address being changed to one while on the page
  const fromHash = () => {
    const m = location.hash.match(/^#shot-(\d+)$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= n && root.hidden) open(Number(m[1]) - 1, true);
  };
  addEventListener('hashchange', fromHash);
  fromHash();
}
