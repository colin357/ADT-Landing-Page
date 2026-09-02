import { NextResponse } from "next/server";
import { coerceEventId, sendLeadEvent, splitName } from "@/lib/meta-capi";
import {
  normalizeLead,
  validateLead,
  validateQualifiers,
  type LeadSubmission,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where leads go when LEAD_WEBHOOK_URL isn't set. Zapier catch hook — the Zap
 * on the other end fans the lead out to the CRM. Set LEAD_WEBHOOK_URL in the
 * environment to point a deployment somewhere else (staging, a new Zap, etc.)
 * without touching this file.
 */
const DEFAULT_LEAD_WEBHOOK = "https://hooks.zapier.com/hooks/catch/17690982/4673aeq/";

/**
 * Accepts a lead and hands it off to the webhook above. If the handoff fails,
 * the full lead is written to the runtime logs so it can be recovered by hand.
 */
export async function POST(request: Request) {
  let body: Partial<LeadSubmission> & {
    company?: string;
    eventId?: string;
    pageUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real users never see or fill this field.
  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  const errors = validateLead(body);
  const qualifierErrors = validateQualifiers(body);
  if (Object.keys(errors).length > 0 || Object.keys(qualifierErrors).length > 0) {
    return NextResponse.json(
      { ok: false, errors, qualifierErrors },
      { status: 422 },
    );
  }

  const normalized = normalizeLead(body as LeadSubmission);
  const lead = {
    ...normalized,
    // True only when all three qualifying answers are Yes — lets the CRM route
    // hot leads straight to a closer.
    qualified:
      normalized.homeowner && normalized.creditScore620 && normalized.readyToInstall48,
    source: "adt-landing-page",
    submittedAt: new Date().toISOString(),
  };

  const webhook = process.env.LEAD_WEBHOOK_URL || DEFAULT_LEAD_WEBHOOK;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      // Don't let a hanging webhook hold the request open until the platform
      // kills the function — fail fast and log the lead instead.
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("LEAD WEBHOOK REJECTED", res.status, JSON.stringify(lead));
      return NextResponse.json(
        { ok: false, error: "We couldn't submit your request. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("LEAD WEBHOOK FAILED", err, JSON.stringify(lead));
    return NextResponse.json(
      { ok: false, error: "We couldn't submit your request. Please try again." },
      { status: 502 },
    );
  }

  // Mirror the lead into the Google Form when GOOGLE_FORM_WEBHOOK_URL points at
  // the Apps Script web app in scripts/google-form. The CRM handoff above has
  // already succeeded by this point, so a Form outage is logged, never surfaced
  // to the visitor and never a reason to drop a captured lead.
  const formWebhook = process.env.GOOGLE_FORM_WEBHOOK_URL;
  if (formWebhook) {
    try {
      const res = await fetch(formWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(10_000),
      });
      // Apps Script answers 200 even when it couldn't file the response, so the
      // ok flag in its JSON body is the real result.
      const result = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !result?.ok) {
        console.error("GOOGLE FORM REJECTED", res.status, JSON.stringify(result));
      }
    } catch (err) {
      console.error("GOOGLE FORM FAILED", err, JSON.stringify(lead));
    }
  }

  // The lead is safely handed off; everything below is measurement and must
  // never turn a captured lead into an error for the visitor.
  const eventId = coerceEventId(body.eventId);
  const { first, last } = splitName(normalized.name);

  const meta = await sendLeadEvent({
    eventId,
    // The form sends the page it was submitted from; Referer is the fallback.
    eventSourceUrl: body.pageUrl ?? request.headers.get("referer") ?? undefined,
    clientUserAgent: request.headers.get("user-agent") ?? undefined,
    email: normalized.email,
    phone: normalized.phone,
    firstName: first,
    lastName: last,
    zip: normalized.zip,
  });

  if (!meta.ok) {
    console.error("META CAPI LEAD FAILED", meta.eventId, meta.reason);
  }

  // Returned so a browser Pixel can fire the same Lead with this eventID and
  // be deduplicated against the server event.
  return NextResponse.json({ ok: true, eventId });
}
