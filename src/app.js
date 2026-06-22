/* Ranny's — progressive enhancement.
   The site works fully without this file; it just adds live touches:
   1) a real "open now / closed" status from the hours in content/site.yml
   2) keyboard support for the burger menu and photo lightbox
   3) a lazy-loaded 3D enamel mug on the home hero (see mug.js)            */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1) live open / closed status ---------- */
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmtTime(mins) {
  let h = Math.floor(mins / 60), m = mins % 60;
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`;
}

function nowInLondon(tz) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = WEEKDAY[get('weekday')] ?? new Date().getDay();
  let hour = parseInt(get('hour'), 10); if (hour === 24) hour = 0;
  return { day, mins: hour * 60 + parseInt(get('minute'), 10) };
}

function computeStatus(data) {
  const days = data.days || {};
  const { day, mins } = nowInLondon(data.tz || 'Europe/London');

  for (const [o, c] of (days[day] || [])) {
    if (mins >= o && mins < c) {
      const left = c - mins;
      return left <= 30
        ? { state: 'soon', main: 'Closing soon', sub: `til ${fmtTime(c)}` }
        : { state: 'open', main: 'Open now', sub: `til ${fmtTime(c)}` };
    }
  }
  // closed — find the next opening within the week
  for (let off = 0; off < 8; off++) {
    const d = (day + off) % 7;
    for (const [o] of (days[d] || []).slice().sort((a, b) => a[0] - b[0])) {
      if (off === 0 && o <= mins) continue;
      const when = off === 0 ? fmtTime(o) : off === 1 ? `tomorrow ${fmtTime(o)}` : `${DAY_NAME[d]} ${fmtTime(o)}`;
      return { state: 'closed', main: 'Closed', sub: `opens ${when}` };
    }
  }
  return { state: 'closed', main: 'Closed', sub: '' };
}

function paintStatus() {
  const data = window.__RANNYS__;
  const nodes = document.querySelectorAll('[data-open-status]');
  if (!data || !nodes.length) return;
  const s = computeStatus(data);
  nodes.forEach((el) => {
    el.dataset.state = s.state;
    const main = el.querySelector('.status-text');
    const sub = el.querySelector('.of-sub');
    if (main) main.textContent = s.main;
    if (sub) sub.textContent = s.sub;
    el.setAttribute('title', `${s.main}${s.sub ? ' · ' + s.sub : ''}`);
  });
}

/* ---------- 2) keyboard support ---------- */
function wireBurger() {
  const burger = document.querySelector('.burger');
  const toggle = document.getElementById('nav-toggle');
  if (!burger || !toggle) return;
  burger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.checked = !toggle.checked; sync(); }
  });
  const sync = () => burger.setAttribute('aria-expanded', String(toggle.checked));
  toggle.addEventListener('change', sync);
  document.querySelectorAll('.topbar nav a').forEach((a) =>
    a.addEventListener('click', () => { toggle.checked = false; sync(); }));
}

function wireLightbox() {
  const go = (sel, box) => { const a = box.querySelector(sel); if (a) location.href = a.getAttribute('href'); };
  document.addEventListener('keydown', (e) => {
    const box = document.querySelector('.lightbox:target');
    if (!box) return;
    if (e.key === 'Escape') go('.lb-close', box);
    else if (e.key === 'ArrowLeft') go('.lb-prev', box);
    else if (e.key === 'ArrowRight') go('.lb-next', box);
  });
  // move focus to the open lightbox's close button for keyboard users
  addEventListener('hashchange', () => {
    const box = document.querySelector('.lightbox:target');
    if (box) box.querySelector('.lb-close')?.focus();
  });
}

/* ---------- 3) lazy 3D mug on the home hero ---------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
function maybeMountMug() {
  const stage = document.querySelector('[data-mug]');
  if (!stage || reduceMotion || !hasWebGL()) return;   // stage stays hidden
  stage.hidden = false;                                 // reveal now we'll mount
  const start = () => import('./mug.js').then((m) => m.mountMug(stage)).catch(() => { stage.hidden = true; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    });
    io.observe(stage);
  } else { start(); }
}

/* ---------- 5) tidy past events ---------- */
//  An event fades (and loses its links) for a week after it's been, then hides.
function tidyEvents() {
  const list = document.querySelector('.event-list');
  if (!list) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  list.querySelectorAll('.event[data-date]').forEach((el) => {
    const iso = el.getAttribute('data-date');
    if (!iso) return;
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return;
    const daysPast = Math.round((today - d) / 86400000);
    if (daysPast > 7) { el.remove(); return; }       // over a week old → hide
    if (daysPast >= 1) {                              // been & gone → fade, links off
      el.classList.add('is-past');
      el.querySelectorAll('.event-link, .sold-out').forEach((n) => n.remove());
      const title = el.querySelector('.event-title');
      if (title && !title.querySelector('.gone')) {
        const tag = document.createElement('span');
        tag.className = 'gone'; tag.textContent = 'Been & gone';
        title.append(' ', tag);
      }
    }
  });
  if (!list.querySelector('.event')) {                // nothing left → show the note
    list.remove();
    const note = document.querySelector('.events-none');
    if (note) note.hidden = false;
  }
}

/* ---------- boot ---------- */
paintStatus();
setInterval(paintStatus, 60000);
wireBurger();
wireLightbox();
tidyEvents();
maybeMountMug();
