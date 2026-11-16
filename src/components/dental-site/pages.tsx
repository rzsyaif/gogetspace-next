"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Baby, Building2, CalendarCheck, Check, ChevronDown, ClipboardList, Clock, HeartHandshake, MapPin, MessageCircle, Phone, ShieldAlert, Smile, Star } from "lucide-react"
import { cn } from "@/lib/cn"
import { DENTIST } from "@/lib/playbooks/dentist"
import { RAHMA, TREATMENTS, priceText, type Treatment } from "@/lib/playbooks/dentist-plan"
import { siteTreatments } from "@/lib/playbooks/site-config"
import { Card, Eyebrow, FieldLabel, H, PageHero, SButton, Section, container, inputClass } from "@/components/bakti-site/ui"
import { DentalHero, initials, trustItems } from "./hero"
import { DLink, useDental } from "./shell"

/* ---------------- shared bits ---------------- */

const PRICE_NOTE = "Final price confirmed after your examination."

function MainCta({ size = "lg", className }: { size?: "md" | "lg"; className?: string }) {
  const { cta } = useDental()
  return (
    <DLink slug={cta.slug ?? "contact"} size={size} className={className}>
      {cta.label} <ArrowRight />
    </DLink>
  )
}

function TreatmentCard({ t }: { t: Treatment }) {
  const { c, href } = useDental()
  return (
    <Link href={href(t.slug)} className="group flex flex-col gap-3 rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-6 transition-colors hover:border-(--s-primary)">
      <span className="grid size-11 place-items-center rounded-(--s-radius) bg-(--s-tint) text-(--s-primary)">
        <Smile className="size-5" />
      </span>
      <H as="h3" className="text-[20px]">
        {t.title}
      </H>
      <p className="flex-1 text-[15px] leading-relaxed text-(--s-muted)">{t.short}</p>
      <p className="flex items-center justify-between gap-3 border-t border-(--s-line) pt-3 text-[14px]">
        <span className="font-semibold tabular-nums">{priceText(t, c.prices)}</span>
        <span className="flex items-center gap-1 font-semibold text-(--s-primary)">
          Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </p>
    </Link>
  )
}

function Dentists({ limit }: { limit?: number }) {
  const { c } = useDental()
  const people = c.demo
    ? [
        { name: RAHMA.dentists[0], role: "Principal dentist · BDS (Malaya)", focus: "Family dentistry and gentle care for nervous patients" },
        { name: RAHMA.dentists[1], role: "Dentist · DDS (USM)", focus: "Root canal treatment, crowns and check-ups" },
      ]
    : [
        { name: "[Dentist name]", role: "[Role and qualifications]", focus: "[What they focus on]" },
        { name: "[Dentist name]", role: "[Role and qualifications]", focus: "[What they focus on]" },
      ]
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {people.slice(0, limit).map((p, i) => (
        <Card key={i} className="flex items-start gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-(--s-soft) text-[20px] font-semibold text-(--s-ink)">{c.demo ? initials(p.name) : "?"}</span>
          <div className="flex flex-col gap-1">
            <H as="h3" className="text-[19px]">
              {p.name}
            </H>
            <p className="text-[14px] font-medium text-(--s-primary)">{p.role}</p>
            <p className="text-[15px] text-(--s-muted)">{p.focus}</p>
            <p className="mt-1 text-[13px] text-(--s-muted)">{DENTIST.market.registration}: [added by the clinic]</p>
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

function faqItems(prices: string): [string, string][] {
  return [
    ["How much will my treatment cost?", prices === "ask" ? "Every mouth is different, so we give you a written estimate after your examination — before any treatment starts." : `Our prices page shows what most treatments cost. ${PRICE_NOTE}`],
    ["Will it hurt?", "We explain every step first and use local anaesthetic where it helps. Tell us if you're nervous — we'll go at your pace and you can ask us to stop at any time."],
    ["Do you see children?", "Yes. We recommend a first visit by their first birthday, and every six months after that."],
    ["What if I need to cancel?", "Please let us know at least 24 hours before by phone or WhatsApp so we can offer the slot to someone else."],
    ["Do you accept insurance?", "Bring your insurance or company panel card and we'll check your cover before treatment."],
  ]
}

function EmergencyNotice() {
  return (
    <div className="flex items-start gap-3 rounded-(--s-radius) border border-(--s-accent)/40 bg-(--s-tint) p-4 text-[15px]">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-(--s-primary)" />
      <p>{DENTIST.emergencyNotice}</p>
    </div>
  )
}

function ConsentLine() {
  return (
    <label className="flex items-start gap-3 text-[14px] text-(--s-muted)">
      <input type="checkbox" required className="mt-1 accent-(--s-primary)" />
      I agree to the privacy policy. We use your details only to arrange your visit ({DENTIST.market.dataLaw}).
    </label>
  )
}

function Done({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
        <Check className="size-8" />
      </span>
      <H as="h2" className="text-[26px]">
        {title}
      </H>
      <p className="max-w-md text-[16px] text-(--s-muted)">{children}</p>
    </div>
  )
}

/* ---------------- home ---------------- */

export function DentalHome() {
  const { c, theme, has, phone, hours, address } = useDental()
  const ts = siteTreatments(c)
  return (
    <>
      <div className="@container">
        <div className={container}>
          <DentalHero
            c={c}
            theme={theme}
            cta={<MainCta />}
            secondary={
              <DLink slug="treatments" tone="secondary" size="lg">
                See treatments{c.prices !== "ask" ? " & prices" : ""}
              </DLink>
            }
          />
        </div>
      </div>
      <div className="border-y border-(--s-line) bg-(--s-card)">
        <div className={cn(container, "grid grid-cols-2 gap-4 py-5 text-[14px] font-medium lg:grid-cols-4")}>
          {trustItems(c).map(({ Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon className="size-4 shrink-0 text-(--s-primary)" /> {label}
            </span>
          ))}
        </div>
      </div>

      {has("emergency") && (
        <Section>
          <div className="flex flex-col items-start gap-5 rounded-(--s-radius-lg) bg-(--s-ink) p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <H as="h2" className="text-[26px] !text-white">
                Toothache, a broken tooth or swelling?
              </H>
              <p className="text-white/70">We keep same-day slots for emergencies. Call first and we&apos;ll tell you what to do now.</p>
            </div>
            <DLink slug="emergency" tone="light" size="lg">
              <Phone /> Call {phone}
            </DLink>
          </div>
        </Section>
      )}

      <Section className={has("emergency") ? "pt-0 sm:pt-0" : undefined}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Treatments</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">What we can help with</H>
          </div>
          <DLink slug="treatments" tone="secondary">
            All treatments
          </DLink>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ts.slice(0, 4).map((t) => (
            <TreatmentCard key={t.id} t={t} />
          ))}
        </div>
        {c.prices !== "ask" && <p className="mt-5 text-[14px] text-(--s-muted)">{PRICE_NOTE}</p>}
      </Section>

      <Section tone="tint">
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>{c.focus === "pediatric" ? "Your child's first visit" : "Your first visit"}</Eyebrow>
          <H className="text-[32px] sm:text-[40px]">No surprises, from booking to aftercare</H>
        </div>
        <ol className="grid gap-5 md:grid-cols-3">
          {[
            { Icon: CalendarCheck, t: has("appointments") ? "Book online in a minute" : "Call or WhatsApp us", d: has("appointments") ? "Pick a time that suits you. We confirm straight away and remind you the day before." : "Tell us what you need and we'll find a time that suits you." },
            { Icon: ClipboardList, t: "We check and explain", d: "A full check-up, then a clear explanation of what we found and your options — with prices — before anything is done." },
            { Icon: HeartHandshake, t: "Treatment at your pace", d: "Nervous? Tell us. We go step by step, and you can ask us to stop at any time." },
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

      {has("reviews") && (
        <Section>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <Eyebrow>Reviews</Eyebrow>
              <H className="text-[32px] sm:text-[40px]">{c.demo ? RAHMA.rating : "What patients say"}</H>
            </div>
            <p className="text-[14px] text-(--s-muted)">From Google reviews</p>
          </div>
          {c.demo ? (
            <div className="grid gap-5 md:grid-cols-3">
              {[
                ["Aisyah M.", "Dr. Rahmah explained everything before starting and my daughter wasn't scared at all."],
                ["Kelvin T.", "Booked online the same morning for a broken filling. Quick, clear about the price, no pressure."],
                ["Priya S.", "Friendly team and the reminders mean I actually keep my check-ups now."],
              ].map(([n, q]) => (
                <Card key={n} className="flex flex-col gap-3">
                  <span className="flex gap-0.5 text-(--s-accent)">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </span>
                  <p className="flex-1 text-[16px] leading-relaxed">“{q}”</p>
                  <p className="text-[14px] font-semibold text-(--s-muted)">{n}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-[15px] text-(--s-muted)">Your real Google reviews appear here once the clinic is connected. We never write or edit reviews.</Card>
          )}
        </Section>
      )}

      <Section tone={has("reviews") ? "tint" : undefined}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Our dentists</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">Who you&apos;ll see</H>
          </div>
          <DLink slug="our-dentists" tone="secondary">
            Meet the team
          </DLink>
        </div>
        <Dentists limit={2} />
      </Section>

      <Section>
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
              <DLink slug="contact" tone="secondary">
                Get directions
              </DLink>
            </div>
          </div>
          <MapBox />
        </div>
      </Section>

      <Section tone="tint">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-3">
            <Eyebrow>FAQ</Eyebrow>
            <H className="text-[32px] sm:text-[40px]">Questions patients ask us</H>
          </div>
          <Faq items={faqItems(c.prices).slice(0, 4)} />
        </div>
      </Section>
    </>
  )
}

function MapBox() {
  const { c } = useDental()
  return (
    <div className="relative min-h-72 overflow-hidden rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-tint)">
      <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <path d="M-10 210 C 80 180, 140 240, 230 200 S 360 120, 420 150" stroke="var(--s-card)" strokeWidth="18" fill="none" />
        <path d="M120 -10 C 140 80, 100 160, 160 310" stroke="var(--s-card)" strokeWidth="12" fill="none" />
        <path d="M260 -10 L 300 320" stroke="var(--s-card)" strokeWidth="8" fill="none" />
        <circle cx="210" cy="140" r="60" fill="var(--s-soft)" opacity=".35" />
      </svg>
      <span className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <span className="rounded-(--s-radius) bg-(--s-ink) px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-white">{c.name}</span>
        <MapPin className="size-8 fill-(--s-primary) text-(--s-card)" />
      </span>
    </div>
  )
}

/* ---------------- inner pages ---------------- */

export function TreatmentsPage() {
  const { c } = useDental()
  return (
    <>
      <PageHero eyebrow="Treatments" title="Care for every stage of your smile" intro={c.prices === "ask" ? "Every treatment starts with an examination and a written estimate." : `Prices are a guide. ${PRICE_NOTE}`} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {siteTreatments(c).map((t) => (
            <TreatmentCard key={t.id} t={t} />
          ))}
        </div>
      </Section>
    </>
  )
}

export function TreatmentPage({ t }: { t: Treatment }) {
  const { c } = useDental()
  return (
    <>
      <PageHero eyebrow="Treatment" title={t.title} intro={t.short}>
        <div className="mt-2 flex flex-wrap gap-3">
          <MainCta size="md" />
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-8 text-[16px] leading-relaxed">
            {[
              ["What it is", t.short],
              ["What happens", "We examine your teeth first and explain your options, then agree a plan and a price with you before we start."],
              ["How long it takes", t.visits],
              ["Comfort", "Local anaesthetic where it helps, regular breaks, and you can ask us to stop at any time."],
              ["Aftercare", "We give you written aftercare advice and a number to call if anything doesn't feel right."],
            ].map(([h, p]) => (
              <div key={h} className="flex flex-col gap-2">
                <H as="h2" className="text-[24px]">
                  {h}
                </H>
                <p className="text-(--s-muted)">{p}</p>
              </div>
            ))}
          </div>
          <Card className="flex h-fit flex-col gap-3">
            <p className="text-[14px] text-(--s-muted)">Price</p>
            <p className="text-[28px] font-semibold tabular-nums">{priceText(t, c.prices)}</p>
            <p className="text-[14px] text-(--s-muted)">{PRICE_NOTE}</p>
            <MainCta size="md" className="mt-2 w-full" />
          </Card>
        </div>
      </Section>
    </>
  )
}

export function DentistsPage() {
  return (
    <>
      <PageHero eyebrow="Our dentists" title="Who you'll see" intro="Every dentist is registered with the Malaysian Dental Council. Ask for whoever you'd like when you book." />
      <Section>
        <Dentists />
      </Section>
    </>
  )
}

export function NewPatientsPage() {
  const { c } = useDental()
  const kid = c.focus === "pediatric"
  return (
    <>
      <PageHero eyebrow={kid ? "First visit" : "New patients"} title={kid ? "Your child's first visit" : "What to expect at your first visit"} intro="What to bring, what happens on the day, and how we look after nervous patients." />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <H as="h2" className="text-[22px]">
              What to bring
            </H>
            <ul className="flex flex-col gap-2 text-[15px]">
              {["Your IC or passport", "Any insurance or company panel card", "A list of medicines you take — we'll ask about your health in private, not online", ...(kid ? ["Their favourite toy, if it helps"] : [])].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-(--s-primary)" /> {x}</li>
              ))}
            </ul>
          </Card>
          <Card className="flex flex-col gap-3">
            <H as="h2" className="text-[22px]">
              {kid ? "Making it fun" : "Nervous about the dentist?"}
            </H>
            <p className="text-[15px] leading-relaxed text-(--s-muted)">
              {kid ? "We keep it short and playful: a ride in the chair, counting teeth and a sticker at the end." : "You're not alone. Tell us when you book and we'll allow extra time, explain each step and agree a signal for you to pause."}
            </p>
          </Card>
        </div>
      </Section>
    </>
  )
}

export function PricesPage() {
  const { c } = useDental()
  return (
    <>
      <PageHero eyebrow="Prices" title={c.insurance === "list" ? "Prices and insurance" : "Clear prices"} intro={c.prices === "ask" ? "Every treatment is different, so we give you a written estimate after your examination." : PRICE_NOTE} />
      <Section>
        <div className="overflow-hidden rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card)">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-(--s-tint) text-[13px] tracking-[0.06em] text-(--s-muted) uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Treatment</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Visits</th>
                <th className="px-5 py-3 text-right font-semibold">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--s-line)">
              {siteTreatments(c).map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-4 font-medium">{t.title}</td>
                  <td className="hidden px-5 py-4 text-(--s-muted) sm:table-cell">{t.visits}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums">{priceText(t, c.prices)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.insurance === "list" && (
          <Card className="mt-6 flex flex-col gap-2">
            <H as="h2" className="text-[22px]">
              Insurers and company panels
            </H>
            <p className="text-[15px] text-(--s-muted)">[The insurers and panels the clinic accepts — added by the clinic.]</p>
          </Card>
        )}
      </Section>
    </>
  )
}

export function ContactPage() {
  const { c, phone, whatsapp, hours, address } = useDental()
  const [sent, setSent] = useState(false)
  return (
    <>
      <PageHero eyebrow="Contact" title="Contact and directions" intro={`${c.name}${c.place ? `, ${c.place}` : ""}. Call, WhatsApp or send us a message.`} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col gap-3 text-[16px]">
              <li className="flex items-start gap-3"><MapPin className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {address}</li>
              <li className="flex items-start gap-3"><Clock className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {hours}</li>
              <li className="flex items-start gap-3"><Phone className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {phone}</li>
              <li className="flex items-start gap-3"><MessageCircle className="mt-1 size-5 shrink-0 text-(--s-primary)" /> {whatsapp}</li>
            </ul>
            <EmergencyNotice />
            <MapBox />
          </div>
          <Card>
            {sent ? (
              <Done title="Message sent">We&apos;ll reply by WhatsApp or email within one working day.</Done>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), setSent(true))}>
                <H as="h2" className="text-[22px]">
                  Send us a message
                </H>
                <FieldLabel label="Your name">
                  <input required className={inputClass} autoComplete="name" />
                </FieldLabel>
                <FieldLabel label="WhatsApp number">
                  <input required className={inputClass} inputMode="tel" autoComplete="tel" />
                </FieldLabel>
                <FieldLabel label="How can we help?">
                  <textarea rows={4} className={cn(inputClass, "h-auto py-3")} placeholder="Please don't include medical details — we'll ask in person." />
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
  const { c } = useDental()
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions patients ask us" intro="Cost, pain, children, insurance and cancellations." />
      <Section>
        <div className="max-w-3xl">
          <Faq items={faqItems(c.prices)} />
        </div>
      </Section>
    </>
  )
}

export function BookPage() {
  const { c } = useDental()
  const [step, setStep] = useState(0)
  const [what, setWhat] = useState(siteTreatments(c)[0].id)
  const [slot, setSlot] = useState<string | null>(null)
  const steps = ["Treatment", "Time", "Your details"]
  return (
    <>
      <PageHero eyebrow="Book online" title="Book an appointment" intro="Takes about a minute. We confirm straight away and remind you the day before." />
      <Section>
        <Card className="mx-auto flex max-w-2xl flex-col gap-6">
          {step < 3 && (
            <ol className="flex gap-2 text-[13px] font-semibold">
              {steps.map((s, i) => (
                <li key={s} className={cn("flex-1 border-t-4 pt-2", i <= step ? "border-(--s-primary) text-(--s-ink)" : "border-(--s-line) text-(--s-muted)")}>
                  {i + 1}. {s}
                </li>
              ))}
            </ol>
          )}
          {step === 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[16px] font-semibold">What would you like to book?</legend>
              {[...siteTreatments(c), { id: "unsure", title: "Not sure — I'd like a check-up first" } as Treatment].map((t) => (
                <label key={t.id} className={cn("flex cursor-pointer items-center gap-3 rounded-(--s-radius) border px-4 py-3", what === t.id ? "border-(--s-primary) bg-(--s-tint)" : "border-(--s-line)")}>
                  <input type="radio" name="what" checked={what === t.id} onChange={() => setWhat(t.id)} className="accent-(--s-primary)" />
                  <span className="flex-1">{t.title}</span>
                  {TREATMENTS[t.id] && <span className="text-[14px] text-(--s-muted) tabular-nums">{priceText(t, c.prices)}</span>}
                </label>
              ))}
            </fieldset>
          )}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-[16px] font-semibold">Pick a time</p>
              <div className="grid grid-cols-3 gap-2">
                {["Tue 9:30 am", "Tue 2:30 pm", "Wed 11:00 am", "Wed 4:00 pm", "Thu 10:00 am", "Sat 9:30 am"].map((s) => (
                  <button key={s} type="button" onClick={() => setSlot(s)} className={cn("h-12 rounded-(--s-radius) border text-[14px]", slot === s ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line)")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <form id="dental-book" className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), setStep(3))}>
              <FieldLabel label="Patient's full name">
                <input required className={inputClass} autoComplete="name" />
              </FieldLabel>
              <FieldLabel label="WhatsApp number">
                <input required className={inputClass} inputMode="tel" autoComplete="tel" />
              </FieldLabel>
              <fieldset className="flex gap-4 text-[15px]">
                <legend className="mb-2 text-[14px] font-medium">Have you visited us before?</legend>
                <label className="flex items-center gap-2"><input type="radio" name="first" defaultChecked className="accent-(--s-primary)" /> First visit</label>
                <label className="flex items-center gap-2"><input type="radio" name="first" className="accent-(--s-primary)" /> Returning</label>
              </fieldset>
              <ConsentLine />
            </form>
          )}
          {step === 3 && <Done title="You're booked">{slot} — we&apos;ve sent the details to your WhatsApp and will remind you the day before.</Done>}
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
              <SButton type="submit" form="dental-book">
                Confirm booking
              </SButton>
            )}
          </div>
        </Card>
      </Section>
    </>
  )
}

export function ConsultationPage() {
  const { c } = useDental()
  const [sent, setSent] = useState(false)
  return (
    <>
      <PageHero eyebrow="Consultation" title="Request a consultation" intro="Tell us what you'd like done. We'll invite you for an examination and give you a written estimate before anything starts." />
      <Section>
        <Card className="mx-auto max-w-2xl">
          {sent ? (
            <Done title="Request received">We&apos;ll WhatsApp you within one working day to arrange your consultation.</Done>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), setSent(true))}>
              <FieldLabel label="What are you interested in?">
                <select className={inputClass}>
                  {siteTreatments(c).map((t) => (
                    <option key={t.id}>{t.title}</option>
                  ))}
                  <option>Not sure yet</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Your name">
                <input required className={inputClass} autoComplete="name" />
              </FieldLabel>
              <FieldLabel label="WhatsApp number">
                <input required className={inputClass} inputMode="tel" autoComplete="tel" />
              </FieldLabel>
              <FieldLabel label="Best time to reach you">
                <select className={inputClass}>
                  <option>Weekday mornings</option>
                  <option>Weekday afternoons</option>
                  <option>Saturdays</option>
                </select>
              </FieldLabel>
              <p className="text-[13px] text-(--s-muted)">Please don&apos;t upload photos of your teeth here — we&apos;ll take what we need at your visit.</p>
              <ConsentLine />
              <SButton type="submit" className="self-start">
                Request consultation
              </SButton>
            </form>
          )}
        </Card>
      </Section>
    </>
  )
}

export function EmergencyPage() {
  const { c, phone, has } = useDental()
  return (
    <>
      <section className="bg-(--s-ink) py-14 text-white sm:py-20">
        <div className={cn(container, "flex flex-col gap-5")}>
          <Eyebrow className="!text-(--s-accent)">Emergency dental care</Eyebrow>
          <H as="h1" className="max-w-3xl text-[36px] leading-[1.1] !text-white sm:text-[52px]">
            In pain? Call us now
          </H>
          <p className="max-w-2xl text-[18px] text-white/75">{c.emergency === "daily" ? "Same-day slots every day." : c.emergency === "hours" ? "Same-day slots during opening hours." : "Call first — we'll tell you what to do and when we can see you."}</p>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${phone}`} className="inline-flex h-13 items-center gap-2 rounded-(--s-btn-radius) bg-white px-6 font-semibold text-(--s-ink)">
              <Phone className="size-5" /> Call {phone}
            </a>
            {has("appointments") && (
              <DLink slug="book" tone="secondary" size="lg" className="border-white/30 bg-transparent text-white">
                Book a same-day slot
              </DLink>
            )}
          </div>
        </div>
      </section>
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <EmergencyNotice />
          <Card className="flex flex-col gap-3">
            <H as="h2" className="text-[22px]">
              We can help today with
            </H>
            <ul className="flex flex-col gap-2 text-[15px]">
              {["Toothache that won't settle", "A broken or chipped tooth", "A lost filling or crown", "A knocked-out adult tooth — keep it in milk and come straight in"].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-(--s-primary)" /> {x}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>
    </>
  )
}

export function BranchesPage() {
  const { c } = useDental()
  return (
    <>
      <PageHero eyebrow="Branches" title="Find the branch nearest you" intro="The same care and prices at every branch." />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {[c.place ?? "[Branch one]", "[Branch two]"].map((b) => (
            <Card key={b} className="flex flex-col gap-2">
              <Building2 className="size-6 text-(--s-primary)" />
              <H as="h2" className="text-[22px]">
                {b}
              </H>
              <p className="text-[15px] text-(--s-muted)">[Address, hours and the dentists at this branch]</p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}

export function BeforeAfterPage() {
  return (
    <>
      <PageHero eyebrow="Results" title="Before and after" intro="Real patients, shown with their written consent. Results vary from person to person." />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {["Whitening", "Veneers", "Clear aligners"].map((t) => (
            <Card key={t} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {["Before", "After"].map((l) => (
                  <span key={l} className="grid aspect-square place-items-center rounded-(--s-radius) bg-(--s-tint) text-[13px] text-(--s-muted)">
                    {l}
                  </span>
                ))}
              </div>
              <p className="font-semibold">{t}</p>
              <p className="text-[13px] text-(--s-muted)">Shown with consent. Results vary.</p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}

export function KidsPage() {
  return (
    <>
      <PageHero eyebrow="Kids" title="Dentistry for children" intro="Gentle check-ups from their first tooth, with a parent in the room." />
      <Section>
        <Card className="flex items-start gap-4">
          <Baby className="size-8 shrink-0 text-(--s-primary)" />
          <p className="text-[16px] leading-relaxed text-(--s-muted)">We recommend a first visit by your child&apos;s first birthday. A parent or guardian stays with them and gives consent for any treatment.</p>
        </Card>
      </Section>
    </>
  )
}

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { c } = useDental()
  const sections =
    kind === "privacy"
      ? [
          ["What we collect", "Your name, contact details and the reason for your visit when you book or message us. We never ask for medical history online."],
          ["How we use it", "Only to arrange and remind you about your visits, and to reply to you."],
          ["Your rights", `You can ask to see, correct or delete your details at any time, in line with the ${DENTIST.market.dataLaw}.`],
        ]
      : [
          ["Bookings", "Please arrive 10 minutes early for your first visit."],
          ["Cancellations", "Let us know at least 24 hours before so we can offer the slot to someone else."],
          ["Prices", PRICE_NOTE],
        ]
  return (
    <>
      <PageHero eyebrow="Legal" title={kind === "privacy" ? "Privacy Policy" : "Terms and Conditions"} intro={`${c.name} · last updated November 2026`} />
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

export function GenericDentalPage({ title }: { title: string }) {
  return (
    <>
      <PageHero eyebrow="Page" title={title} intro="This page is ready for your content." />
      <Section>
        <MainCta size="md" />
      </Section>
    </>
  )
}
