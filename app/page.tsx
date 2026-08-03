import LeadForm from "@/components/LeadForm";

const STATS = [
  {
    figure: "68%",
    headline: "of home invasions happen in a homeowner's first year",
    detail:
      "New movers are the single most targeted group. Boxes on the curb, unfamiliar neighbors, and an unsecured home are an open invitation.",
  },
  {
    figure: "48 hrs",
    headline: "from quote to professional install",
    detail:
      "Most homes are fully protected within two days of your call — no waiting weeks for a technician, no DIY guesswork.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Tell us where you live",
    body: "Share your name, number, email, and ZIP. Takes under a minute.",
  },
  {
    step: "2",
    title: "Get a free custom quote",
    body: "A local advisor calls to size up your home and price your system — no visit required.",
  },
  {
    step: "3",
    title: "Professional install in 48 hours",
    body: "A certified technician installs and tests everything, then walks you through the app.",
  },
];

const FEATURES = [
  {
    title: "24/7 professional monitoring",
    body: "Trained operators dispatch police, fire, or medical the moment an alarm trips — around the clock, every day of the year.",
  },
  {
    title: "HD indoor & outdoor cameras",
    body: "See who's at the door from anywhere, with clear night vision and recorded clips you can pull up in seconds.",
  },
  {
    title: "Door, window & motion sensors",
    body: "Every entry point covered, so you know the instant something opens that shouldn't.",
  },
  {
    title: "Smart control from your phone",
    body: "Arm, disarm, lock up, and check in on your home from the app — whether you're at work or on vacation.",
  },
  {
    title: "Smash-and-grab protection",
    body: "The system alerts monitoring the moment it's triggered, even if the panel is destroyed.",
  },
  {
    title: "Backup power & cellular",
    body: "Keeps working through outages and cut phone lines, so coverage doesn't drop when it matters most.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We closed on a Thursday and had the system running by Saturday. The tech showed us how everything worked before he left.",
    name: "Marcus T.",
    location: "Charlotte, NC",
  },
  {
    quote:
      "Our neighbor's garage got hit two weeks after we moved in. Ours was already armed. Best call we made all year.",
    name: "Priya S.",
    location: "Round Rock, TX",
  },
  {
    quote:
      "I expected a hard sell and got a straight answer instead. Quote over the phone, install two days later.",
    name: "Dana W.",
    location: "Naperville, IL",
  },
];

function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5 text-white">
            <ShieldIcon className="h-7 w-7 text-accent" />
            <span className="text-lg font-extrabold tracking-tight">
              ADT<span className="font-medium text-white/70">-Monitored Security</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+18005551234"
              className="hidden text-sm font-semibold text-white/90 hover:text-white sm:block"
            >
              (800) 555-1234
            </a>
            <a
              href="#quote"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-dark"
            >
              Free Quote
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden bg-brand-dark">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(60rem 40rem at 15% -10%, #1c5fd0 0%, transparent 60%), radial-gradient(40rem 30rem at 90% 20%, #d81f26 0%, transparent 55%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1.05fr_minmax(380px,0.95fr)] lg:py-20">
            <div className="animate-rise max-w-xl text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 ring-1 ring-white/15">
                New to the neighborhood?
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Your first year in a new home is the{" "}
                <span className="text-accent">riskiest one</span>.
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-white/80">
                Burglars watch for new movers — and most break-ins happen before a family
                ever gets around to setting up security. Get an ADT-monitored system quoted
                today and installed within 48 hours.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  "Free, no-obligation quote in under a minute",
                  "Professional install — no DIY, no guesswork",
                  "24/7 monitoring with police, fire & medical dispatch",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/90">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4" /> Licensed &amp; insured technicians
                </span>
                <span className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4" /> 6-month money-back guarantee
                </span>
              </div>
            </div>

            <div className="animate-rise lg:pl-4">
              <LeadForm />
            </div>
          </div>
        </section>

        {/* ---------------- Stats ---------------- */}
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-2 md:py-16">
            {STATS.map((stat) => (
              <div
                key={stat.figure}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="text-6xl font-extrabold tracking-tight text-brand sm:text-7xl">
                  {stat.figure}
                </div>
                <h3 className="mt-3 text-xl font-bold leading-snug text-ink">
                  {stat.headline}
                </h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Protected in three steps
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              From first call to armed system in about two days.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- What's included ---------------- */}
        <section className="bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                What your system covers
              </h2>
              <p className="mt-4 text-lg text-ink-soft">
                Built around your home&rsquo;s layout — not a one-size-fits-all box.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <ShieldIcon className="h-8 w-8 text-brand" />
                  <h3 className="mt-4 text-lg font-bold text-ink">{feature.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Testimonials ---------------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Homeowners who didn&rsquo;t wait
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex gap-1 text-accent" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-4 grow leading-relaxed text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-ink-soft">
                  {t.name} &middot; {t.location}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="relative overflow-hidden bg-brand-dark py-16 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(50rem 30rem at 80% 0%, #1c5fd0 0%, transparent 60%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_minmax(380px,0.9fr)]">
            <div className="text-white">
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Don&rsquo;t spend your first year unprotected
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/80">
                It takes a minute to get a quote and two days to get installed. Waiting is
                the only expensive part.
              </p>
              <a
                href="tel:+18005551234"
                className="mt-8 inline-flex items-center gap-3 rounded-lg bg-white/10 px-5 py-3.5 font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15"
              >
                Or call now: (800) 555-1234
              </a>
            </div>

            <LeadForm id="quote-bottom" />
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="bg-ink py-10 text-sm text-white/60">
        <div className="mx-auto max-w-6xl space-y-4 px-5">
          <div className="flex items-center gap-2.5 text-white">
            <ShieldIcon className="h-6 w-6 text-accent" />
            <span className="font-bold">ADT-Monitored Security</span>
          </div>
          <p className="max-w-3xl leading-relaxed">
            This site is operated by an authorized dealer of ADT-monitored security
            systems and is not ADT LLC. Monitoring services are provided by ADT.
            Installation timing, equipment, pricing, and availability vary by location and
            are confirmed at the time of quote. Licensing information available on request.
          </p>
          <p className="max-w-3xl leading-relaxed">
            Statistics cited are used for illustrative marketing purposes; source figures
            should be verified and attributed before this page is published.
          </p>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
