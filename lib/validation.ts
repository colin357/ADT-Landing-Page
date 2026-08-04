export type LeadInput = {
  name: string;
  email: string;
  phone: string;
  zip: string;
};

export type LeadErrors = Partial<Record<keyof LeadInput, string>>;

/** Step 2 — the three qualifying questions, in the order they're asked. */
export const QUALIFIER_FIELDS = [
  {
    name: "homeowner",
    question: "Are you a homeowner?",
    help: "Renters usually need a landlord's sign-off before a system can be installed.",
  },
  {
    name: "creditScore620",
    question: "Do you have at least a 620 credit score?",
    help: "Self-reported — answering this does not run a credit check or affect your score.",
  },
  {
    name: "readyToInstall48",
    question: "Are you ready to install within 48 hours?",
    help: "Tells us whether to hold one of this week's install windows for you.",
  },
] as const;

export type QualifierName = (typeof QUALIFIER_FIELDS)[number]["name"];
export type YesNo = "yes" | "no";

/** Empty string means "not answered yet". */
export type Qualifiers = Record<QualifierName, YesNo | "">;
export type QualifierErrors = Partial<Record<QualifierName, string>>;

export const EMPTY_QUALIFIERS: Qualifiers = {
  homeowner: "",
  creditScore620: "",
  readyToInstall48: "",
};

/** What the client posts to /api/lead once both steps are done. */
export type LeadSubmission = LeadInput & Record<QualifierName, YesNo>;

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

export function validateQualifiers(
  input: Partial<Record<QualifierName, string>>,
): QualifierErrors {
  const errors: QualifierErrors = {};

  for (const field of QUALIFIER_FIELDS) {
    const answer = input[field.name];
    if (answer !== "yes" && answer !== "no") {
      errors[field.name] = "Please choose Yes or No.";
    }
  }

  return errors;
}

/** Normalizes a validated lead into the shape we hand off to the CRM. */
export function normalizeLead(input: LeadSubmission) {
  return {
    name: input.name.trim().replace(/\s+/g, " "),
    email: input.email.trim().toLowerCase(),
    phone: digitsOnly(input.phone),
    zip: digitsOnly(input.zip),
    homeowner: input.homeowner === "yes",
    creditScore620: input.creditScore620 === "yes",
    readyToInstall48: input.readyToInstall48 === "yes",
  };
}
