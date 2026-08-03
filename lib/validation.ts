export type LeadInput = {
  name: string;
  email: string;
  phone: string;
  zip: string;
};

export type LeadErrors = Partial<Record<keyof LeadInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Strips everything but digits — useful for phone and zip comparisons. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formats a US phone number as the user types: (555) 123-4567 */
export function formatPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function validateLead(input: Partial<LeadInput>): LeadErrors {
  const errors: LeadErrors = {};

  const name = (input.name ?? "").trim();
  if (name.length < 2) {
    errors.name = "Please enter your full name.";
  }

  const email = (input.email ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const phone = digitsOnly(input.phone ?? "");
  if (phone.length !== 10) {
    errors.phone = "Please enter a 10-digit phone number.";
  }

  const zip = digitsOnly(input.zip ?? "");
  if (zip.length !== 5) {
    errors.zip = "Please enter a 5-digit ZIP code.";
  }

  return errors;
}

/** Normalizes a validated lead into the shape we hand off to the CRM. */
export function normalizeLead(input: LeadInput) {
  return {
    name: input.name.trim().replace(/\s+/g, " "),
    email: input.email.trim().toLowerCase(),
    phone: digitsOnly(input.phone),
    zip: digitsOnly(input.zip),
  };
}
