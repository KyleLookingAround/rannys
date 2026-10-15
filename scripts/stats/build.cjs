// Builds the shareable copies of the visitor-stats dashboard from fetch.py's files:
//   node build.cjs html DATA_DIR OUT.html            one self-contained page, every month, switchable
//   node build.cjs pdf  DATA_DIR MONTH OUT.pdf        an A4 PDF of one month (e.g. 2026-10)
// page.html is the dashboard's own page; a small stand-in for the dashboard's `dash` feeds it the files.
// Needs d3 and playwright-core installed next to it (npm i d3@7.9.0 playwright-core@1.47.2) and,
// for PDFs, a Chromium headless shell (CHROMIUM env var, else the cloud sessions' copy).
const fs = require('fs');
const path = require('path');

const FONTS = path.join(__dirname, '../../public/assets/fonts');
const FONT_IDS = { // the font files as stored with the dashboard
  '/_blob/3dfba8d93b6949aa4be9163daaf0e726': 'archivo.woff2',
  '/_blob/c28c13dafcb8671e4dbc933ca7b0c196': 'dmsans.woff2',
  '/_blob/89e79ab96ea0df832c7cc4eae343cfb0': 'caveat.woff2',
};
const DATASETS = ['periods', 'totals', 'daily', 'pages', 'clicks', 'sources', 'audience'];

function d3Source() {
  const entry = require.resolve('d3');
  return fs.readFileSync(path.join(entry.slice(0, entry.lastIndexOf(path.sep + 'd3' + path.sep) + 4), 'dist/d3.min.js'), 'utf8');
}

function page(dataDir, { month, pdf }) {
  let html = fs.readFileSync(path.join(__dirname, 'page.html'), 'utf8');
  for (const [id, file] of Object.entries(FONT_IDS)) {
    html = html.replace(id, 'data:font/woff2;base64,' + fs.readFileSync(path.join(FONTS, file)).toString('base64'));
  }
  const data = Object.fromEntries(DATASETS.map((id) => [id, JSON.parse(fs.readFileSync(path.join(dataDir, id + '.json'), 'utf8'))]));
  if (!pdf) data.periods = data.periods.map((p) => ({ ...p, pdf: '' })); // the file can't reach the dashboard's PDFs
  const stub = `
window.__data = ${JSON.stringify(data)};
(() => {
  const calcs = {}, draws = [];
  let params = ${JSON.stringify(month ? { month } : {})};
  const redraw = () => draws.forEach((fn) => fn());
  window.dash = {
    calc(id, c) { calcs[id] = c; },
    data(id) {
      if (calcs[id]) return { status: 'ok', data: calcs[id].fn(...calcs[id].inputs.map((i) => dash.data(i).data)) };
      return { status: 'ok', data: window.__data[id] };
    },
    onData(fn) { draws.push(fn); },
    params() { return params; },
    setParams(p) { params = { ...params, ...p }; redraw(); },
    resetParams() { params = {}; redraw(); },
    setLink() {}, refresh() {},
  };
  window.__redraw = redraw;
  addEventListener('DOMContentLoaded', () => document.fonts.ready.then(() => { redraw(); window.__done = true; }));
  let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(redraw, 150); });
})();`;
  const printCss = `
@page { size: A4; margin: 10mm; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media print {
  body { padding: 0 !important; }
  .rs { border: 0 !important; border-radius: 0 !important; }
  .rs-card, .rs-kpi, .rs-head { break-inside: avoid; }
  .rs-tablebox.rs-tall { max-height: none !important; overflow: visible !important; }
  .rs-table th { position: static !important; }
  .rs-pdf, .rs-step, .rs-hand { display: none !important; }
}`;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ranny's Visitor Stats</title>
<style>html, body { margin: 0; background: #f3ead8; } body { padding: 16px; }${printCss}</style>
<script>${d3Source()}</script>
<script>${stub}</script>
</head>
<body>
<div id="dash-root">
${html}
</div>
</body>
</html>
`;
}

async function pdf(dataDir, month, out) {
  const { chromium } = require('playwright-core');
  const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  const tmp = out.replace(/\.pdf$/, '') + '.render.html';
  fs.writeFileSync(tmp, page(dataDir, { month, pdf: true }));
  const browser = await chromium.launch({ executablePath: exe });
  try {
    const p = await browser.newPage({ viewport: { width: 900, height: 1200 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto('file://' + path.resolve(tmp));
    await p.waitForFunction('window.__done === true');
    await p.emulateMedia({ media: 'print' });
    await p.evaluate(() => window.__redraw());
    await p.pdf({ path: out, format: 'A4', printBackground: true, scale: 0.8, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
    if (errors.length) throw new Error('page errors: ' + errors.join(' | '));
  } finally {
    await browser.close();
    fs.rmSync(tmp, { force: true });
  }
}

const [mode, dataDir, ...rest] = process.argv.slice(2);
if (mode === 'html') {
  fs.writeFileSync(rest[0], page(dataDir, {}));
  console.log('wrote', rest[0]);
} else if (mode === 'pdf') {
  pdf(dataDir, rest[0], rest[1]).then(() => console.log('wrote', rest[1]), (e) => { console.error(e.message); process.exit(1); });
} else {
  console.error('usage: node build.cjs html DATA_DIR OUT.html | pdf DATA_DIR MONTH OUT.pdf');
  process.exit(2);
}
