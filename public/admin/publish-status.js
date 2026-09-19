/**
 * Publish status for the /admin editor.
 *
 * Saving here commits to main, which triggers the "Build & deploy" workflow.
 * If that workflow fails the old site simply stays live — nothing in the
 * editor says so, so an edit can look saved while the public site sits
 * unchanged for weeks. This watches the workflow and says, in plain English,
 * whether the last save actually reached rannys.co.uk.
 *
 * Reads the public GitHub API with no token (the repo is public). Polling is
 * paced to stay inside the 60-requests-per-hour unauthenticated limit: slow
 * when nothing is happening, quicker while a deploy is actually running, and
 * paused entirely while the tab is in the background.
 */
const REPO = 'KyleLookingAround/rannys'; // keep in step with backend.repo in config.yml
const RUNS_URL = `https://api.github.com/repos/${REPO}/actions/workflows/deploy.yml/runs?branch=main&per_page=1`;

const POLL_RUNNING = 15_000;
const POLL_FAILED = 60_000;
const POLL_IDLE = 120_000;

let lastSeenStatus = null;
let dismissedRunId = null;
let timer = null;

try {
  dismissedRunId = localStorage.getItem('rannys-publish-dismissed');
} catch {
  // Private window or blocked storage — just means dismissals don't stick.
}

const el = document.createElement('div');
el.className = 'publish-status';
el.setAttribute('role', 'status');
el.setAttribute('aria-live', 'polite');
el.hidden = true;
document.body.append(el);

const style = document.createElement('style');
style.textContent = `
  .publish-status {
    position: fixed; z-index: 9999; inset-inline: 16px; bottom: 16px;
    margin-inline: auto; max-width: 30rem;
    display: flex; gap: 12px; align-items: flex-start;
    padding: 14px 16px; border-radius: 12px;
    font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
    box-shadow: 0 8px 28px rgb(0 0 0 / 0.18);
    transition: opacity .3s ease, transform .3s ease;
  }
  .publish-status[hidden] { display: none; }
  .publish-status.is-leaving { opacity: 0; transform: translateY(8px); }
  .publish-status--bad { background: #fdf0ed; color: #5c1c0c; border: 1px solid #e8b4a6; }
  .publish-status--busy { background: #eef3fb; color: #1d3557; border: 1px solid #b9cbe8; }
  .publish-status--good { background: #eef7ec; color: #1e4620; border: 1px solid #b6d8b0; }
  .publish-status__icon { flex: none; font-size: 18px; line-height: 1.2; }
  .publish-status__body { flex: 1; min-width: 0; }
  .publish-status__title { font-weight: 700; margin: 0 0 2px; }
  .publish-status__text { margin: 0; }
  .publish-status__text a { color: inherit; }
  .publish-status__close {
    flex: none; background: none; border: 0; cursor: pointer;
    font-size: 18px; line-height: 1; padding: 2px 4px; color: inherit; opacity: .6;
  }
  .publish-status__close:hover { opacity: 1; }
  @media (prefers-reduced-motion: reduce) { .publish-status { transition: none; } }
`;
document.head.append(style);

// Commit messages and URLs come from the API, so they never reach innerHTML raw.
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function when(iso) {
  const then = new Date(iso);
  const time = then.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((midnight - then) / 86_400_000);
  if (dayDiff < 0) return `today at ${time}`;
  if (dayDiff < 1) return `yesterday at ${time}`;
  return `on ${then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${time}`;
}

// "Update The Site “events” +1" → "events"
function editName(message = '') {
  const match = message.match(/[“”"']([^“”"']+)[“”"']/);
  return match ? match[1] : null;
}

function render({ kind, title, html, runId }) {
  el.className = `publish-status publish-status--${kind}`;
  el.hidden = false;
  el.innerHTML = '';

  const icon = document.createElement('span');
  icon.className = 'publish-status__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = kind === 'bad' ? '⚠️' : kind === 'good' ? '✅' : '⏳';

  const body = document.createElement('div');
  body.className = 'publish-status__body';
  const h = document.createElement('p');
  h.className = 'publish-status__title';
  h.textContent = title;
  const p = document.createElement('p');
  p.className = 'publish-status__text';
  p.innerHTML = html; // built below from a fixed template, not from API text
  body.append(h, p);

  el.append(icon, body);

  if (kind === 'bad') {
    const close = document.createElement('button');
    close.className = 'publish-status__close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';
    close.addEventListener('click', () => {
      el.hidden = true;
      dismissedRunId = String(runId);
      try {
        localStorage.setItem('rannys-publish-dismissed', dismissedRunId);
      } catch {
        // Not critical — the banner just reappears on the next visit.
      }
    });
    el.append(close);
  }
}

function hideSoon() {
  el.classList.add('is-leaving');
  setTimeout(() => {
    el.hidden = true;
    el.classList.remove('is-leaving');
  }, 6000);
}

async function check() {
  let run;
  try {
    const res = await fetch(RUNS_URL, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(res.status);
    run = (await res.json()).workflow_runs?.[0];
  } catch {
    // Offline, rate-limited or GitHub having a moment. Say nothing rather
    // than cry wolf, and try again on the next slow tick.
    return POLL_IDLE;
  }
  if (!run) return POLL_IDLE;

  const running = run.status !== 'completed';
  const ok = run.conclusion === 'success';
  const name = editName(run.head_commit?.message);
  const which = name ? `Your <strong>${esc(name)}</strong> change` : 'Your last change';
  const runUrl = String(run.html_url || '').startsWith('https://github.com/') ? run.html_url : null;
  const previous = lastSeenStatus;
  lastSeenStatus = running ? 'running' : run.conclusion;

  if (running) {
    render({
      kind: 'busy',
      title: 'Publishing your changes…',
      html: 'This usually takes about a minute. You can carry on editing.',
    });
    return POLL_RUNNING;
  }

  if (ok) {
    // Only worth saying if she was watching it happen — otherwise silence.
    if (previous === 'running') {
      render({
        kind: 'good',
        title: 'That\'s live',
        html: `${which} is now showing on <a href="https://rannys.co.uk/" target="_blank" rel="noopener">rannys.co.uk</a>.`,
      });
      hideSoon();
    } else if (previous === null) {
      el.hidden = true;
    }
    return POLL_IDLE;
  }

  if (String(run.id) === dismissedRunId) return POLL_FAILED;

  render({
    kind: 'bad',
    runId: run.id,
    title: 'This hasn\'t gone live yet',
    html: `${which} from ${esc(when(run.created_at))} couldn't be published, so the site is
           still showing the version before it. It's usually a date or a link typed in an odd
           format. ${runUrl ? `<a href="${esc(runUrl)}" target="_blank" rel="noopener">See what went wrong</a>, or give` : 'Give'}
           Kyle a shout.`,
  });
  return POLL_FAILED;
}

async function tick() {
  clearTimeout(timer);
  const next = document.hidden ? POLL_IDLE : await check();
  timer = setTimeout(tick, next);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});

tick();
