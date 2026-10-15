import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  ClipboardList,
  Eye,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import heroImage from "@/app/assets/image.jpg";

const BENEFITS = [
  {
    icon: ClipboardList,
    title: "Apply for agricultural subsidies",
    body: "Complete a guided application for fertilizer and seed support without repeated office visits.",
  },
  {
    icon: BadgeCheck,
    title: "Verify information digitally",
    body: "Reuse verified identity and farmer registration data instead of resubmitting paperwork.",
  },
  {
    icon: Eye,
    title: "Track application progress",
    body: "Follow every stage from submission to disbursement with a transparent timeline.",
  },
  {
    icon: Banknote,
    title: "Transparent eligibility & payments",
    body: "See exactly how eligibility was assessed and when subsidy payments are made.",
  },
];

const INTEGRATIONS = [
  { name: "SLUDI", desc: "Digital identity & eKYC (eSignet OIDC)" },
  { name: "NDX", desc: "National Data Exchange — land & registry lookup" },
  { name: "Subsidy Benefit Services", desc: "Dept. of Agrarian Development eligibility" },
  { name: "IPG Simulator", desc: "Sandbox payment / disbursement" },
];

export default function LandingContent() {
  return (
    <main>
      {/* Hero */}
      <section className="agri-gradient relative overflow-hidden text-white">
        {/* Blurred background image */}
        <Image
          src={heroImage}
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-45 blur-xs"
        />
        {/* Darkening + green tint overlay for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-green-950/60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-900/40 via-transparent to-green-950/50" />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24 md:pb-32">
          <div>
            {/* <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <ShieldCheck size={14} /> GovTech Sandbox demonstration
            </span> */}
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Agricultural subsidies, made simple for Sri Lankan farmers.
            </h1>
            <p className="mt-4 max-w-lg text-base text-green-50/90">
              AgriLink connects farmers, agrarian officers, and administrators in one
              digital workflow — apply, verify, assess eligibility, approve, and
              disburse subsidies with full transparency.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-green-800"
              >
                Enter the demo
              </Link>
              <Link
                href="/admin/integrations"
                className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-white/10"
              >
                View integrations
              </Link>
            </div>
            {/* <p className="mt-4 text-xs text-green-50/70">
              Demonstration environment with fictional data. Not a live government service.
            </p> */}
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl ring-1 ring-black/5">
              <Image
                src={heroImage}
                alt="Sri Lankan farmers working in a paddy field"
                placeholder="blur"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-full max-h-[460px] w-full object-cover"
              />
              {/* Gradient scrim for text legibility over the photo */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-green-950/70 via-green-900/10 to-transparent" />
            </div>

            {/* Floating glass panel of connected services */}
            {/* <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur md:absolute md:-bottom-6 md:right-4 md:mt-0 md:w-[88%] md:max-w-sm md:shadow-xl">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Landmark size={18} /> Connected GovTech services
              </div>
              <div className="mt-3 space-y-2.5">
                {INTEGRATIONS.map((i) => (
                  <div
                    key={i.name}
                    className="flex items-start justify-between gap-3 rounded-lg bg-white/10 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-semibold">{i.name}</div>
                      <div className="text-xs text-green-50/80">{i.desc}</div>
                    </div>
                    <span className="mt-0.5 rounded bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      Sandbox
                    </span>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Why farmers and officers use AgriLink
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">
          A clear, trustworthy public-service experience that reduces repeated visits
          to government offices and makes every decision explainable.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="agri-card-shadow rounded-xl border border-slate-100 bg-white p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <b.icon size={22} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Three connected experiences
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Farmer Portal",
                points: ["Explore schemes", "Guided application wizard", "Track status & payments"],
                href: "/farmer/dashboard",
              },
              {
                title: "Officer Portal",
                points: ["Review & verify applications", "Record decisions", "Manage disbursements"],
                href: "/officer/dashboard",
              },
              {
                title: "Admin Portal",
                points: ["Configure demo schemes", "Monitor integrations", "Inspect audit log"],
                href: "/admin/dashboard",
              },
            ].map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="agri-card-shadow group rounded-xl border border-slate-200 bg-white p-6 transition hover:border-green-300"
              >
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-green-700">
                  {r.title}
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <BadgeCheck size={15} className="text-green-600" /> {p}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-500">
          AgriLink — GovTech Sandbox prototype. Built for demonstration to ICTA,
          GovTech, and agriculture-sector stakeholders. No real personal data is used.
        </div>
      </footer>
    </main>
  );
}
