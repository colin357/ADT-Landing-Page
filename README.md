# ADT Security Landing Page

A single-page, conversion-focused lead capture landing page for ADT-monitored home
security systems. Built with Next.js (App Router) + TypeScript + Tailwind CSS v4,
ready to deploy on Vercel.

## The goal

Everything on the page drives to one two-step form.

**Step 1 — contact details**

- **Name**
- **Phone number**
- **Email address**
- **ZIP code**

**Step 2 — qualifying questions** (Yes/No each)

- Are you a homeowner?
- Do you have at least a 620 credit score?
- Are you ready to install within 48 hours?

Completing step 1 slides the card left and swipes step 2 in from the right (500ms
easing, with the card height animating between panels so nothing jumps). A progress bar
reads "Step 1 of 2", and a Back button returns to step 1 with every answer preserved.
The off-screen panel is marked `inert`, so it's skipped by tab order and screen readers.
Under `prefers-reduced-motion`, the transitions are disabled and the steps swap
instantly.

Nothing is sent until step 2 is submitted — one POST carries all seven answers.

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
  "homeowner": true,
  "creditScore620": true,
  "readyToInstall48": false,
  "qualified": false,
  "source": "adt-landing-page",
  "submittedAt": "2026-08-03T19:40:00.000Z"
}
```

The three answers arrive as booleans. `qualified` is a convenience flag — true only when
all three are Yes — so your CRM can route hot leads straight to a closer.

Copy `.env.example` to `.env.local` to set the webhook locally.

### Validation and spam

- Client-side validation with inline errors; phone auto-formats as `(555) 123-4567`.
  Step 1 won't advance until all four contact fields pass.
- The same rules run again server-side (`lib/validation.ts`) — the API never trusts the
  client. A 422 carries `errors` (contact) and `qualifierErrors` (questions) separately,
  and the form jumps back to step 1 if the contact errors are the ones that failed.
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
  LeadForm.tsx        two-step sliding form + success state
lib/
  validation.ts       shared client/server validation + question definitions
```

The three step-2 questions live in `QUALIFIER_FIELDS` in `lib/validation.ts` — edit,
reorder, or add to that array and both the form and the server-side check follow.
