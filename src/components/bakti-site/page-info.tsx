"use client"

import { useState, type FormEvent } from "react"
import { Accordion } from "radix-ui"
import { Award, Check, ChevronDown, Clock, MapPin, Microscope, Navigation, Phone, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/cn"
import { BUSINESS, FAQS, LOCATIONS, TEAM } from "@/lib/bakti/content"
import { useSite } from "./site-shell"
import { Card, Eyebrow, FieldLabel, H, PageHero, SButton, Section, inputClass } from "./ui"

export function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title={`Penang's neighbourhood lab since ${BUSINESS.established}`} intro="Bakti means service. We started as a single collection room in George Town and now run three centres and an accredited laboratory — still with the same promise: accurate results, explained clearly." />
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5 text-[17px] leading-relaxed text-(--s-muted)">
            <p>Every sample is processed in our own laboratory in George Town by registered medical laboratory technologists, and every abnormal result is reviewed by a consultant pathologist before it reaches you.</p>
            <p>We&apos;re accredited to {BUSINESS.accreditation}, the international standard for medical laboratories, and licensed under the Private Healthcare Facilities and Services Act 1998.</p>
            <p>Today we serve walk-in patients, more than 120 clinics across Penang and Kedah, and some of the largest employers in the Bayan Lepas industrial zone.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: Award, k: BUSINESS.accreditation, v: "Accredited laboratory" },
              { Icon: Microscope, k: "400+", v: "Tests in-house" },
              { Icon: ShieldCheck, k: "18 years", v: "Serving Penang" },
              { Icon: Clock, k: "92%", v: "Results within 24 h" },
            ].map(({ Icon, k, v }) => (
              <Card key={v} className="flex flex-col gap-2">
                <Icon className="size-6 text-(--s-primary)" />
                <span className="text-[24px]" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>{k}</span>
                <span className="text-[14px] text-(--s-muted)">{v}</span>
              </Card>
            ))}
          </div>
        </div>
      </Section>
      <Section tone="tint">
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>Our team</Eyebrow>
          <H className="text-[30px] sm:text-[38px]">The people behind your results</H>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <li key={m.name} className="flex flex-col gap-4 rounded-(--s-radius-lg) bg-(--s-card) p-6">
              <span className="grid aspect-square w-full place-items-center rounded-(--s-radius) bg-(--s-soft)/40 text-[40px] text-(--s-primary)" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }} aria-hidden>
                {m.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[17px] font-semibold">{m.name}</span>
                <span className="text-[14px] text-(--s-muted)">{m.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}

export function LocationsPage() {
  const { book } = useSite()
  const [active, setActive] = useState(LOCATIONS[0].id)
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <>
      <PageHero eyebrow="Locations & contact" title="Visit us at any of our three centres" intro="Walk-ins welcome. Book ahead to skip the queue, especially on Monday mornings." />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <ul className="flex flex-col gap-4">
            {LOCATIONS.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setActive(l.id)}
                  aria-pressed={active === l.id}
                  className={cn("flex w-full flex-col gap-3 rounded-(--s-radius-lg) border p-6 text-left", active === l.id ? "border-(--s-primary) bg-(--s-tint)" : "border-(--s-line) bg-(--s-card)")}
                >
                  <span className="text-[13px] font-semibold text-(--s-primary)">{l.kind}</span>
                  <H as="h2" className="text-[24px]">{l.name}</H>
                  <span className="flex gap-2 text-[15px] text-(--s-muted)"><MapPin className="mt-0.5 size-4 shrink-0" /> {l.address.join(", ")}</span>
                  <span className="flex gap-2 text-[15px] text-(--s-muted)"><Phone className="mt-0.5 size-4 shrink-0" /> {l.phone}</span>
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[14px]">
                    {l.hours.map((h) => (
                      <div key={h.days} className="contents">
                        <dt className="text-(--s-muted)">{h.days}</dt>
                        <dd className="font-medium">{h.time}</dd>
                      </div>
                    ))}
                  </dl>
                  {l.note && <span className="text-[13px] text-(--s-muted)">{l.note}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4">
            <MapCard active={active} onPick={setActive} />
            <div className="flex flex-wrap gap-3">
              <SButton onClick={() => book()}>Book at {LOCATIONS.find((l) => l.id === active)?.name}</SButton>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(LOCATIONS.find((l) => l.id === active)!.address.join(", "))}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-(--s-btn-radius) border border-(--s-line) bg-(--s-card) px-5 text-[15px] font-semibold hover:border-(--s-primary)">
                <Navigation className="size-4" /> Directions
              </a>
            </div>
          </div>
        </div>
      </Section>
      <Section tone="tint">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Eyebrow>Contact</Eyebrow>
            <H className="text-[30px] sm:text-[38px]">Send us a message</H>
            <p className="text-[16px] text-(--s-muted)">For results, bookings or anything else. We reply within one working day — faster on WhatsApp.</p>
            <p className="text-[16px]"><strong>Phone</strong> {BUSINESS.phone}<br /><strong>WhatsApp</strong> {BUSINESS.whatsapp}<br /><strong>Email</strong> {BUSINESS.email}</p>
          </div>
          {sent ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)"><Check className="size-7" /></span>
              <p className="text-[17px] font-semibold">Message sent</p>
              <p className="text-[15px] text-(--s-muted)">We&apos;ll get back to you within one working day.</p>
            </Card>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4 rounded-(--s-radius-lg) bg-(--s-card) p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldLabel label="Name"><input required className={inputClass} autoComplete="name" /></FieldLabel>
                <FieldLabel label="Phone"><input required className={inputClass} inputMode="tel" autoComplete="tel" /></FieldLabel>
              </div>
              <FieldLabel label="Email"><input type="email" className={inputClass} autoComplete="email" /></FieldLabel>
              <FieldLabel label="Message"><textarea required rows={4} className={cn(inputClass, "h-auto py-3")} /></FieldLabel>
              <SButton type="submit" size="lg">Send message</SButton>
            </form>
          )}
        </div>
      </Section>
    </>
  )
}

/** Stylised map of Penang with the three centres (no third-party map embed) */
function MapCard({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-tint)" role="group" aria-label="Map of our centres">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <path d="M0 0H100V100H0Z" fill="var(--s-soft)" opacity="0.35" />
        <path d="M18 18C30 8 52 6 66 14C76 20 74 34 70 46C66 58 72 70 66 84C60 96 40 98 30 90C20 82 24 66 18 56C12 44 8 26 18 18Z" fill="var(--s-paper)" />
        <path d="M78 0H100V60C94 50 86 46 80 40C76 30 82 14 78 0Z" fill="var(--s-paper)" />
        <path d="M30 30L62 30M40 20L44 88M22 60L66 64M58 18L60 90" stroke="var(--s-line)" strokeWidth="0.6" />
        <path d="M70 32L82 26" stroke="var(--s-muted)" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      </svg>
      {LOCATIONS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onPick(l.id)}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${l.map.x}%`, top: `${l.map.y}%` }}
          aria-label={`${l.name} centre`}
        >
          <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold shadow-md", active === l.id ? "bg-(--s-primary) text-(--s-on-primary)" : "bg-white text-(--s-ink)")}>
            <MapPin className="size-3.5" /> {l.name}
          </span>
        </button>
      ))}
      <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-(--s-muted)">Penang</span>
    </div>
  )
}

export function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Answers before you visit" intro="Can't find what you need? Message us on WhatsApp — a real person replies." />
      <Section>
        <Accordion.Root type="single" collapsible defaultValue="0" className="mx-auto max-w-3xl">
          {FAQS.map((f, i) => (
            <Accordion.Item key={f.q} value={String(i)} className="border-b border-(--s-line)">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center gap-4 py-5 text-left">
                  <span className="flex-1 text-[18px] font-semibold">{f.q}</span>
                  <ChevronDown className="size-5 shrink-0 text-(--s-muted) transition-transform group-data-[state=open]:rotate-180 group-data-[state=open]:text-(--s-primary)" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[bp-accordion-up_200ms_ease-out] data-[state=open]:animate-[bp-accordion-down_250ms_ease-out]">
                <p className="pb-5 text-[16px] leading-relaxed text-(--s-muted)">{f.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Section>
    </>
  )
}

function Legal({ title, intro, sections }: { title: string; intro: string; sections: [string, string][] }) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} intro={intro} />
      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <p className="text-[14px] text-(--s-muted)">Last updated 1 October 2026</p>
          {sections.map(([h, body], i) => (
            <section key={h} className="flex flex-col gap-2">
              <H as="h2" className="text-[22px]">{i + 1}. {h}</H>
              <p className="text-[16px] leading-relaxed text-(--s-muted)">{body}</p>
            </section>
          ))}
        </div>
      </Section>
    </>
  )
}

export function TermsPage() {
  return (
    <Legal
      title="Terms and Conditions"
      intro={`These terms apply when you book or receive services from ${BUSINESS.legalName}.`}
      sections={[
        ["Bookings", "Bookings made online or on WhatsApp are held for 15 minutes past the chosen time. Walk-ins are served in order of arrival."],
        ["Prices and payment", "Prices are in Ringgit Malaysia and include sample collection and an online report. Payment is due at the time of collection unless covered by a panel or insurer."],
        ["Results", "Results are reviewed before release. Reference ranges are provided as a guide; please discuss your results with a doctor."],
        ["Cancellations", "You can cancel or change a booking at no cost up to two hours before your appointment."],
        ["Liability", "We take every reasonable care to ensure accurate results. Our liability is limited to the cost of the test concerned."],
      ]}
    />
  )
}

export function PrivacyPage() {
  return (
    <Legal
      title="Privacy Policy"
      intro="How we collect, use and protect your personal and health information, in line with the Personal Data Protection Act 2010."
      sections={[
        ["What we collect", "Your name, IC or passport number, contact details, the tests requested, your samples and the results."],
        ["How we use it", "To perform your tests, send your results, bill you or your panel, and meet our legal and accreditation duties."],
        ["Who we share it with", "Only you, the doctor or clinic you name, and your insurer or employer where you have agreed to it. We never sell your data."],
        ["How long we keep it", "Laboratory records are kept for at least seven years, as required for accredited medical laboratories."],
        ["Your rights", `You may ask to see or correct your data at any time by writing to ${BUSINESS.email}.`],
      ]}
    />
  )
}

export function GenericPage({ title }: { title: string }) {
  const { book } = useSite()
  return (
    <>
      <PageHero eyebrow="Bakti Analisa" title={title} intro="This page was added to the plan. It has a starter layout — ask the agent to write the full content." />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {["Overview", "Details", "Next steps"].map((h) => (
            <Card key={h} className="flex flex-col gap-3">
              <H as="h2" className="text-[20px]">{h}</H>
              <div className="flex flex-col gap-2" aria-hidden>
                <span className="h-3 w-full rounded-full bg-(--s-line)" />
                <span className="h-3 w-5/6 rounded-full bg-(--s-line)" />
                <span className="h-3 w-2/3 rounded-full bg-(--s-line)" />
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10"><SButton size="lg" onClick={() => book()}>Book a test</SButton></div>
      </Section>
    </>
  )
}
