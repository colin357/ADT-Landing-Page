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

`POST /api/lead` validates the submission server-side, then forwards the lead as JSON
to a Zapier catch hook. The destination is the `DEFAULT_LEAD_WEBHOOK` constant in
`app/api/lead/route.ts`; setting the `LEAD_WEBHOOK_URL` environment variable overrides
it, so a staging deploy can point somewhere else without a code change.

If the webhook is unreachable or returns a non-2xx, the API responds `502`, the form
shows a retry message, and the full lead is written to the runtime logs (prefixed
`LEAD WEBHOOK FAILED` / `LEAD WEBHOOK REJECTED`) so it can be recovered by hand.

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

Local dev posts to the same live hook. Copy `.env.example` to `.env.local` and set
`LEAD_WEBHOOK_URL` if you'd rather send test submissions somewhere else.

## Meta Conversions API

Every successful submission also fires a server-side **Lead** event to the Meta
Conversions API (`lib/meta-capi.ts`). It runs after the lead has been handed to the
webhook, and it is strictly best-effort — a Meta outage, a bad token, or a missing
Pixel ID never turns a captured lead into an error for the visitor. Failures are
logged as `META CAPI LEAD FAILED` with the event ID and the reason.

Nothing is sent unless both `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` are set, so
local dev and preview deploys stay silent by default.

### Parameters sent

| Event parameter | Value |
| --- | --- |
| `event_name` | `Lead` |
| `event_time` | Unix seconds at send time |
| `event_id` | UUID generated in the browser, sent with the lead |
| `event_source_url` | `window.location.href`, falling back to the `Referer` header |
| `action_source` | `website` |
| `opt_out` | `META_CAPI_OPT_OUT` (default `false`) |
| `data_processing_options` | `["LDU"]` when `META_CAPI_LDU=true`, otherwise `[]` |
| `data_processing_options_country` | `META_CAPI_LDU_COUNTRY` (default `0`) |
| `data_processing_options_state` | `META_CAPI_LDU_STATE` (default `0`) |

| Customer parameter | Normalization before SHA-256 |
| --- | --- |
| `em` (email) | trimmed, lowercased |
| `ph` (phone) | digits only, `1` country code prepended |
| `fn` (first name) | first whitespace-separated token, lowercased, letters only |
| `ln` (last name) | remaining tokens, lowercased, letters only |
| `zp` (ZIP) | 5 digits |
| `client_user_agent` | **not hashed** — sent in the clear, per Meta's spec |

All five customer fields are SHA-256 hex digests; raw PII never leaves the server.
`0`/`0` for the LDU country and state asks Meta to geolocate the user and apply the
right state's rules automatically.

`event_id` is generated in the browser and returned in the API response. Nothing uses
it yet, but if a browser Pixel is ever added to the page it should fire
`fbq('track', 'Lead', {}, { eventID })` with that same value so Meta deduplicates the
browser and server events into one.

### Testing it

Set `META_TEST_EVENT_CODE` to the code from Events Manager → **Test events**, submit
the form, and the event appears there instead of in production. Unset it when you're
done. Match quality is visible under Events Manager → your dataset → **Overview**.

### Setup

1. Events Manager → **Data sources** → your dataset → **Settings** → copy the dataset
   (Pixel) ID into `META_PIXEL_ID`.
2. Generate a Conversions API access token on the same Settings page, or use a system
   user token with the `ads_management` scope, and put it in `META_CAPI_ACCESS_TOKEN`.
3. Add both under Vercel → Settings → **Environment Variables**, then redeploy.

Enable `META_CAPI_LDU` if you need CCPA/CPRA Limited Data Use handling — talk to
counsel about whether your traffic requires it.

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
3. Leads flow to the Zapier hook out of the box with no environment variables. Add
   `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` under Settings → Environment
   Variables to turn on Conversions API events, and `LEAD_WEBHOOK_URL` to redirect a
   deployment somewhere else. Redeploy after either change.

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
  meta-capi.ts        Meta Conversions API Lead events (hashing + send)
```

The three step-2 questions live in `QUALIFIER_FIELDS` in `lib/validation.ts` — edit,
reorder, or add to that array and both the form and the server-side check follow.
