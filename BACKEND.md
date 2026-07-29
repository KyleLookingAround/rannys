# Backend possibilities

A survey of what a "backend" could add to the Ranny's site, what each option
costs in money and in upkeep, and what's actually worth doing.

**Short version:** the site should stay static. Three specific jobs would
benefit from something behind them — booking enquiries, the mailing list, and
signing in to the editor — and all three are solved by small hosted services,
not by a server we'd have to run. Recommended shopping list is at the bottom:
about £0–110/year and a couple of afternoons of setup.

---

## Where things stand

The site is built by Astro from six YAML files and published to GitHub Pages.
Every page is a finished `.html` file on a CDN. There's no server, no database,
nothing to patch, nothing that can fall over at 7am on a Saturday. Hosting is
free, it's fast, and the whole thing is recoverable from the repo.

That's a genuinely good position, and most of this document is about protecting
it. GitHub Pages serves files and nothing else — it cannot run code when a
visitor submits a form. So anything that needs to *receive* something from a
visitor has to happen somewhere else. The question is only ever *where*, and
whether it's someone else's problem or ours.

Three things currently work around that limit with a `mailto:` link:

| Job | Today | The problem with it |
|---|---|---|
| Booking enquiries | Opens the visitor's email app with a pre-filled template (`src/pages/bookings.astro`) | Breaks for anyone on webmail without a mail client configured; nothing captured if they abandon it; no record beyond the inbox; on mobile it's a jarring hand-off |
| Mailing list | Same — "Join the list" opens an email (`content/home.yml` → `mailingList`) | Nobody joins a mailing list by writing an email. Realistically this collects almost nothing. There's already a hook (`mailingList.action`) waiting for a real form URL |
| Editor sign-in | A GitHub personal access token, pasted into `/admin/` | Expires; the renewal dance is genuinely awful for a non-technical user; editing just stops working with an auth error and no explanation |

Everything else on the site — hours, menu, events, photos — is content, and
content is already handled well by the YAML-plus-editor setup. Making those
dynamic would be a downgrade.

---

## The three routes

Before the specifics, the three architectural shapes this could take.

### Route A — stay static, bolt on hosted services *(recommended)*

Keep GitHub Pages. Point forms at a form service, the mailing list at a
newsletter service, and the editor at a tiny auth helper. Nothing new to
maintain; each piece is independently replaceable; if one vendor disappears the
site itself is unaffected.

**Cost:** £0 to ~£110/year depending on choices. **Effort:** an afternoon each.
**Risk:** low. Failure mode is "the form stops working", never "the site is
down".

### Route B — move hosting to Cloudflare Pages, write our own functions

Cloudflare Pages serves static files exactly like GitHub Pages but also runs
small serverless functions on the same domain — so `/api/enquiry` could be our
own code that emails Rhianne, saves to a database, whatever. The free tier is
100,000 requests a day, which for a Stockport coffee shop is effectively
unlimited. Deployment stays "push to `main`".

This buys total control and no per-form vendor. It costs: DNS has to move,
someone has to write and own that code, and it puts the site's hosting on a
platform where a broken function deploy is now a thing that can happen. For
three forms that a hosted service does for free, it's not a good trade —
**unless** we end up wanting something genuinely custom (loyalty, ordering,
anything with logic), at which point this becomes the right answer.

**Cost:** £0/year hosting. **Effort:** half a day to migrate, then ongoing
ownership of real code. **Risk:** moderate — more to go wrong, and it needs a
developer around.

### Route C — a real application (Next.js/Rails/etc. with a database)

Dynamic pages, user accounts, live availability, an admin dashboard. Nothing
Ranny's needs comes close to justifying this. It would turn a free, permanent,
zero-maintenance site into a monthly bill with a security surface and a
dependency on someone being available to maintain it. **Not recommended, and
worth saying so explicitly** so the option is closed rather than lingering.

---

## Job 1 — booking enquiries

Private hire, group meet-ups, celebrations. These are *enquiries* that end in a
conversation, not real-time table reservations — the bookings page says as much
("No forms, no faff"). That framing is right for the shop, and it means we need
a good enquiry form, not a booking engine.

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Tally** (embedded or linked form) | Free, unlimited submissions | ~1 hour | Genuinely unlimited on the free tier; conditional logic, file uploads and payments included. Emails on each response, keeps a table of everything. Free tier shows light Tally branding. Best value by a distance |
| **Formspree** (post our own HTML form) | Free = 50/month, then $15/mo | ~1 hour | Keeps our own markup and styling — the form looks like the site, not like a Google Form. 50/month is plenty here. Paid tier is poor value at this volume |
| Google Forms | Free | ~30 min | Works, free, everyone understands it. Looks nothing like the site — a hard visual break from a carefully designed page |
| A booking system (SimplyBook, Resova, etc.) | ~£20–30/mo | Half a day | Calendars, deposits, availability. Overkill for a handful of enquiries a month, and it fights the shop's "just ask us" tone |
| Own endpoint on Cloudflare Pages Functions | Free | Half a day + ownership | Only sensible if we've already moved for other reasons |

**Recommendation: Formspree on the free tier, keeping our own form markup**, so
the bookings page stays visually ours. Switch to Tally if enquiries ever pass
~50 a month, or immediately if the priority is zero cost forever and the
branding compromise is acceptable.

Either way, keep the email address and the `mailto:` link on the page as a
fallback. Some people just want to email, and the form should never be the only
door.

**Two things to do regardless:**

- **Spam.** Any public form gets bot traffic. A hidden honeypot field costs
  nothing and stops most of it; Cloudflare Turnstile (free) handles the rest if
  needed. Formspree and Tally both include filtering.
- **Where replies land.** Enquiries should reach an inbox someone actually
  watches — `info@auntyrannys.com` today. Worth confirming that's monitored
  before pointing a form at it.

---

## Job 2 — the mailing list

The site is already built for this: `content/home.yml` has an empty `action`
field, and `src/pages/index.astro` renders a real subscribe form the moment
it's filled in. No code needed — just a URL from a provider.

| Option | Cost | Notes |
|---|---|---|
| **Buttondown** | Free to 100 subscribers, $9/mo to 1,000 | Plain, writer-focused, no dark patterns. Handles unsubscribes and compliance. The £9/mo point arrives only once the list is real |
| **Mailchimp** | Free = 250 contacts / 500 sends a month | The free tier was cut hard for 2026 — 500 sends a month means 250 subscribers can be emailed twice. Fine for a while, then it gets expensive. Ubiquitous and familiar, which counts for something |
| **MailerLite / Kit** | Free tiers around 500–1,000 subscribers | More generous free tiers than Mailchimp; heavier interfaces. Worth a look if the list grows fast |
| Collect addresses ourselves | "Free" | Means storing personal data ourselves, writing our own unsubscribe handling, and getting deliverability right. Don't. This is exactly what these services are for |

**Recommendation: Buttondown free tier.** Paste its form URL into
`mailingList.action`, set `fieldName` to `email`, save in `/admin/`. The form
appears on the home page on the next build. Revisit if the list passes 100.

**Legal, briefly and non-negotiably:** this is a UK list, so under UK GDPR and
PECR, subscribing must be a deliberate opt-in (the form is — good), every email
needs a working unsubscribe link (the providers handle this), and the site
should say what we do with the address. The site currently has no privacy
notice. Before the list goes live it needs one — a short, plain-English page is
fine and fits the site's voice. Worth doing at the same time as the form, not
after.

---

## Job 3 — signing in to the editor

The personal-access-token flow is the worst part of the current setup for the
person who actually uses it, and it's already flagged as a next step in the
README.

Sveltia CMS (what `/admin/` runs) supports proper "Sign in with GitHub" via a
small open-source Cloudflare Workers script,
[`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth). It's
deployed once, free on Cloudflare's tier, and then sign-in is a button. Setup is
four steps: deploy the worker, register a GitHub OAuth app, set two environment
variables, add `base_url` to `public/admin/config.yml`.

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **`sveltia-cms-auth` on Cloudflare Workers** | Free | ~1 hour, one time | The intended solution. No tokens, no expiry, no renewal dance. Small ongoing dependency on a Cloudflare account existing |
| Leave the PAT flow | Free | None | Works until the token expires, then editing breaks confusingly. A support call waiting to happen |
| A hosted CMS (Contentful, Sanity, Storyblok…) | Free tiers, then £££ | Days | Replaces the whole editing setup and moves content out of the repo. The current setup's best property is that content is plain text in Git — don't trade that away |

**Recommendation: deploy `sveltia-cms-auth`.** Highest quality-of-life return of
anything in this document, one hour, free. It should probably be first.

---

## Things that would need a real backend (and whether they're worth it)

For completeness, the ideas that genuinely can't be done statically:

- **Online ordering / click-and-collect.** Needs payments, order routing and a
  screen in the shop. If this is ever wanted, use Square or a similar EPOS
  product — not custom code. It's a business decision with a monthly fee, not a
  website feature.
- **Gift vouchers.** A Stripe payment link would do it, no backend at all, and
  can sit on the site as a button. Genuinely easy if wanted.
- **Event RSVPs / ticketing.** Same shape as bookings — a Tally form per event,
  or Eventbrite if tickets are paid. `content/events.yml` could gain an optional
  `link` field so any event can point at one.
- **Live table availability.** Requires the shop to keep a system up to date
  minute by minute. For a room this size that's more work than it saves.
- **Loyalty scheme.** Off-the-shelf app, or a stamp card. Not a website.

The pattern: each of these is either "buy the product" or "not worth it".
None of them argue for building a server.

---

## Recommended plan

In order, cheapest and highest-value first:

1. **Editor sign-in with GitHub** — deploy `sveltia-cms-auth`. Free, ~1 hour.
   Removes the only recurring pain in the current setup.
2. **Mailing list** — Buttondown free tier, paste the URL into
   `content/home.yml`, and add a short privacy notice page. Free, ~1 hour.
3. **Booking enquiry form** — Formspree free tier, keeping our own markup and
   styling; keep the email fallback alongside it. Free at current volumes,
   ~1 hour.

**Total: £0/year at current scale**, rising to roughly £110/year only if the
mailing list passes 100 subscribers ($9/mo). Nothing new to maintain, no new
hosting, and the site stays a pile of static files that will still be working
in five years without anyone touching it.

Revisit Route B (Cloudflare Pages + Functions) only if a genuinely custom
feature comes up. It's a good option, it's free, and the migration is
straightforward — it's just not justified by three forms.

---

### Sources

Pricing and limits checked July 2026 — worth re-checking before committing, as
free tiers move (Mailchimp's just did).

- [Formspree pricing](https://formspree.io/plans) · [free-plan limits summary](https://splitforms.com/formspree-free-plan-limits)
- [Tally pricing](https://tally.so/pricing) · [plans explained](https://tally.so/help/plans-and-pricing)
- [Buttondown pricing](https://buttondown.com/pricing)
- [Mailchimp pricing plans](https://mailchimp.com/help/about-mailchimp-pricing-plans/) · [2026 free-tier changes](https://www.beehiiv.com/blog/navigating-mailchimp-s-new-free-limits-essential-updates-for-newsletter-owners)
- [Cloudflare Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [sveltia-cms-auth setup](https://github.com/sveltia/sveltia-cms-auth/blob/main/README.md)
