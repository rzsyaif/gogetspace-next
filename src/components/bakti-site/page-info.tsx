"use client"

import { useState, type FormEvent } from "react"
import { Accordion } from "radix-ui"
import {
  AlertTriangle,
  Award,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Smile,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { BUSINESS, EMERGENCY_NOTICE, FAQS, LOCATIONS, TEAM } from "@/lib/bakti/content"
import { useSite } from "./site-shell"
import { Card, Eyebrow, FieldLabel, H, PageHero, SButton, Section, inputClass } from "./ui"

export function AboutPage() {
  const { book } = useSite()
  return (
    <>
      <PageHero
        eyebrow="Our Dentists & Practice"
        title="Experienced, caring dental professionals dedicated to your smile"
        intro="Registered dental surgeons providing honest advice, gentle treatments and modern dental care in Penang."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5 text-[17px] leading-relaxed text-(--s-muted)">
            <p>
              At {BUSINESS.name}, our philosophy is straightforward: we treat patients like family. We listen carefully to what matters to you, provide honest explanations of your clinical options, and never recommend unnecessary procedures.
            </p>
            <p>
              All our dentists are registered with the Malaysian Dental Council (MDC), practicing under strict sterilisation and infection control protocols in line with Ministry of Health Malaysia standards.
            </p>
            <p>
              Whether you need a routine cleaning, are exploring clear aligners, or haven&apos;t seen a dentist in years due to anxiety, our surgeries are calm, non-judgmental spaces where you are always in control.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: Award, k: "MDC Registered", v: "Qualified dental surgeons" },
              { Icon: Smile, k: "10,000+", v: "Smiles cared for" },
              { Icon: ShieldCheck, k: "Since 2015", v: "Serving Penang communities" },
              { Icon: Clock, k: "Daily Slots", v: "Same-day emergency relief" },
            ].map(({ Icon, k, v }) => (
              <Card key={v} className="flex flex-col gap-2 p-5">
                <Icon className="size-6 text-(--s-primary)" />
                <span className="text-[22px]" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>{k}</span>
                <span className="text-[14px] text-(--s-muted)">{v}</span>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Dentist profiles per Playbook §6.1 */}
      <Section tone="tint">
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>Our dental surgeons</Eyebrow>
          <H className="text-[30px] sm:text-[38px]">Meet our clinical team</H>
          <p className="text-[15px] text-(--s-muted)">Every dentist is registered with the Malaysian Dental Council (MDC) with active annual practicing certificates.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m) => (
            <Card key={m.name} className="flex flex-col justify-between gap-5 p-7">
              <div className="flex flex-col gap-4">
                <span className="grid aspect-square w-20 place-items-center rounded-(--s-radius) bg-(--s-soft)/40 text-[28px] text-(--s-primary)" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }} aria-hidden>
                  {m.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div className="flex flex-col gap-1">
                  <H as="h3" className="text-[20px]">{m.name}</H>
                  <span className="text-[14px] font-semibold text-(--s-primary)">{m.role}</span>
                  <span className="text-[13px] text-(--s-muted)">{m.credentials}</span>
                  <span className="text-[12px] text-(--s-muted)">{m.registrationNo}</span>
                </div>
                <div className="border-t border-(--s-line) pt-3 text-[13px] text-(--s-muted)">
                  <p><strong>Areas of focus:</strong> {m.focus}</p>
                  <p className="mt-1"><strong>Languages:</strong> {m.languages}</p>
                </div>
              </div>
              <SButton tone="secondary" className="w-full" onClick={() => book()}>
                <CalendarCheck /> Book with {m.name.split(" ")[1]}
              </SButton>
            </Card>
          ))}
        </div>
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
      <PageHero
        eyebrow="Locations & Contact"
        title="Two welcoming dental clinics in Penang"
        intro="Conveniently situated in George Town and Bayan Lepas with ample patient parking and direct WhatsApp support."
      />

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
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(LOCATIONS.find((l) => l.id === active)!.address.join(", "))}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-(--s-btn-radius) border border-(--s-line) bg-(--s-card) px-5 text-[15px] font-semibold hover:border-(--s-primary)"
              >
                <Navigation className="size-4" /> Get directions
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="tint">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Eyebrow>Direct Message</Eyebrow>
            <H className="text-[30px] sm:text-[38px]">Send our reception a message</H>
            <p className="text-[16px] text-(--s-muted)">
              For enquiries, treatment estimates or appointment scheduling. We usually reply within a few hours on business days, or message our WhatsApp for faster assistance.
            </p>
            <p className="text-[16px] leading-relaxed">
              <strong>Phone:</strong> {BUSINESS.phone}<br />
              <strong>WhatsApp:</strong> {BUSINESS.whatsapp}<br />
              <strong>Emergency hotline:</strong> {BUSINESS.emergencyPhone}<br />
              <strong>Email:</strong> {BUSINESS.email}
            </p>
          </div>
          {sent ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)"><Check className="size-7" /></span>
              <p className="text-[17px] font-semibold">Message received</p>
              <p className="text-[15px] text-(--s-muted)">Our clinic desk will contact you via WhatsApp or phone shortly.</p>
            </Card>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4 rounded-(--s-radius-lg) bg-(--s-card) p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldLabel label="Full name"><input required className={inputClass} autoComplete="name" /></FieldLabel>
                <FieldLabel label="Mobile number"><input required className={inputClass} inputMode="tel" autoComplete="tel" /></FieldLabel>
              </div>
              <FieldLabel label="Email (optional)"><input type="email" className={inputClass} autoComplete="email" /></FieldLabel>
              <FieldLabel label="Your dental question or concern">
                <textarea required rows={4} placeholder="e.g. I'd like a quote for braces, or I have a question about wisdom tooth extraction." className={cn(inputClass, "h-auto py-3")} />
              </FieldLabel>
              <SButton type="submit" size="lg">Send enquiry</SButton>
            </form>
          )}
        </div>
      </Section>
    </>
  )
}

function MapCard({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-tint)" role="group" aria-label="Map of our dental practices">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <path d="M0 0H100V100H0Z" fill="var(--s-soft)" opacity="0.35" />
        <path d="M18 18C30 8 52 6 66 14C76 20 74 34 70 46C66 58 72 70 66 84C60 96 40 98 30 90C20 82 24 66 18 56C12 44 8 26 18 18Z" fill="var(--s-paper)" />
        <path d="M78 0H100V60C94 50 86 46 80 40C76 30 82 14 78 0Z" fill="var(--s-paper)" />
        <path d="M30 30L62 30M40 20L44 88M22 60L66 64M58 18L60 90" stroke="var(--s-line)" strokeWidth="0.6" />
      </svg>
      {LOCATIONS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onPick(l.id)}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${l.map.x}%`, top: `${l.map.y}%` }}
          aria-label={`${l.name} clinic`}
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
      <PageHero
        eyebrow="Frequently Asked Questions"
        title="Honest answers to common dental questions"
        intro="Everything you need to know about pain management, treatment pricing, children's visits and dental insurance."
      />
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
      <PageHero eyebrow="Legal & Patient Policy" title={title} intro={intro} />
      <Section>
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <p className="text-[14px] text-(--s-muted)">Last updated October 2026</p>
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
      title="Terms of Service"
      intro={`These terms govern dental consultations and care provided at ${BUSINESS.legalName}.`}
      sections={[
        ["Appointments & Booking", "Online and WhatsApp reservations are held for 15 minutes past scheduled appointment time. Free rescheduling or cancellation is available up to 24 hours prior."],
        ["Transparent Pricing & Estimates", "Prices stated on our website are 'from' prices for routine care. A written clinical estimate is provided following oral examination before any restorative or surgical procedure begins."],
        ["Informed Consent", "Our dental surgeons explain treatment options, prospective benefits, and potential procedural discomforts before commencing treatment. Parents or guardians must provide consent for minors."],
        ["Emergency Care", "We reserve priority slots daily for urgent pain and trauma relief. Emergency patients are prioritised based on clinical acuity."],
        ["Professional Regulations", "All dental procedures are administered in compliance with Malaysian Dental Council regulations and Private Healthcare Facilities and Services Act standards."],
      ]}
    />
  )
}

export function PrivacyPage() {
  return (
    <Legal
      title="Privacy Policy"
      intro="How we protect your personal and clinical dental health information under the Personal Data Protection Act 2010 (PDPA)."
      sections={[
        ["Personal & Contact Data", "We collect minimal information on booking forms (name, WhatsApp contact, booking preferences). Medical and dental histories are collected privately in clinic."],
        ["Clinical Health Records", "Dental X-rays, charting, and clinical notes are maintained securely under strict access controls by our licensed dental staff."],
        ["Third-Party Sharing", "We never sell patient information. Data is shared with dental laboratories or insurance providers only with your explicit written authorization."],
        ["Data Retention", "Dental health records are retained in accordance with Ministry of Health Malaysia statutory healthcare guidelines."],
        ["Access and Rectification", `You may request copies or updates to your registered contact information by emailing ${BUSINESS.email}.`],
      ]}
    />
  )
}

export function GenericPage({ title }: { title: string }) {
  const { book } = useSite()
  return (
    <>
      <PageHero eyebrow={BUSINESS.name} title={title} intro="This page is part of your dental practice website plan." />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {["Overview", "Treatment Details", "Care Guidance"].map((h) => (
            <Card key={h} className="flex flex-col gap-3 p-6">
              <H as="h2" className="text-[20px]">{h}</H>
              <div className="flex flex-col gap-2" aria-hidden>
                <span className="h-3 w-full rounded-full bg-(--s-line)" />
                <span className="h-3 w-5/6 rounded-full bg-(--s-line)" />
                <span className="h-3 w-2/3 rounded-full bg-(--s-line)" />
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <SButton size="lg" onClick={() => book()}>
            <CalendarCheck /> Book an appointment
          </SButton>
        </div>
      </Section>
    </>
  )
}
