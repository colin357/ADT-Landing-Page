# ADT Security Landing Page

A single-page, conversion-focused lead capture landing page for ADT-monitored home
security systems. Built with Next.js (App Router) + TypeScript + Tailwind CSS v4,
ready to deploy on Vercel.

## The goal

Everything on the page drives to one form that collects four fields:

- **Name**
- **Phone number**
- **Email address**
- **ZIP code**

The form appears twice — in the hero (above the fold) and again in the closing CTA —
plus sticky header buttons that scroll to it.

## The two headline stats

| Stat | Where it appears |
| --- | --- |
| **68%** of home invasions happen in a homeowner's first year | Stats band, directly under the hero |
| Install within **48 hours** | Stats band, hero copy, "how it works" step 3 |

> The footer notes that these figures should be verified and attributed before the page
> goes live. Swap in your own sourcing when you have it.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Where leads go

`POST /api/lead` validates the submission server-side, then:

- if `LEAD_WEBHOOK_URL` is set, forwards the lead as JSON to that URL (CRM, Zapier,
  Make, Slack workflow, anything that accepts a JSON POST);
- otherwise, logs the lead so it shows up in Vercel's runtime logs.

Payload shape:

```json
{
  "name": "Jordan Reyes",
  "email": "jordan@example.com",
  "phone": "5551234567",
  "zip": "30301",
  "source": "adt-landing-page",
  "submittedAt": "2026-08-03T19:40:00.000Z"
}
```

Copy `.env.example` to `.env.local` to set the webhook locally.

### Validation and spam

- Client-side validation with inline errors; phone auto-formats as `(555) 123-4567`.
- The same rules run again server-side (`lib/validation.ts`) — the API never trusts the
  client.
- A hidden honeypot field silently discards naive bot submissions.

## Deploying to Vercel

1. Push this branch and import the repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset auto-detects as **Next.js** — no build settings to change.
3. Optionally add the `LEAD_WEBHOOK_URL` environment variable under
   Settings → Environment Variables, then redeploy.

## Before going live

- The click-to-call number is `(856) 347-9532` (`app/page.tsx`,
  `components/LeadForm.tsx`) — update both files if it ever changes.
- Replace the sample testimonials with real, attributable customer quotes.
- Verify and attribute the 68% statistic, and confirm the 48-hour install claim matches
  what your dealer agreement supports.
- Have the TCPA consent text under the submit button reviewed by counsel for your
  jurisdiction and calling practices.
- Confirm the dealer disclosure in the footer matches your ADT authorized-dealer
  agreement.

## Structure

```
app/
  layout.tsx          metadata, fonts, global styles
  page.tsx            all page sections
  globals.css         Tailwind v4 theme tokens
  icon.svg            favicon
  api/lead/route.ts   lead intake endpoint
components/
  LeadForm.tsx        the four-field form + success state
lib/
  validation.ts       shared client/server validation
```
