/* Ranny's — the live open/closed status and past-event tidying, used by app.ts. */

export type HoursData = { tz?: string; days?: Record<number, [number, number][]> };
declare global {
  interface Window { __RANNYS__?: HoursData }
}

/* ---------- 1) live open / closed status ---------- */
const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function fmtTime(mins: number): string {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`;
}

export function nowInLondon(tz: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  const day = WEEKDAY[get('weekday') ?? ''] ?? new Date().getDay();
  let hour = parseInt(get('hour') ?? '0', 10);
  if (hour === 24) hour = 0;
  return { day, mins: hour * 60 + parseInt(get('minute') ?? '0', 10) };
}

export function computeStatus(data: HoursData) {
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

export function paintStatus() {
  const data = window.__RANNYS__;
  const nodes = document.querySelectorAll<HTMLElement>('[data-open-status]');
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

/* ---------- 5) tidy past events ---------- */
//  An event fades (and loses its links) for a week after it's been, then hides.
export function tidyEvents() {
  const list = document.querySelector('.event-list');
  if (!list) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  list.querySelectorAll('.event[data-date]').forEach((el) => {
    const iso = el.getAttribute('data-date');
    if (!iso) return;
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    const daysPast = Math.round((today.getTime() - d.getTime()) / 86400000);
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
    const note = document.querySelector<HTMLElement>('.events-none');
    if (note) note.hidden = false;
  }
}

