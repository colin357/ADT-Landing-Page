import { createHash, randomUUID } from "node:crypto";

/**
 * Meta Conversions API — server-side "Lead" events.
 *
 * Everything here is best-effort: a lead is never rejected because Meta was
 * slow, misconfigured, or down. Failures are logged and swallowed.
 *
 * Required environment variables (nothing is sent unless both are set):
 *   META_PIXEL_ID             Pixel / dataset ID that owns the events
 *   META_CAPI_ACCESS_TOKEN    System-user token with the Conversions API scope
 *
 * Optional:
 *   META_GRAPH_API_VERSION    Defaults to the version below
 *   META_TEST_EVENT_CODE      Routes events to Events Manager → Test events
 *   META_CAPI_LDU             "true" turns on Limited Data Use
 *   META_CAPI_LDU_COUNTRY     LDU country code (0 = let Meta geolocate)
 *   META_CAPI_LDU_STATE       LDU state code (0 = let Meta geolocate)
 *   META_CAPI_OPT_OUT         "true" marks events as opted out of ad targeting
 */

const DEFAULT_GRAPH_VERSION = "v26.0";
const REQUEST_TIMEOUT_MS = 5_000;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Meta wants advanced-matching fields lowercased and trimmed before hashing. */
function hashNormalized(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

/**
 * Names: lowercase, and strip anything that isn't a letter — Meta hashes
 * "O'Brien", "obrien", and "O Brien" to the same value only if we do this.
 */
function hashName(value: string): string | undefined {
  const normalized = value.toLowerCase().replace(/[^\p{L}]/gu, "");
  return normalized ? sha256(normalized) : undefined;
}

/**
 * Phones must carry a country code and no punctuation. The form validates a
 * 10-digit US number, so a bare 10 digits gets a leading 1.
 */
function hashPhone(value: string): string | undefined {
  let digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 10) digits = `1${digits}`;
  return sha256(digits);
}

/** "Jordan Reyes Jr" → first "Jordan", last "Reyes Jr". */
export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function envFlag(name: string): boolean {
  return (process.env[name] ?? "").trim().toLowerCase() === "true";
}

function envInt(name: string, fallback: number): number {
  const parsed = Number.parseInt((process.env[name] ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Event IDs are the deduplication key between this server event and a browser
 * Pixel event for the same lead. The client supplies one so both sides can
 * agree on it; anything unexpected is replaced rather than trusted.
 */
export function coerceEventId(candidate: unknown): string {
  return typeof candidate === "string" && /^[A-Za-z0-9._:-]{8,100}$/.test(candidate)
    ? candidate
    : randomUUID();
}

export type MetaLeadEvent = {
  eventId: string;
  eventSourceUrl?: string;
  clientUserAgent?: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  zip: string;
};

export type MetaCapiResult =
  | { ok: true; eventId: string; eventsReceived?: number; fbTraceId?: string }
  | { ok: false; eventId: string; reason: string };

/**
 * Fires one Lead event. Resolves to a result object instead of throwing so the
 * caller can log the outcome without wrapping the call in its own try/catch.
 */
export async function sendLeadEvent(event: MetaLeadEvent): Promise<MetaCapiResult> {
  const pixelId = (process.env.META_PIXEL_ID ?? "").trim();
  const accessToken = (process.env.META_CAPI_ACCESS_TOKEN ?? "").trim();

  if (!pixelId || !accessToken) {
    return { ok: false, eventId: event.eventId, reason: "not configured" };
  }

  const ldu = envFlag("META_CAPI_LDU");

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        opt_out: envFlag("META_CAPI_OPT_OUT"),
        // Empty array = Limited Data Use off. With LDU on, 0/0 asks Meta to
        // geolocate the user and apply the right state's rules automatically.
        data_processing_options: ldu ? ["LDU"] : [],
        data_processing_options_country: ldu ? envInt("META_CAPI_LDU_COUNTRY", 0) : 0,
        data_processing_options_state: ldu ? envInt("META_CAPI_LDU_STATE", 0) : 0,
        user_data: {
          em: hashNormalized(event.email),
          ph: hashPhone(event.phone),
          fn: hashName(event.firstName),
          ln: hashName(event.lastName),
          zp: hashNormalized(event.zip),
          // The one field Meta requires in the clear.
          client_user_agent: event.clientUserAgent,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  const version = (process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_VERSION).trim();
  const url = `https://graph.facebook.com/${version}/${pixelId}/events`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Keeps the token out of the URL, and out of any proxy access log.
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const body = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string; code?: number };
    };

    if (!res.ok) {
      const detail = body.error?.message ?? `HTTP ${res.status}`;
      return { ok: false, eventId: event.eventId, reason: detail };
    }

    return {
      ok: true,
      eventId: event.eventId,
      eventsReceived: body.events_received,
      fbTraceId: body.fbtrace_id,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, eventId: event.eventId, reason };
  }
}
