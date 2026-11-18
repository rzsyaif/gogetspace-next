"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Building2, CalendarCheck, Check, ChevronDown, Clock, FileText, Handshake, Lock, MapPin, MessageCircle, Phone, ShieldAlert, Star, Users } from "lucide-react"
import { cn } from "@/lib/cn"
import { LAW_DEMO, feeText, type PracticeArea } from "@/lib/playbooks/lawyer-plan"
import { siteAreas } from "@/lib/playbooks/law-site-config"
import { Card, Eyebrow, FieldLabel, H, PageHero, SButton, Section, container, inputClass } from "@/components/bakti-site/ui"
import { LawHero, initials, lawTrustItems } from "./hero"
import { LLink, NOT_ADVICE, RELATIONSHIP, useLaw } from "./shell"

/* ---------------- shared bits ---------------- */

function MainCta({ size = "lg", className }: { size?: "md" | "lg"; className?: string }) {
  const { cta } = useLaw()
  return (
    <LLink slug={cta.slug} size={size} className={className}>
      {cta.label} <ArrowRight />
    </LLink>
  )
}

function NotAdvice({ className }: { className?: string }) {
  return <p className={cn("text-[13px] text-(--s-muted) italic", className)}>{NOT_ADVICE}</p>
}

function AreaCard({ a }: { a: PracticeArea }) {
  const { c, href } = useLaw()
  return (
    <Link href={href(a.slug)} className="group flex flex-col gap-3 rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-6 transition-colors hover:border-(--s-primary)">
      <H as="h3" className="text-[21px]">
        {a.title}
      </H>
      <p className="flex-1 text-[15px] leading-relaxed text-(--s-muted)">{a.short}</p>
      <p className="flex items-center justify-between gap-3 border-t border-(--s-line) pt-3 text-[14px]">
        <span className="font-semibold tabular-nums">{feeText(a, c.fees, c.jurisdiction)}</span>
        <span className="flex items-center gap-1 font-semibold text-(--s-primary)">
          Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </p>
    </Link>
  )
}

function Lawyers({ limit }: { limit?: number }) {
  const { c, rules } = useLaw()
  const people: { name: string; role: string; focus: string; reg?: string }[] = c.team?.length
    ? c.team.map((p) => ({ name: p.name, role: "Lawyer", focus: "[Practice areas they focus on]", reg: p.reg }))
    : c.demo
      ? [
          { name: LAW_DEMO.lawyers[0], role: "Partner · LLB (Hons) Malaya", focus: "Family law and wills — focused on calm, private resolutions" },
          { name: LAW_DEMO.lawyers[1], role: "Partner · LLB (Hons) London", focus: "Property and business contracts" },
        ]
      : [
          { name: "[Lawyer name]", role: "[Role and qualifications]", focus: "[Practice areas they focus on]" },
          { name: "[Lawyer name]", role: "[Role and qualifications]", focus: "[Practice areas they focus on]" },
        ]
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {people.slice(0, limit).map((p, i) => (
        <Card key={i} className="flex items-start gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-(--s-soft) text-[20px] font-semibold text-(--s-ink)">{c.demo || c.team?.length ? initials(p.name) : "?"}</span>
          <div className="flex flex-col gap-1">
            <H as="h3" className="text-[19px]">
              {p.name}
            </H>
            <p className="text-[14px] font-medium text-(--s-primary)">{p.role}</p>
            <p className="text-[15px] text-(--s-muted)">{p.focus}</p>
            <p className="mt-1 text-[13px] text-(--s-muted)">
              {rules.registration.charAt(0).toUpperCase() + rules.registration.slice(1)}: {p.reg ?? "[added by the firm]"}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}

function Faq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="flex flex-col divide-y divide-(--s-line) rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card)">
      {items.map(([q, a], i) => (
        <div key={q}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[17px] font-semibold">
            {q}
            <ChevronDown className={cn("size-5 shrink-0 text-(--s-muted) transition-transform", open === i && "rotate-180")} />
          </button>
          {open === i && <p className="px-6 pb-5 text-[15px] leading-relaxed text-(--s-muted)">{a}</p>}
        </div>
      ))}
    </div>
  )
}

function faqItems(fees: string, meeting: string): [string, string][] {
  return [
    ["How much will it cost?", fees === "ask" ? "Every matter is different, so we agree the fee with you at the first meeting — in writing, before any work starts." : "Our fees page shows starting fees for fixed-fee work. For everything else we explain how the fee works and agree it with you before we start."],
    ["Is what I tell you confidential?", "Yes. What you tell us stays between us. Please don't send confidential details through the website — we'll discuss them on a call or in person."],
    ["Is the first meeting free?", meeting === "free" ? "Yes — the first meeting is free and lasts about 30 minutes." : meeting === "evaluation" ? "We start with a free case evaluation call of 15 to 20 minutes." : meeting === "fixed" ? "Many matters have a fixed-fee package; the first meeting is part of it." : "The initial consultation is paid. We tell you the fee when you book."],
    ["How long will my matter take?", "Every matter is different. We'll give you an honest estimate at the first meeting and keep you updated as it goes."],
    ["What should I bring?", "Any letters or papers you've received, and a short note of the key dates. We'll send you a checklist when we confirm your meeting."],
  ]
}

function SafetyNotice() {
  const { rules, c } = useLaw()
  return (
    <div className="flex items-start gap-3 rounded-(--s-radius) border border-(--s-accent)/40 bg-(--s-tint) p-4 text-[15px]">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-(--s-primary)" />
      <p>If you are in immediate danger, call {c.jurisdiction === "unsure" ? "your local emergency number" : rules.emergencyNumber} or go to the nearest police station.</p>
    </div>
  )
}

function ConsentLine() {
  const { rules } = useLaw()
  return (
    <label className="flex items-start gap-3 text-[14px] text-(--s-muted)">
      <input type="checkbox" required className="mt-1 size-4 accent-(--s-primary)" />
      <span>
        I agree to the privacy policy ({rules.dataLaw}). Sending this doesn&apos;t create a lawyer-client relationship until the firm confirms in writing.
      </span>
    </label>
  )
}

function Done({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 py-4">
      <span className="grid size-12 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
        <Check className="size-6" />
      </span>
      <H as="h2" className="text-[24px]">
        {title}
      </H>
      <p className="text-[16px] text-(--s-muted)">{children}</p>
    </div>
  )
}

/** "Is it safe to leave a message?" and how to reach them: the discreet contact option (§8.3) */
function DiscreetContact() {
  return (
    <>
      <FieldLabel label="How should we contact you?">
        <select className={inputClass}>
          <option>WhatsApp message</option>
          <option>Phone call</option>
          <option>Email</option>
        </select>
      </FieldLabel>
      <fieldset className="flex flex-wrap gap-4 text-[15px]">
        <legend className="mb-2 text-[14px] font-medium">Is it safe to leave a message on this number?</legend>
        <label className="flex items-center gap-2"><input type="radio" name="safe" defaultChecked className="accent-(--s-primary)" /> Yes</label>
        <label className="flex items-center gap-2"><input type="radio" name="safe" className="accent-(--s-primary)" /> No — please don&apos;t</label>
      </fieldset>
    </>
  )
}

/* ---------------- home ---------------- */

export function LawHome() {
  const { c, theme, has, phone, hours, address } = useLaw()
  const areas = siteAreas(c)
  return (
    <>
      <div className="@container">
        <div className={container}>
          <LawHero
            c={c}
            theme={theme}
            cta={<MainCta />}
            secondary={
              <LLink slug="practice-areas" tone="secondary" size="lg">
                Practice areas{c.fees !== "ask" ? " & fees" : ""}
              </LLink>
            }
          />
        </div>
      </div>
      <div className="border-y border-(--s-line) bg-(--s-card)">
        <div className={cn(container, "grid grid-cols-2 gap-4 py-5 text-[14px] font-medium lg:grid-cols-4")}>
          {lawTrustItems(c).map(({ Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon className="size-4 shrink-0 text-(--s-primary)" /> {label}
            </span>
          ))}
        </div>
      </div>

      {has("urgent-line") && (
        <Section>
          <div className="flex flex-col items-start gap-5 rounded-(--s-radius-lg) bg-(--s-ink) p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <H as="h2" className="text-[26px] !text-white">
                Arrested, charged or asked for a statement?
              </H>
              <p className="text-white/70">Call before you say anything else. A lawyer will tell you what happens next.</p>
            </div>
            <LLink slug="urgent" tone="light" size="lg">
              <Phone /> Call {phone}
            </LLink>
          </div>
        </Section>
      )}

      <Section className={has("urgent-line") ? "pt-0 sm:pt-0" : undefined}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Practice areas</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">How we can help</H>
          </div>
          <LLink slug="practice-areas" tone="secondary">
            All practice areas
          </LLink>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {areas.slice(0, 3).map((a) => (
            <AreaCard key={a.id} a={a} />
          ))}
        </div>
        <NotAdvice className="mt-5" />
      </Section>

      <Section tone="tint">
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>Your first meeting</Eyebrow>
          <H className="text-[32px] sm:text-[40px]">What happens when you contact us</H>
        </div>
        <ol className="grid gap-5 md:grid-cols-3">
          {[
            { Icon: CalendarCheck, t: has("consultations") ? "Request a time online" : "Call or message us", d: has("consultations") ? "Pick a time that suits you. We check for conflicts and confirm within one working day." : "Tell us briefly what it's about — no confidential details yet — and how we should contact you." },
            { Icon: Handshake, t: "A first meeting", d: "We listen, explain your options in plain words and tell you what it will cost — before any work starts." },
            { Icon: FileText, t: "A clear next step", d: "If we can help, we confirm in writing what we'll do, the fee and the timeline. Nothing is agreed until then." },
          ].map(({ Icon, t, d }, i) => (
            <li key={t} className="flex flex-col gap-3 rounded-(--s-radius-lg) bg-(--s-card) p-6">
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-(--s-primary) text-[15px] font-semibold text-(--s-on-primary)">{i + 1}</span>
                <Icon className="size-5 text-(--s-primary)" />
              </span>
              <H as="h3" className="text-[19px]">
                {t}
              </H>
              <p className="text-[15px] leading-relaxed text-(--s-muted)">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {has("legal-reviews") && c.reviews && (
        <Section>
          <div className="mb-10 flex flex-col gap-3">
            <Eyebrow>Reviews</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">{c.demo ? LAW_DEMO.rating : "What clients say"}</H>
          </div>
          <Card className="flex items-start gap-3 text-[15px] text-(--s-muted)">
            <Star className="mt-0.5 size-5 shrink-0 text-(--s-accent)" />
            Your real Google reviews appear here, with the clients&apos; consent. We never write, edit or select reviews to imply results.
          </Card>
        </Section>
      )}

      <Section tone={has("legal-reviews") && c.reviews ? "tint" : undefined}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Our lawyers</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">Who you&apos;ll speak to</H>
          </div>
          <LLink slug="our-lawyers" tone="secondary">
            Meet the team
          </LLink>
        </div>
        <Lawyers limit={2} />
      </Section>

      <Section tone="tint">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Eyebrow>Visit us</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">Hours and location</H>
            <ul className="flex flex-col gap-3 text-[16px]">
              <li className="flex items-start gap-3"><MapPin className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {address}</li>
              <li className="flex items-start gap-3"><Clock className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {hours}</li>
              <li className="flex items-start gap-3"><Phone className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {phone}</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <MainCta size="md" />
            </div>
          </div>
          <Card className="flex h-fit flex-col gap-3">
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <Lock className="size-5 text-(--s-primary)" /> Confidential from the first call
            </span>
            <p className="text-[15px] leading-relaxed text-(--s-muted)">{RELATIONSHIP}</p>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-3">
            <Eyebrow>FAQ</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">Questions clients ask us</H>
          </div>
          <Faq items={faqItems(c.fees, c.meeting).slice(0, 4)} />
        </div>
      </Section>
    </>
  )
}

/* ---------------- inner pages ---------------- */

export function PracticeAreasPage() {
  const { c } = useLaw()
  return (
    <>
      <PageHero eyebrow="Practice areas" title="How we can help" intro="Find your kind of problem. Each page explains the process, how fees work and what we can't promise." />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {siteAreas(c).map((a) => (
            <AreaCard key={a.id} a={a} />
          ))}
        </div>
        <NotAdvice className="mt-6" />
      </Section>
    </>
  )
}

/** §6.2 practice area template */
export function AreaPage({ a }: { a: PracticeArea }) {
  const { c } = useLaw()
  return (
    <>
      <PageHero eyebrow="Practice area" title={a.title} intro={a.short}>
        <div className="mt-2 flex flex-wrap gap-3">
          <MainCta size="md" />
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-8 text-[16px] leading-relaxed">
            <Block title="Who we help">{a.who}</Block>
            <Block title="What we can do">
              <ul className="flex flex-col gap-2">
                {a.matters.map((m) => (
                  <li key={m} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-(--s-primary)" /> {m}</li>
                ))}
              </ul>
            </Block>
            <Block title="What the process looks like">
              <ol className="flex flex-col gap-2">
                {a.steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-(--s-tint) text-[13px] font-semibold text-(--s-primary)">{i + 1}</span> {s}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-(--s-muted)">{a.timeline}</p>
            </Block>
            <Block title="What to bring">Any letters or papers you&apos;ve received, and a short note of the key dates. We&apos;ll send a checklist when we confirm your meeting.</Block>
            <Block title="What we can't promise">Every matter is different. We&apos;ll tell you honestly where you stand — we never promise an outcome.</Block>
            <NotAdvice />
          </div>
          <Card className="flex h-fit flex-col gap-3">
            <p className="text-[14px] text-(--s-muted)">Fees</p>
            <p className="text-[26px] font-semibold tabular-nums">{feeText(a, c.fees, c.jurisdiction)}</p>
            <p className="text-[14px] text-(--s-muted)">{a.fee.model}.</p>
            <MainCta size="md" className="mt-2 w-full" />
          </Card>
        </div>
      </Section>
    </>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <H as="h2" className="text-[24px]">
        {title}
      </H>
      <div className="text-(--s-muted)">{children}</div>
    </div>
  )
}

export function LawyersPage() {
  const { rules, c } = useLaw()
  return (
    <>
      <PageHero eyebrow="Our lawyers" title="Who you'll speak to" intro={c.jurisdiction === "unsure" ? "Each lawyer's admission and registration, as the rules require." : `Every lawyer is admitted in ${rules.label} and regulated by ${rules.regulator}.`} />
      <Section>
        <Lawyers />
      </Section>
    </>
  )
}

export function HowWeWorkPage() {
  const { c } = useLaw()
  return (
    <>
      <PageHero eyebrow="How we work" title="No surprises, from the first call" intro="What happens at the first meeting, how fees work, how we keep things confidential and how long things usually take." />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            ["The first meeting", faqItems(c.fees, c.meeting)[2][1]],
            ["How fees work", c.fees === "ask" ? "We agree the fee with you in writing before any work starts." : "Fixed fees where we can, and a clear estimate where we can't — agreed in writing before any work starts."],
            ["Confidentiality", "What you tell us stays between us. We never put case details in emails or messages to you — we'll call instead."],
            ["How long things take", "Every matter is different. We give you an honest estimate at the start and keep you updated."],
          ].map(([h, p]) => (
            <Card key={h} className="flex flex-col gap-2">
              <H as="h2" className="text-[22px]">
                {h}
              </H>
              <p className="text-[15px] leading-relaxed text-(--s-muted)">{p}</p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}

export function FeesPage() {
  const { c } = useLaw()
  return (
    <>
      <PageHero eyebrow="Fees" title="How our fees work" intro={c.fees === "ask" ? "Every matter is different, so we agree the fee with you at the first meeting — in writing." : "Starting fees for fixed-fee work. Everything else is discussed at the first meeting and agreed in writing."} />
      <Section>
        <div className="overflow-hidden rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card)">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-(--s-tint) text-[13px] tracking-[0.06em] text-(--s-muted) uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Practice area</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">How it&apos;s charged</th>
                <th className="px-5 py-3 text-right font-semibold">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--s-line)">
              {siteAreas(c).map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-4 font-medium">{a.title}</td>
                  <td className="hidden px-5 py-4 text-(--s-muted) sm:table-cell">{a.fee.model}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums">{feeText(a, c.fees, c.jurisdiction)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-[14px] text-(--s-muted)">What affects the fee: how complex the matter is, how much the other side disputes, and how long it takes. We tell you before costs change.</p>
      </Section>
    </>
  )
}

export function ContactPage() {
  const { c, phone, whatsapp, hours, address } = useLaw()
  const [sent, setSent] = useState(false)
  return (
    <>
      <PageHero eyebrow="Contact" title="Contact us" intro={`${c.name}${c.place ? `, ${c.place}` : ""}. Call, WhatsApp or send a short message — tell us how you'd like us to reply.`} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col gap-3 text-[16px]">
              <li className="flex items-start gap-3"><MapPin className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {address}</li>
              <li className="flex items-start gap-3"><Clock className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {hours}</li>
              <li className="flex items-start gap-3"><Phone className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {phone}</li>
              <li className="flex items-start gap-3"><MessageCircle className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {whatsapp}</li>
            </ul>
            {(c.areas.includes("family") || c.areas.includes("criminal")) && <SafetyNotice />}
          </div>
          <Card>
            {sent ? (
              <Done title="Message sent">We&apos;ll reply the way you asked, within one working day.</Done>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), setSent(true))}>
                <H as="h2" className="text-[22px]">
                  Send us a short message
                </H>
                <FieldLabel label="Your name">
                  <input required className={inputClass} autoComplete="name" />
                </FieldLabel>
                <FieldLabel label="Phone or WhatsApp">
                  <input required className={inputClass} inputMode="tel" autoComplete="tel" />
                </FieldLabel>
                <DiscreetContact />
                <FieldLabel label="What is it about? (a sentence is enough)">
                  <textarea rows={3} maxLength={300} className={cn(inputClass, "h-auto py-3")} placeholder="Please don't include confidential details — we'll discuss them on a call." />
                </FieldLabel>
                <ConsentLine />
                <SButton type="submit" className="self-start">
                  Send message
                </SButton>
              </form>
            )}
          </Card>
        </div>
      </Section>
    </>
  )
}

export function FaqPage() {
  const { c } = useLaw()
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions clients ask us" intro="Cost, confidentiality, the first meeting and how long things take." />
      <Section>
        <div className="flex max-w-3xl flex-col gap-5">
          <Faq items={faqItems(c.fees, c.meeting)} />
          <NotAdvice />
        </div>
      </Section>
    </>
  )
}

/** consultation booking: request-to-confirm for new clients, so the lawyer can run a conflict check (§8.2) */
export function BookPage() {
  const { c } = useLaw()
  const [step, setStep] = useState(0)
  const [type, setType] = useState("initial")
  const [slot, setSlot] = useState<string | null>(null)
  const types = [
    { id: "initial", label: c.meeting === "free" ? "Free first meeting · 30 min" : "Initial consultation · 45 min", note: "Phone, video or in person" },
    ...(c.meeting === "evaluation" || c.areas.includes("injury") ? [{ id: "evaluation", label: "Case evaluation call · 15 min", note: "Free" }] : []),
    { id: "review", label: "Document review session · 30 min", note: "Bring the papers you've received" },
  ]
  return (
    <>
      <PageHero eyebrow="Consultation" title={c.areas.includes("family") ? "Book a confidential consultation" : "Book a consultation"} intro="Pick a type and a time. We run a quick conflict check and confirm within one working day." />
      <Section>
        <Card className="mx-auto flex max-w-2xl flex-col gap-6">
          {step < 3 && (
            <ol className="flex gap-2 text-[13px] font-semibold">
              {["Meeting", "Time", "Your details"].map((s, i) => (
                <li key={s} className={cn("flex-1 border-t-4 pt-2", i <= step ? "border-(--s-primary) text-(--s-ink)" : "border-(--s-line) text-(--s-muted)")}>
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
          )}
          {step === 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[16px] font-semibold">What kind of meeting?</legend>
              {types.map((t) => (
                <label key={t.id} className={cn("flex cursor-pointer items-center gap-3 rounded-(--s-radius) border px-4 py-3", type === t.id ? "border-(--s-primary) bg-(--s-tint)" : "border-(--s-line)")}>
                  <input type="radio" name="type" checked={type === t.id} onChange={() => setType(t.id)} className="accent-(--s-primary)" />
                  <span className="flex flex-1 flex-col">
                    <span>{t.label}</span>
                    <span className="text-[13px] text-(--s-muted)">{t.note}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-[16px] font-semibold">Pick a time</p>
              <div className="grid grid-cols-3 gap-2">
                {["Tue 10:00 am", "Tue 3:00 pm", "Wed 11:00 am", "Wed 4:30 pm", "Thu 9:30 am", "Fri 2:00 pm"].map((s) => (
                  <button key={s} type="button" onClick={() => setSlot(s)} className={cn("h-12 rounded-(--s-radius) border text-[14px]", slot === s ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line)")}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[13px] text-(--s-muted)">At least 24 hours&apos; notice. Free to reschedule until 24 hours before.</p>
            </div>
          )}
          {step === 2 && (
            <form id="law-book" className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), setStep(3))}>
              <FieldLabel label="Full name">
                <input required className={inputClass} autoComplete="name" />
              </FieldLabel>
              <FieldLabel label="Phone or WhatsApp">
                <input required className={inputClass} inputMode="tel" autoComplete="tel" />
              </FieldLabel>
              <FieldLabel label="Area of law">
                <select className={inputClass}>
                  {siteAreas(c).map((a) => (
                    <option key={a.id}>{a.title}</option>
                  ))}
                  <option>Not sure</option>
                </select>
              </FieldLabel>
              <DiscreetContact />
              <p className="text-[13px] text-(--s-muted)">{RELATIONSHIP}</p>
              <ConsentLine />
            </form>
          )}
          {step === 3 && <Done title="Request received">{slot} — we&apos;ll run a quick conflict check and confirm by the method you chose, usually within one working day.</Done>}
          <div className="flex justify-between gap-3 border-t border-(--s-line) pt-5">
            {step > 0 && step < 3 ? (
              <SButton tone="ghost" onClick={() => setStep(step - 1)}>
                Back
              </SButton>
            ) : (
              <span />
            )}
            {step === 0 && <SButton onClick={() => setStep(1)}>Continue</SButton>}
            {step === 1 && (
              <SButton disabled={!slot} onClick={() => setStep(2)}>
                Continue
              </SButton>
            )}
            {step === 2 && (
              <SButton type="submit" form="law-book">
                Request consultation
              </SButton>
            )}
          </div>
        </Card>
      </Section>
    </>
  )
}

/** §8.3 case enquiry form: short, confidential, with an optional other-party name for the conflict check */
export function EnquiryPage() {
  const { c } = useLaw()
  const [sent, setSent] = useState(false)
  return (
    <>
      <PageHero eyebrow="Enquiry" title="Tell us about your matter" intro="A few short questions. We'll reply within one working day — and never ask for confidential details here." />
      <Section>
        <Card className="mx-auto max-w-2xl">
          {sent ? (
            <Done title="Enquiry received">Thank you. We&apos;ll be in touch the way you asked. This reply is not legal advice.</Done>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), setSent(true))}>
              <p className="flex items-start gap-2 rounded-(--s-radius) bg-(--s-tint) p-3 text-[14px]">
                <Lock className="mt-0.5 size-4 shrink-0 text-(--s-primary)" /> {RELATIONSHIP}
              </p>
              <FieldLabel label="Full name">
                <input required className={inputClass} autoComplete="name" />
              </FieldLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldLabel label="Phone or WhatsApp">
                  <input required className={inputClass} inputMode="tel" autoComplete="tel" />
                </FieldLabel>
                <FieldLabel label="Email (optional)">
                  <input type="email" className={inputClass} autoComplete="email" />
                </FieldLabel>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldLabel label="Area of law">
                  <select className={inputClass}>
                    {siteAreas(c).map((a) => (
                      <option key={a.id}>{a.title}</option>
                    ))}
                    <option>Not sure</option>
                  </select>
                </FieldLabel>
                <FieldLabel label="How urgent is it?">
                  <select className={inputClass}>
                    <option>Within 48 hours</option>
                    <option>Soon</option>
                    <option>Just exploring</option>
                  </select>
                </FieldLabel>
              </div>
              <DiscreetContact />
              <FieldLabel label="In a sentence or two, what is it about?">
                <textarea rows={3} maxLength={300} className={cn(inputClass, "h-auto py-3")} placeholder="Up to 300 characters — no confidential details." />
              </FieldLabel>
              <FieldLabel label="The other party's name (optional)">
                <input className={inputClass} />
                <span className="text-[13px] font-normal text-(--s-muted)">Only so we can check we&apos;re free to act for you.</span>
              </FieldLabel>
              <ConsentLine />
              <SButton type="submit" className="self-start">
                Send enquiry
              </SButton>
            </form>
          )}
        </Card>
      </Section>
    </>
  )
}

export function FeeProposalPage() {
  const [sent, setSent] = useState(false)
  return (
    <>
      <PageHero eyebrow="Fee proposal" title="Request a fee proposal" intro="Tell us what you need. We reply with the scope, the fee, a timeline and how long the proposal is valid." />
      <Section>
        <Card className="mx-auto max-w-2xl">
          {sent ? (
            <Done title="Request received">We&apos;ll send your fee proposal within two working days.</Done>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), setSent(true))}>
              <FieldLabel label="Name or company">
                <input required className={inputClass} autoComplete="organization" />
              </FieldLabel>
              <FieldLabel label="Type of work">
                <select className={inputClass}>
                  <option>Contract drafting or review</option>
                  <option>Company formation</option>
                  <option>Shareholder agreement</option>
                  <option>Monthly legal support (retainer)</option>
                  <option>Something else</option>
                </select>
              </FieldLabel>
              <FieldLabel label="A short description">
                <textarea rows={3} maxLength={300} className={cn(inputClass, "h-auto py-3")} placeholder="Please don't include confidential details yet." />
              </FieldLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldLabel label="When do you need it?">
                  <select className={inputClass}>
                    <option>Within two weeks</option>
                    <option>This month</option>
                    <option>No rush</option>
                  </select>
                </FieldLabel>
                <FieldLabel label="Budget range (optional)">
                  <input className={inputClass} />
                </FieldLabel>
              </div>
              <DiscreetContact />
              <ConsentLine />
              <SButton type="submit" className="self-start">
                Request proposal
              </SButton>
            </form>
          )}
        </Card>
      </Section>
    </>
  )
}

export function UrgentPage() {
  const { c, phone, whatsapp } = useLaw()
  return (
    <>
      <section className="bg-(--s-ink) py-14 text-white sm:py-20">
        <div className={cn(container, "flex flex-col gap-5")}>
          <Eyebrow className="!text-(--s-accent)">Urgent help</Eyebrow>
          <H as="h1" className="max-w-3xl text-[36px] leading-[1.1] !text-white sm:text-[52px]">
            Call us now
          </H>
          <p className="max-w-2xl text-[18px] text-white/75">{c.urgent === "always" ? "A lawyer answers 24 hours a day." : c.urgent === "hours" ? "A lawyer answers during opening hours, and calls you back after hours." : "Call first — we'll tell you what to do next."}</p>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${phone}`} className="inline-flex h-13 items-center gap-2 rounded-(--s-btn-radius) bg-white px-6 font-semibold text-(--s-ink)">
              <Phone className="size-5" /> Call {phone}
            </a>
            <span className="inline-flex h-13 items-center gap-2 rounded-(--s-btn-radius) border border-white/30 px-6 font-semibold">
              <MessageCircle className="size-5" /> {whatsapp}
            </span>
          </div>
        </div>
      </section>
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <SafetyNotice />
          <Card className="flex flex-col gap-3">
            <H as="h2" className="text-[22px]">
              What to do now
            </H>
            <ul className="flex flex-col gap-2 text-[15px]">
              {["Stay calm and be polite", "You can ask to speak to a lawyer before answering questions", "Write down names, times and what was said", "Don't sign anything you don't understand"].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-(--s-primary)" /> {x}</li>
              ))}
            </ul>
            <NotAdvice />
          </Card>
        </div>
      </Section>
    </>
  )
}

export function ArticlesPage() {
  const { c } = useLaw()
  const areas = siteAreas(c)
  return (
    <>
      <PageHero eyebrow="Articles" title="Legal information, in plain words" intro="General information to help you understand your situation. It isn't legal advice — for that, talk to us." />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {areas.slice(0, 3).map((a) => (
            <Card key={a.id} className="flex flex-col gap-3">
              <span className="w-fit rounded-full bg-(--s-tint) px-2.5 py-1 text-[12px] font-semibold text-(--s-primary)">{a.title}</span>
              <H as="h2" className="text-[20px]">
                {a.id === "family" ? "What happens in an uncontested divorce?" : a.id === "property" ? "Buying your first home: the legal steps" : a.id === "business" ? "Five things every service contract should say" : a.id === "estates" ? "Why a simple will matters" : `${a.title}: where to start`}
              </H>
              <p className="text-[13px] text-(--s-muted)">Draft — for the lawyer&apos;s review before publishing</p>
            </Card>
          ))}
        </div>
        <NotAdvice className="mt-6" />
      </Section>
    </>
  )
}

export function OfficesPage() {
  const { c } = useLaw()
  return (
    <>
      <PageHero eyebrow="Offices" title="Find the office nearest you" intro="The same standards and fees at every office." />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[c.place ?? "[Office one]", "[Office two]"].map((b) => (
            <Card key={b} className="flex flex-col gap-2">
              <Building2 className="size-6 text-(--s-primary)" />
              <H as="h2" className="text-[22px]">
                {b}
              </H>
              <p className="flex items-center gap-2 text-[15px] text-(--s-muted)">
                <Users className="size-4" /> [Address, hours and the lawyers at this office]
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}

export function LawLegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { c, rules } = useLaw()
  const sections =
    kind === "privacy"
      ? [
          ["What we collect", "Your name, contact details, the area of law and a short description when you message or book. We never ask for confidential details, documents or ID numbers online."],
          ["How we use it", "Only to reply to you, check for conflicts and arrange your meeting. We never put case details in messages."],
          ["Your rights", `You can ask to see, correct or delete your details at any time, in line with ${rules.dataLaw}.`],
        ]
      : [
          ["Not legal advice", "Everything on this website is general information, not legal advice. Don't act on it without talking to a lawyer about your situation."],
          ["No lawyer-client relationship", "Contacting us, sending a form or booking a meeting doesn't create a lawyer-client relationship until we confirm in writing that we can act for you."],
          ["Fees", "Fees shown are starting fees for fixed-fee work. Your fee is agreed in writing before any work starts."],
        ]
  return (
    <>
      <PageHero eyebrow="Legal" title={kind === "privacy" ? "Privacy Policy" : "Terms and Disclaimer"} intro={`${c.name} · last updated November 2026`} />
      <Section>
        <div className="flex max-w-3xl flex-col gap-8">
          {sections.map(([h, p]) => (
            <div key={h} className="flex flex-col gap-2">
              <H as="h2" className="text-[22px]">
                {h}
              </H>
              <p className="text-[16px] leading-relaxed text-(--s-muted)">{p}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

export function GenericLawPage({ title }: { title: string }) {
  return (
    <>
      <PageHero eyebrow="Page" title={title} intro="This page is ready for your content." />
      <Section>
        <MainCta size="md" />
      </Section>
    </>
  )
}
