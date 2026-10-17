# Owner's guide

Everything here is yours: the code (this repo), the content (Markdown files in the repo), the domain (registered in your name) and the email list (your MailerLite account).

## What's in the box

| Part | Where |
|---|---|
| Hero + home page | `src/components/Hero.astro`, `src/pages/index.astro`, `src/scripts/hero.ts`, `src/lib/hero-curves.ts` |
| Calculators (maths) | `src/lib/calculators/finance.ts`, one file per calculator in `src/lib/calculators/defs/` |
| Calculator page + gate | `src/components/CalculatorApp.astro`, `src/scripts/calculator.ts` |
| Signup endpoint (MailerLite) | `functions/api/subscribe.js` |
| Topics (Budgeting, Debt & credit, Saving & investing, Home & mortgages) | `src/lib/topics.ts` |
| Blog posts | `src/content/blog/*.md` |
| Colours, fonts, spacing | `src/styles/global.css` (top of the file) |
| Site name, currency, contact email | `src/config.ts` |
| Tests | `tests/` (run `npm test`) |
| Design screenshots | `docs/design/` |

## Run it on your computer

```bash
npm install
npm run dev          # live-reloading site at http://localhost:4321
npm test             # calculator tests
npm run build        # builds the site into ./dist
npm run serve        # serves ./dist with a pretend signup endpoint (no email service needed)
```

## Add a blog post

Create a file in `src/content/blog/`, for example `my-new-post.md`. The file name becomes the address: `/blog/my-new-post`.

```md
---
title: "Keep under about 60 characters"
description: "One or two sentences, 50-170 characters. Shown in Google results."
date: 2026-11-01
topic: "home"                  # one of: budgeting, debt, saving, home (see src/lib/topics.ts)
tags: ["mortgage", "interest"]
calculator: "mortgage-extra-payments"   # optional: embeds that calculator under the article
affiliate: false               # true shows the affiliate disclosure at the top
draft: false                   # true hides it from the live site
---
Write in normal Markdown here. Use ## for headings and | tables | like this |.
```

Every post appears on its topic page (`/topics/<topic>`) and automatically gets: SEO title/description, clean URL, sitemap entry, structured data, a reading time, related posts and the "Get the free guide" invitation at the end.

## Add a calculator

1. Copy any file in `src/lib/calculators/defs/` to a new file, e.g. `savings-goal.ts`.
2. Change the `slug`, `title`, `topics` (which topic pages list it), `blurb`, `inputs` (the fields), `assumptions` (always shown beside results) and `compute` (your formula).
3. Put reusable maths in `finance.ts` and add a test in `tests/`.

That is all. The calculator is picked up automatically: it appears on the home page, in `/calculators`, on its topic pages, gets its own page `/calculators/<slug>`, the email gate, the sitemap entry, and can be embedded in a post with `calculator: "<slug>"`.

`compute(values)` receives the numbers the visitor typed (keyed by each input's `id`) and returns a headline number, a list of rows, optionally a two-line chart, and optional warnings. Look at an existing file; they are short.

### Plugging in your own formulas and test cases

The four launch calculators use standard formulas, written down as the "assumptions" on each page. When you send your formulas and test cases, replace the maths in that calculator's file and add your cases to `tests/calculators.test.ts` (each is one `expect(...)`). `npm test` must pass before you publish.

## Add or change a topic

Topics live in `src/lib/topics.ts`: a name, a one-line blurb, three "basics" (rules of thumb shown on the topic page) and an icon. Add one and its page `/topics/<slug>` appears, it shows on the home page and calculators page, and posts and calculators can point at it.

The four "money habits" figures on the home page are calculated from the calculators at build time, so they always match the calculators. To change the example numbers, edit `src/pages/index.astro`.

## Going live (recommended: Cloudflare Pages)

1. Buy your domain in your own name (Cloudflare Registrar sells at cost; any registrar works).
2. Push this repo to your own GitHub account.
3. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
   - Build command: `npm run build`
   - Output directory: `dist`
4. **Settings → Variables and Secrets** (add as *secrets* where marked):
   - `MAILERLITE_API_KEY` (secret)
   - `MAILERLITE_GROUP_ID`
   - `SITE_URL` = `https://yourdomain.com` (build variable)
   - `PUBLIC_PLAUSIBLE_DOMAIN` = `yourdomain.com` (optional, build variable)
5. **Custom domains** → add your domain. Cloudflare sets up HTTPS automatically.
6. Update `public/robots.txt` (the Sitemap line) and `src/config.ts` (`contactEmail`, `legalName`, `privacyOfficer`, `currency`).

Every push to the main branch redeploys the site. Pull requests get their own preview link.

## Email service setup (MailerLite)

1. Create a MailerLite account. Under **Subscribers → Groups**, create a group called "Website signups". Copy its ID into `MAILERLITE_GROUP_ID`.
2. **Integrations → API → Generate new token** → `MAILERLITE_API_KEY`.
3. **Subscribers → Fields**: add a text field named `source_page`. The site fills it with the page each person signed up on, so you can see which pages earn signups.
4. **Automations → Create**: trigger "When a subscriber joins a group" → your group → send the welcome email with your PDF guide attached or linked.
5. Turn on **double opt-in** (Account settings → Subscribe settings) if you want confirmed emails. People can still use the calculators straight away; the confirmation protects your list quality.
6. Add the physical address and unsubscribe link MailerLite requires in your email footer. The site's `/unsubscribe` page explains the route.

Why MailerLite: a free plan for a small starting list, a simple API, built-in automations and double opt-in, and it is EU-based. ConvertKit/Kit is a fine alternative with nicer creator tools but costs more at the start. Switching is a one-file change in `functions/api/subscribe.js`.

## How the gate works (and its honest limits)

- Signing up sets an `mms_access` cookie (and a copy in local storage). Calculators show real results when it is present.
- Locked calculators show the real layout, but the numbers are replaced with placeholders (not just hidden), so nothing real sits in the page.
- It is a **soft gate**: the calculator code ships to the browser, so a determined person could bypass it. That is normal for a lead-capture gate and fine for this purpose. A hard gate would need results computed on a server after verifying each visitor.
- The honeypot field and server-side checks stop most junk signups. If bots become a problem, add Cloudflare Turnstile (free).

## Privacy and legal

`/privacy` and `/terms` are working drafts that match how the site is built. **Have a lawyer review them** (POPIA and GDPR) and fill in the bracketed details before launch, then delete the "template notice" boxes.

## Ongoing costs (approximate; check current prices)

| Item | Cost |
|---|---|
| Domain | about $10-20 a year |
| Hosting (Cloudflare Pages) | free at this scale |
| Email (MailerLite) | free to start; paid plans from about $10 a month as the list grows |
| Analytics (Plausible, optional) | about $9 a month, or skip it: MailerLite's `source_page` field already shows signups per page |

## Checklist before launch

- [ ] Real domain connected, `SITE_URL` set, `robots.txt` updated
- [ ] MailerLite group, API key, `source_page` field and welcome automation with the PDF
- [ ] Hero copy approved (`src/components/Hero.astro`)
- [ ] Your formulas and test cases in place, `npm test` green
- [ ] Privacy policy and terms reviewed by a lawyer
- [ ] Send yourself a test signup and confirm the welcome email arrives
- [ ] Contact email, legal name and information officer set in `src/config.ts`
