# Visitor stats dashboard

Ranny's GoatCounter stats live in a private online dashboard, one page per
calendar month. The first month is the exception: tracking began on 4 October
2026, so October covers 4-31 Oct. A scheduled task refreshes the dashboard on
the 1st of every month, once the month before has finished. The dashboard's address is in that task's prompt.

None of this is part of the website build.

| File | What it does |
|---|---|
| `fetch.py` | Pulls every month from the GoatCounter API into seven JSON files, each row tagged with its `month` (e.g. `2026-10`). |
| `page.html` | The dashboard page: brand styles, the month switcher, the charts and tables. |
| `build.cjs` | Builds the shareable copies: an A4 PDF of one month, or one self-contained `.html` with every month. |

The GoatCounter API key never appears in this code. In the cloud
environment the network proxy adds it for `rannys.goatcounter.com`. Anywhere
else, set `GOATCOUNTER_TOKEN`.

## The monthly refresh

These are the steps the scheduled task follows. `$OUT` is a scratch folder;
`$URL` is the dashboard's address from the task's prompt.

1. **Get the data.**
   `python3 scripts/stats/fetch.py $OUT`
   This writes `periods`, `totals`, `daily`, `pages`, `clicks`, `sources` and
   `audience` `.json` files. Check the printed months. The month that just
   ended should be listed without "so far". GoatCounter sometimes returns 502
   errors; the script retries them.
2. **Install the build tools in a scratch folder, not the repo.**
   `npm i --prefix $TOOLS d3@7.9.0 playwright-core@1.47.2`, then
   `ln -s $TOOLS/node_modules scripts/stats/node_modules`. Remove the link
   when you're done.
3. **Keep the PDFs that already exist.** Read the dashboard's `datasets/periods`
   document and download its file. Copy each month's `pdf` into the new
   `periods.json` for every month that was already complete last time.
4. **Make a PDF for each month that needs one.** That means every month
   without a PDF, plus any month that was "so far" last time:
   `node scripts/stats/build.cjs pdf $OUT 2026-11 $OUT/rannys-visitor-stats-2026-11.pdf`.
   Upload each one to the dashboard as an asset and put its url in that
   month's `pdf` field in `periods.json`.
5. **Upload the seven JSON files** to the dashboard as assets. Then update each
   `datasets/<id>` document's `source.url`, `source.name` and `updated`.
6. **Republish the page** only if `page.html` changed. It is stored as `files/index.html`.
7. **Delete the replaced assets**: last month's seven data files, plus any PDF
   a new one replaced. List the assets first and keep the fonts and every PDF
   that `periods.json` still points to.
8. **Build the shareable copy.**
   `node scripts/stats/build.cjs html $OUT rannys-visitor-stats.html`
   Send it to Kyle along with a few lines on the month that just ended,
   compared with the month before.

The font asset ids in `build.cjs` and `page.html` belong to the dashboard's
uploaded copies of `public/assets/fonts/`. If those fonts are ever
re-uploaded, update the ids in both files.
