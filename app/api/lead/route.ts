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
 * Accepts a lead and hands it off. By default the lead is logged (visible in
 * Vercel's runtime logs); set LEAD_WEBHOOK_URL to forward it to a CRM, Zapier
 * hook, or anything else that accepts a JSON POST.
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

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!res.ok) {
        console.error("Lead webhook rejected the lead", res.status, lead.email);
        return NextResponse.json(
          { ok: false, error: "We couldn't submit your request. Please try again." },
          { status: 502 },
        );
      }
    } catch (err) {
      console.error("Lead webhook failed", err, lead.email);
      return NextResponse.json(
        { ok: false, error: "We couldn't submit your request. Please try again." },
        { status: 502 },
      );
    }
  } else {
    console.log("New lead:", JSON.stringify(lead));
  }

  return NextResponse.json({ ok: true });
}
