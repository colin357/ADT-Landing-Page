import { NextResponse } from "next/server";
import { normalizeLead, validateLead, type LeadInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts a lead and hands it off. By default the lead is logged (visible in
 * Vercel's runtime logs); set LEAD_WEBHOOK_URL to forward it to a CRM, Zapier
 * hook, or anything else that accepts a JSON POST.
 */
export async function POST(request: Request) {
  let body: Partial<LeadInput> & { company?: string };

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
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const lead = {
    ...normalizeLead(body as LeadInput),
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
