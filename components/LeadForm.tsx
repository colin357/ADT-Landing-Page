"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMPTY_QUALIFIERS,
  QUALIFIER_FIELDS,
  formatPhone,
  validateLead,
  validateQualifiers,
  type LeadErrors,
  type LeadInput,
  type QualifierErrors,
  type QualifierName,
  type Qualifiers,
  type YesNo,
} from "@/lib/validation";

const EMPTY: LeadInput = { name: "", email: "", phone: "", zip: "" };

/** Deduplication key for the Meta Lead event. randomUUID needs a secure
 *  context, so fall back to a random string on plain http (local dev). */
function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

type Status = "idle" | "submitting" | "success";

const FIELDS = [
  {
    name: "name" as const,
    label: "Full name",
    type: "text",
    placeholder: "Jordan Reyes",
    autoComplete: "name",
    inputMode: undefined,
  },
  {
    name: "phone" as const,
    label: "Phone number",
    type: "tel",
    placeholder: "(555) 123-4567",
    autoComplete: "tel",
    inputMode: "tel" as const,
  },
  {
    name: "email" as const,
    label: "Email address",
    type: "email",
    placeholder: "you@email.com",
    autoComplete: "email",
    inputMode: "email" as const,
  },
  {
    name: "zip" as const,
    label: "ZIP code",
    type: "text",
    placeholder: "30301",
    autoComplete: "postal-code",
    inputMode: "numeric" as const,
  },
];

export default function LeadForm({ id = "quote" }: { id?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<LeadInput>(EMPTY);
  const [qualifiers, setQualifiers] = useState<Qualifiers>(EMPTY_QUALIFIERS);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [qualifierErrors, setQualifierErrors] = useState<QualifierErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [company, setCompany] = useState(""); // honeypot

  // The track slides horizontally; the viewport animates to the height of
  // whichever panel is showing so the card doesn't jump between steps.
  const stepOneRef = useRef<HTMLDivElement>(null);
  const stepTwoRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const active = step === 1 ? stepOneRef.current : stepTwoRef.current;
    if (!active) return;

    const measure = () => setViewportHeight(active.offsetHeight);
    measure();

    // Inline errors and the consent copy change a panel's height in place.
    const observer = new ResizeObserver(measure);
    observer.observe(active);
    return () => observer.disconnect();
  }, [step, status]);

  function update(field: keyof LeadInput, raw: string) {
    const value =
      field === "phone"
        ? formatPhone(raw)
        : field === "zip"
          ? raw.replace(/\D/g, "").slice(0, 5)
          : raw;

    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function answer(name: QualifierName, value: YesNo) {
    setQualifiers((prev) => ({ ...prev, [name]: value }));
    setQualifierErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function goToStepTwo() {
    const nextErrors = validateLead(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setFormError(null);
    setStep(2);
  }

  async function submitLead() {
    const contactErrors = validateLead(values);
    const nextQualifierErrors = validateQualifiers(qualifiers);

    if (Object.keys(contactErrors).length > 0) {
      setErrors(contactErrors);
      setStep(1);
      return;
    }
    if (Object.keys(nextQualifierErrors).length > 0) {
      setQualifierErrors(nextQualifierErrors);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...qualifiers,
          company,
          // Shared with the server-side Meta Lead event so a browser Pixel, if
          // one is ever added, can fire the same eventID and be deduplicated.
          eventId: newEventId(),
          pageUrl: window.location.href,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.errors && Object.keys(data.errors).length > 0) {
          setErrors(data.errors as LeadErrors);
          setStep(1);
        }
        if (data?.qualifierErrors) {
          setQualifierErrors(data.qualifierErrors as QualifierErrors);
        }
        setFormError(data?.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("success");
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setStatus("idle");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (step === 1) {
      goToStepTwo();
    } else {
      void submitLead();
    }
  }

  if (status === "success") {
    return (
      <div
        id={id}
        className="animate-rise rounded-2xl bg-white p-8 text-center shadow-2xl ring-1 ring-black/5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-7 w-7 text-emerald-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mt-5 text-2xl font-bold text-ink">You&rsquo;re on the schedule list</h3>
        <p className="mt-3 text-ink-soft">
          A local security advisor will call{" "}
          <span className="font-semibold text-ink">{values.phone}</span> shortly to confirm
          your free quote and lock in an install window &mdash; most homes in{" "}
          <span className="font-semibold text-ink">{values.zip}</span> are covered within 48
          hours.
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          Didn&rsquo;t mean to submit that? Call us at{" "}
          <a className="font-semibold text-brand underline" href="tel:+18563479532">
            (856) 347-9532
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div id={id} className="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8">
      <div className="flex items-center gap-2 text-sm font-semibold text-accent">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        Installers available this week
      </div>

      {/* Step indicator */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 grow overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Step {step} of 2
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div
          className="mt-5 overflow-hidden transition-[height] duration-500 ease-out motion-reduce:transition-none"
          style={{ height: viewportHeight }}
        >
          <div
            className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: step === 1 ? "translateX(0)" : "translateX(-50%)" }}
          >
            {/* ---------- Step 1: contact details ---------- */}
            <div
              className="w-1/2 self-start px-1"
              aria-hidden={step !== 1}
              inert={step !== 1}
            >
              <div ref={stepOneRef}>
                <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Get your free security quote
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Takes about 30 seconds. No obligation, no pushy sales visit.
                </p>

                <div className="mt-6 space-y-4">
                  {FIELDS.map((field) => {
                    const error = errors[field.name];
                    const fieldId = `${id}-${field.name}`;
                    return (
                      <div key={field.name}>
                        <label
                          htmlFor={fieldId}
                          className="block text-sm font-semibold text-ink"
                        >
                          {field.label}
                        </label>
                        <input
                          id={fieldId}
                          name={field.name}
                          type={field.type}
                          inputMode={field.inputMode}
                          autoComplete={field.autoComplete}
                          placeholder={field.placeholder}
                          value={values[field.name]}
                          onChange={(e) => update(field.name, e.target.value)}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? `${fieldId}-error` : undefined}
                          className={`mt-1.5 w-full rounded-lg border px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                            error
                              ? "border-accent focus:border-accent focus:ring-accent/15"
                              : "border-slate-300 focus:border-brand focus:ring-brand/15"
                          }`}
                        />
                        {error && (
                          <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-accent">
                            {error}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Honeypot — hidden from users, catches naive bots. */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor={`${id}-company`}>Company</label>
                    <input
                      id={`${id}-company`}
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-accent px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-dark focus:outline-none focus:ring-4 focus:ring-accent/30"
                  >
                    Continue →
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    Two more taps and you&rsquo;re done.
                  </p>
                </div>
              </div>
            </div>

            {/* ---------- Step 2: qualifying questions ---------- */}
            <div
              className="w-1/2 self-start px-1"
              aria-hidden={step !== 2}
              inert={step !== 2}
            >
              <div ref={stepTwoRef}>
                <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  Three quick questions
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Almost there, {values.name.trim().split(" ")[0] || "friend"} &mdash; this
                  helps your advisor price the right system.
                </p>

                <div className="mt-6 space-y-5">
                  {QUALIFIER_FIELDS.map((field) => {
                    const error = qualifierErrors[field.name];
                    return (
                      <fieldset key={field.name}>
                        <legend className="text-sm font-semibold text-ink">
                          {field.question}
                        </legend>
                        <div className="mt-2.5 grid grid-cols-2 gap-3">
                          {(["yes", "no"] as const).map((option) => (
                            <label
                              key={option}
                              className="cursor-pointer"
                              htmlFor={`${id}-${field.name}-${option}`}
                            >
                              <input
                                id={`${id}-${field.name}-${option}`}
                                type="radio"
                                name={`${id}-${field.name}`}
                                value={option}
                                checked={qualifiers[field.name] === option}
                                onChange={() => answer(field.name, option)}
                                aria-describedby={
                                  error ? `${id}-${field.name}-error` : undefined
                                }
                                className="peer sr-only"
                              />
                              <span
                                className={`flex items-center justify-center rounded-lg border-2 px-4 py-3 text-base font-bold transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand/25 ${
                                  error
                                    ? "border-accent/60 text-ink-soft"
                                    : "border-slate-300 text-ink-soft hover:border-slate-400"
                                } peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white`}
                              >
                                {option === "yes" ? "Yes" : "No"}
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          {field.help}
                        </p>
                        {error && (
                          <p
                            id={`${id}-${field.name}-error`}
                            className="mt-1.5 text-sm text-accent"
                          >
                            {error}
                          </p>
                        )}
                      </fieldset>
                    );
                  })}

                  {formError && (
                    <p
                      role="alert"
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm text-accent-dark"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full rounded-lg bg-accent px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-dark focus:outline-none focus:ring-4 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "submitting" ? "Sending…" : "Get My Free Quote →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setStep(1);
                    }}
                    className="w-full text-sm font-semibold text-ink-soft transition hover:text-ink"
                  >
                    ← Back
                  </button>

                  <p className="text-center text-xs leading-relaxed text-slate-500">
                    By submitting, you agree to be contacted by phone, text, or email about
                    home security options at the number provided, including by automated
                    technology. Consent is not a condition of purchase. Message and data
                    rates may apply.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
