/* Ranny's — progressive enhancement.
   Pages work without it; this adds the live status, today's hours,
   the "coming up" events, dots under the swipe rows, the photo viewer
   (viewer.ts), and the booking enquiry builder. */
import { paintStatus, tidyEvents, fmtTime, nowInLondon } from './shared';
import { wireAnalytics, trackEnquiry } from './analytics';
import { wireViewer } from './viewer';

/* today's opening hours, e.g. "Today 7am – 4pm" or "Closed today" */
function paintToday() {
  const data = window.__RANNYS__;
  if (!data) return;
  const { day } = nowInLondon(data.tz || 'Europe/London');
  const slots = data.days?.[day] || [];
  const text = slots.length
    ? 'Today ' + slots.map(([o, c]) => `${fmtTime(o)} – ${fmtTime(c)}`).join(', ')
    : 'Closed today';
  document.querySelectorAll<HTMLElement>('[data-today-hours]').forEach((el) => { el.textContent = text; });
  document.querySelectorAll<HTMLElement>('[data-days]').forEach((row) => {
    const days = (row.dataset.days || '').split(',').map(Number);
    row.classList.toggle('is-today', days.includes(day));
  });
}

/* after past events are tidied away, the first one left is "next up" */
function markNext() {
  const first = document.querySelector('.event-list .event:not(.is-past)');
  first?.classList.add('is-next');
}

/* home page "Coming up": drop events that have passed since the last
   rebuild, show the next few (data-show) and tag the first "Next up" */
function pickNext() {
  const section = document.querySelector<HTMLElement>('[data-next]');
  if (!section) return;
  const show = Number(section.dataset.show) || 3;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cards = [...section.querySelectorAll<HTMLElement>('[data-date]')];
  const live = cards.filter((c) => new Date(c.dataset.date + 'T00:00:00') >= today).slice(0, show);
  cards.forEach((c) => {
    c.hidden = !live.includes(c);
    c.classList.toggle('is-next', c === live[0]);
  });
  if (!live.length) section.hidden = true;
}

/* dots under each swipe row: show where you are, tap to jump */
function wireDots() {
  const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  document.querySelectorAll<HTMLElement>('.r-scroller').forEach((row) => {
    const items = [...row.children].filter((c) => !(c as HTMLElement).hidden) as HTMLElement[];
    if (items.length < 2) return;
    const dots = document.createElement('div');
    dots.className = 'r-dots';
    const label = row.getAttribute('aria-label') || 'Items';
    items.forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `${label}: ${i + 1} of ${items.length}`);
      b.addEventListener('click', () => {
        const pad = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
        const left = item.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft - pad;
        row.scrollTo({ left, behavior: smooth as ScrollBehavior });
      });
      dots.append(b);
    });
    row.after(dots);
    const buttons = [...dots.children] as HTMLElement[];
    const update = () => {
      dots.hidden = row.scrollWidth <= row.clientWidth + 2;   // everything fits: no dots
      const x = row.getBoundingClientRect().left + (parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0);
      let best = 0, bestD = Infinity;
      items.forEach((item, i) => {
        const d = Math.abs(item.getBoundingClientRect().left - x);
        if (d < bestD) { bestD = d; best = i; }
      });
      // at the far end, the last card counts as current
      if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) best = items.length - 1;
      buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === best)));
    };
    let ticking = false;
    row.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); }
    }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  });
}

/* the booking form builds an email; with no JS the plain email link still works */
function wireEnquiry() {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const val = (k: string) => String(f.get(k) || '').trim();
    const subject = `Booking enquiry: ${val('type') || 'a booking'}`;
    const lines = [`Hi Ranny's,`, '', `I'd like to ask about: ${val('type')}`];
    if (val('date')) lines.push(`Date: ${val('date')}`);
    if (val('people')) lines.push(`Roughly how many: ${val('people')}`);
    if (val('details')) lines.push('', val('details'));
    lines.push('', 'Thanks,', val('name'));
    const body = lines.join('\n');
    trackEnquiry(val('type'));
    location.href = `mailto:${form.dataset.enquiry}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const done = form.querySelector<HTMLElement>('.enq-done');
    if (done) done.hidden = false;
  });
}

/* photo skeletons: mark each image loaded so its placeholder clears;
   ones that arrive after the page appears fade in */
function wireSkeletons() {
  const done = (img: HTMLImageElement, fade: boolean) => {
    img.classList.add('is-loaded');
    if (fade) img.classList.add('fade-in');
  };
  document.querySelectorAll<HTMLImageElement>('main img, .lb-figure img').forEach((img) => {
    if (img.complete && img.naturalWidth) { done(img, false); return; }
    img.addEventListener('load', () => done(img, true), { once: true });
    img.addEventListener('error', () => done(img, false), { once: true });
  });
}

wireSkeletons();
paintStatus();
paintToday();
setInterval(() => { paintStatus(); paintToday(); }, 60000);
tidyEvents();
markNext();
pickNext();
wireDots();
wireViewer();
wireEnquiry();
wireAnalytics();
