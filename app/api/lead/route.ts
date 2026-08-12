import { NextResponse } from "next/server";
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
  let body: Partial<LeadSubmission> & { company?: string };

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

  return NextResponse.json({ ok: true });
}
