"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, Building2, Check, ClipboardList, Droplet, FileText, Home, Search, Stethoscope, Truck, Users, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { PACKAGES, PREP, TESTS, type Test } from "@/lib/bakti/content"
import { useSite } from "./site-shell"
import { Card, Eyebrow, FieldLabel, H, PageHero, Price, SButton, SLink, Section, inputClass } from "./ui"

export function ServicesPage() {
  const { href } = useSite()
  const items = [
    { Icon: Droplet, title: "Tests & Packages", text: "Over 400 routine and specialist tests, plus five screening packages with clear prices.", slug: "tests-and-packages" },
    { Icon: Stethoscope, title: "For Doctors & Clinics", text: "Courier pick-up, e-reports into your clinic system and monthly billing.", slug: "for-doctors" },
    { Icon: Building2, title: "Corporate Screening", text: "Pre-employment and annual screening, at our centres or on-site.", slug: "corporate-screening" },
    { Icon: ClipboardList, title: "Prepare for Your Test", text: "Fasting rules and what to bring, so you only need to come once.", slug: "prepare-for-your-test" },
  ]
  return (
    <>
      <PageHero eyebrow="Services" title="Everything a clinical lab should do — done properly" intro="Routine and specialist testing for patients, doctors and companies across Penang, with quality checks at every step." />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(({ Icon, title, text, slug }) => (
            <Link key={slug} href={href(slug)} className="group flex gap-5 rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-7 hover:border-(--s-primary)">
              <span className="grid size-14 shrink-0 place-items-center rounded-(--s-radius) bg-(--s-tint) text-(--s-primary)">
                <Icon className="size-7" />
              </span>
              <span className="flex flex-col gap-2">
                <H as="h2" className="text-[24px]">{title}</H>
                <span className="text-[15px] leading-relaxed text-(--s-muted)">{text}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 font-semibold text-(--s-primary)">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <Section tone="tint">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { Icon: Home, title: "Home sample collection", text: "Within Penang Island and Seberang Perai, RM 50 per visit." },
            { Icon: FileText, title: "Online results", text: "A secure link by SMS and email as soon as results are ready." },
            { Icon: Users, title: "Insurance & panels", text: "On most major insurance and corporate panels." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-3">
              <Icon className="size-7 text-(--s-primary)" />
              <H as="h3" className="text-[20px]">{title}</H>
              <p className="text-[15px] text-(--s-muted)">{text}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

const CATEGORIES = ["All", ...Array.from(new Set(TESTS.map((t) => t.category)))] as const

export function TestsPage() {
  const { book } = useSite()
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<string>("All")
  const [noFast, setNoFast] = useState(false)
  const results = useMemo(
    () =>
      TESTS.filter(
        (t) =>
          (cat === "All" || t.category === cat) &&
          (!noFast || !t.fasting) &&
          (t.name + " " + t.description).toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [q, cat, noFast],
  )
  return (
    <>
      <PageHero eyebrow="Tests & Packages" title="Find your test" intro="Prices include collection and your online report. Not sure what you need? Message us on WhatsApp and a medical technologist will help." />
      <Section>
        <div className="mb-8 flex flex-col gap-3">
          <Eyebrow>Health screening packages</Eyebrow>
          <H className="text-[28px] sm:text-[36px]">Packages</H>
        </div>
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-[15px]">
            <thead>
              <tr className="text-[13px] text-(--s-muted)">
                <th className="border-b border-(--s-line) py-3 pr-4 font-semibold">Package</th>
                <th className="border-b border-(--s-line) py-3 pr-4 font-semibold">Best for</th>
                <th className="border-b border-(--s-line) py-3 pr-4 font-semibold">Includes</th>
                <th className="border-b border-(--s-line) py-3 pr-4 text-right font-semibold">Price</th>
                <th className="border-b border-(--s-line) py-3" />
              </tr>
            </thead>
            <tbody>
              {PACKAGES.map((p) => (
                <tr key={p.id} className={cn(p.featured && "bg-(--s-tint)")}>
                  <td className="border-b border-(--s-line) py-4 pr-4 pl-2 align-top">
                    <span className="font-semibold">{p.name}</span>
                    {p.featured && <span className="ml-2 rounded-full bg-(--s-primary) px-2 whitespace-nowrap py-0.5 text-[11px] font-semibold text-(--s-on-primary)">Most chosen</span>}
                    <span className="block text-[13px] text-(--s-muted)">{p.tests} tests</span>
                  </td>
                  <td className="border-b border-(--s-line) py-4 pr-4 align-top text-(--s-muted)">{p.for}</td>
                  <td className="border-b border-(--s-line) py-4 pr-4 align-top text-[14px]">{p.highlights.join(" · ")}</td>
                  <td className="border-b border-(--s-line) py-4 pr-4 text-right align-top text-[18px] font-bold"><Price value={p.price} /></td>
                  <td className="border-b border-(--s-line) py-4 pr-2 text-right align-top"><SButton tone={p.featured ? "primary" : "secondary"} onClick={() => book(p.id)}>Book</SButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section tone="tint">
        <div className="mb-6 flex flex-col gap-3">
          <Eyebrow>Individual tests</Eyebrow>
          <H className="text-[28px] sm:text-[36px]">All tests</H>
        </div>
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search tests</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-(--s-muted)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. cholesterol, thyroid, dengue" className={cn(inputClass, "pl-12")} />
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={cn("h-10 rounded-full border px-4 text-[14px] font-medium", cat === c ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-card)")}>
                {c}
              </button>
            ))}
            <label className="flex h-10 items-center gap-2 rounded-full border border-(--s-line) bg-(--s-card) px-4 text-[14px]">
              <input type="checkbox" checked={noFast} onChange={(e) => setNoFast(e.target.checked)} className="accent-(--s-primary)" /> No fasting
            </label>
          </div>
        </div>
        <p className="mb-3 text-[14px] text-(--s-muted)" aria-live="polite">{results.length} {results.length === 1 ? "test" : "tests"}</p>
        {results.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <Search className="size-8 text-(--s-muted)" />
            <p className="text-[17px] font-semibold">No tests match “{q}”</p>
            <p className="text-[15px] text-(--s-muted)">We run over 400 tests — ask us on WhatsApp and we&apos;ll check for you.</p>
            <SButton tone="secondary" onClick={() => { setQ(""); setCat("All"); setNoFast(false) }}><X /> Clear filters</SButton>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {results.map((t) => <TestRow key={t.id} t={t} onBook={() => book(t.id)} />)}
          </ul>
        )}
      </Section>
    </>
  )
}

function TestRow({ t, onBook }: { t: Test; onBook: () => void }) {
  return (
    <li className="flex flex-col gap-3 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-semibold">{t.name}</span>
          <span className="rounded-full bg-(--s-tint) px-2 py-0.5 text-[12px] font-medium">{t.category}</span>
        </div>
        <p className="text-[14px] text-(--s-muted)">{t.description}</p>
        <p className="text-[13px] text-(--s-muted)">{t.sample} · {t.fasting ? `Fast ${t.fasting}` : "No fasting"} · Results {t.turnaround.toLowerCase()}</p>
      </div>
      <div className="flex items-center gap-4">
        <Price value={t.price} className="text-[20px] font-bold" />
        <SButton tone="secondary" onClick={onBook}>Book</SButton>
      </div>
    </li>
  )
}

function InquiryForm({ fields, cta, done }: { fields: { label: string; type?: string; textarea?: boolean; placeholder?: string }[]; cta: string; done: string }) {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  if (sent)
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)"><Check className="size-7" /></span>
        <p className="text-[17px] font-semibold">Thank you!</p>
        <p className="text-[15px] text-(--s-muted)">{done}</p>
      </Card>
    )
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-6 sm:p-8">
      {fields.map((f) => (
        <FieldLabel key={f.label} label={f.label}>
          {f.textarea ? (
            <textarea required rows={4} placeholder={f.placeholder} className={cn(inputClass, "h-auto py-3")} />
          ) : (
            <input required type={f.type ?? "text"} placeholder={f.placeholder} className={inputClass} />
          )}
        </FieldLabel>
      ))}
      <SButton type="submit" size="lg" className="mt-2">{cta}</SButton>
    </form>
  )
}

export function DoctorsPage() {
  return (
    <>
      <PageHero eyebrow="For doctors & clinics" title="A lab partner your patients won't have to chase" intro="Send samples with our courier, receive reports straight into your clinic system, and settle everything in one monthly bill." />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-8">
            {[
              { Icon: Truck, title: "Courier pick-up twice a day", text: "Morning and afternoon rounds across Penang Island and Seberang Perai, with cold-chain boxes for sensitive samples." },
              { Icon: FileText, title: "E-reports in hours", text: "Results go to your clinic dashboard, email or HL7 feed as soon as they're verified. Critical values are phoned through." },
              { Icon: Stethoscope, title: "Pathologist on call", text: "Talk to our consultant pathologist about unusual results or which test to order." },
              { Icon: ClipboardList, title: "Monthly billing", text: "One statement per month, with panel rates for regular referrers." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="flex gap-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-(--s-radius) bg-(--s-tint) text-(--s-primary)"><Icon className="size-6" /></span>
                <div className="flex flex-col gap-1.5">
                  <H as="h3" className="text-[20px]">{title}</H>
                  <p className="text-[15px] leading-relaxed text-(--s-muted)">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <H as="h2" className="text-[26px]">Open a clinic account</H>
            <p className="text-[15px] text-(--s-muted)">We&apos;ll set up courier pick-up and send request forms within two working days.</p>
            <InquiryForm
              fields={[{ label: "Clinic name" }, { label: "Doctor in charge" }, { label: "Email", type: "email" }, { label: "Phone", type: "tel" }]}
              cta="Request an account"
              done="Our clinic relations team will call you within one working day."
            />
          </div>
        </div>
      </Section>
    </>
  )
}

export function CorporatePage() {
  return (
    <>
      <PageHero eyebrow="Corporate screening" title="Staff screening without stopping work" intro="Pre-employment checks and annual health screening for teams of 10 to 2,000 — at our centres or on-site at your workplace." />
      <Section>
        <div className="mb-12 grid gap-5 md:grid-cols-3">
          {[
            { k: "2 days", v: "to screen 300+ staff on-site" },
            { k: "48 h", v: "to deliver individual reports" },
            { k: "1 report", v: "anonymised summary for HR" },
          ].map((s) => (
            <Card key={s.k} className="flex flex-col gap-1">
              <span className="text-[36px] text-(--s-primary)" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>{s.k}</span>
              <span className="text-[15px] text-(--s-muted)">{s.v}</span>
            </Card>
          ))}
        </div>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <H as="h2" className="text-[28px]">What we cover</H>
            <ul className="flex flex-col gap-3 text-[16px]">
              {["Pre-employment screening (FOMEMA-style panels, drug tests, Hepatitis B)", "Annual health screening with doctor's review", "Food handler screening and typhoid vaccination", "Audiometry and lung function on-site", "Results portal for HR with consent controls"].map((i) => (
                <li key={i} className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-(--s-primary)" /> {i}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <H as="h2" className="text-[26px]">Request a quote</H>
            <InquiryForm
              fields={[{ label: "Company" }, { label: "Number of staff", type: "number", placeholder: "e.g. 120" }, { label: "Work email", type: "email" }, { label: "Anything we should know?", textarea: true, placeholder: "Shift patterns, location, preferred dates…" }]}
              cta="Get my quote"
              done="We'll send a tailored quote within two working days."
            />
          </div>
        </div>
      </Section>
    </>
  )
}

export function PreparePage() {
  const { href, book } = useSite()
  return (
    <>
      <PageHero eyebrow="Prepare for your test" title="Get it right first time" intro="A little preparation means accurate results and no second visit. If in doubt, message us before you come." />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {PREP.map((p) => (
            <Card key={p.title} className="flex flex-col gap-4 p-7">
              <H as="h2" className="text-[22px]">{p.title}</H>
              <ul className="flex flex-col gap-3 text-[15px] leading-relaxed">
                {p.items.map((i) => <li key={i} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-(--s-primary)" /> {i}</li>)}
              </ul>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <SButton size="lg" onClick={() => book()}>Book a test</SButton>
          <SLink size="lg" tone="secondary" href={href("tests-and-packages")}>Check fasting for each test</SLink>
        </div>
      </Section>
    </>
  )
}
