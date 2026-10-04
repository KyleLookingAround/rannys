/* Ranny's: GoatCounter events.
   Counts the actions that matter alongside page views: directions, ticket
   links, booking enquiries, email and mailing-list links, socials, menu and
   gallery photos, and supplier/maker links. Events show in the GoatCounter
   dashboard as their own "pages" (e.g. "tickets/christmas-wreath-making-2026-12-02").
   If GoatCounter isn't switched on (no site code) or hasn't loaded, nothing
   happens. Nothing personal is ever sent: only which button or link it was. */

type GoatCounter = { count?: (o: { path: string; title?: string; event?: boolean }) => void };
declare global {
  interface Window { goatcounter?: GoatCounter }
}

const slug = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export function track(path: string, title: string) {
  try { window.goatcounter?.count?.({ path, title, event: true }); } catch { /* never break the page */ }
}

/* where on the page a link was, for directions and email clicks */
function placement(el: Element): string {
  if (el.closest('.r-hero')) return 'top of home page';
  if (el.closest('#visit')) return 'Find us';
  if (el.closest('.foot')) return 'footer';
  if (el.closest('.r-duo')) return 'home page';
  return document.title.split(' — ')[0] || 'page';
}

function onClick(e: MouseEvent) {
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  let url: URL;
  try { url = new URL(href, location.href); } catch { return; }

  // Get directions (any Google Maps link)
  if (/(^|\.)google\.[a-z.]+$/.test(url.hostname) && url.pathname.startsWith('/maps')) {
    track('directions', `Get directions (${placement(a)})`);
    return;
  }

  // Ticket / details links on event cards (home "Coming up" and the Events page)
  const ev = a.closest<HTMLElement>('[data-date]');
  if (ev && url.origin !== location.origin && url.protocol.startsWith('http')) {
    const title = ev.querySelector('.r-event-title')?.textContent?.trim() || 'event';
    track(`tickets/${slug(title)}-${ev.dataset.date}`, `Tickets: ${title} (${ev.dataset.date})`);
    return;
  }

  // Email links: the mailing-list one is told apart by its subject
  if (url.protocol === 'mailto:') {
    const subject = decodeURIComponent(url.searchParams.get('subject') || '');
    if (/list/i.test(subject)) track('join-list', 'Join the list');
    else if (/booking/i.test(subject)) track('email/booking', 'Email about a booking');
    else track('email', `Email us (${placement(a)})`);
    return;
  }

  // Suppliers and local makers ("Who's behind it"), checked before socials
  // because several of them link to their own Instagram
  if (a.closest('.r-credits')) {
    const name = a.textContent?.replace('↗', '').trim() || url.hostname;
    track(`partner/${slug(name)}`, `Supplier/maker: ${name}`);
    return;
  }

  // Ranny's own socials
  if (/(^|\.)instagram\.com$/.test(url.hostname)) { track('social/instagram', `Instagram (${placement(a)})`); return; }
  if (/(^|\.)facebook\.com$/.test(url.hostname)) { track('social/facebook', `Facebook (${placement(a)})`); return; }
}

/* Photos shown in the full-screen viewer: menu photos and gallery photos,
   whether opened by tapping, swiping or arriving from a link */
let lastShot = '';
function onShot() {
  const box = document.querySelector('.lightbox:target');
  if (!box || box.id === lastShot) { if (!box) lastShot = ''; return; }
  lastShot = box.id;
  const caption = box.getAttribute('aria-label') || box.id;
  const onMenu = location.pathname.startsWith('/menu');
  track(`${onMenu ? 'menu-photo' : 'photo'}/${slug(caption)}`, `${onMenu ? 'Menu photo' : 'Photo'}: ${caption}`);
}

/* Booking form sent, by the kind of booking */
export function trackEnquiry(type: string) {
  track(`booking-enquiry/${slug(type || 'unspecified')}`, `Booking form sent: ${type || 'unspecified'}`);
}

export function wireAnalytics() {
  document.addEventListener('click', onClick, { capture: true });
  addEventListener('hashchange', onShot);
  // GoatCounter's script loads after ours; count a photo opened from a link once it's ready
  if (location.hash.startsWith('#shot-')) {
    let tries = 0;
    const wait = () => { if (window.goatcounter?.count) onShot(); else if (tries++ < 20) setTimeout(wait, 250); };
    wait();
  }
}
