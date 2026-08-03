"use client";

import { useState } from "react";
import {
  formatPhone,
  validateLead,
  type LeadErrors,
  type LeadInput,
} from "@/lib/validation";

const EMPTY: LeadInput = { name: "", email: "", phone: "", zip: "" };

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
  const [values, setValues] = useState<LeadInput>(EMPTY);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [company, setCompany] = useState(""); // honeypot

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateLead(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, company }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.errors) setErrors(data.errors as LeadErrors);
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

      <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Get your free security quote
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        Takes about 30 seconds. No obligation, no pushy sales visit.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {FIELDS.map((field) => {
          const error = errors[field.name];
          return (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-semibold text-ink"
              >
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(e) => update(field.name, e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${field.name}-error` : undefined}
                className={`mt-1.5 w-full rounded-lg border px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  error
                    ? "border-accent focus:border-accent focus:ring-accent/15"
                    : "border-slate-300 focus:border-brand focus:ring-brand/15"
                }`}
              />
              {error && (
                <p id={`${field.name}-error`} className="mt-1.5 text-sm text-accent">
                  {error}
                </p>
              )}
            </div>
          );
        })}

        {/* Honeypot — hidden from users, catches naive bots. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-accent-dark">
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

        <p className="text-center text-xs leading-relaxed text-slate-500">
          By submitting, you agree to be contacted by phone, text, or email about home
          security options at the number provided, including by automated technology.
          Consent is not a condition of purchase. Message and data rates may apply.
        </p>
      </form>
    </div>
  );
}
