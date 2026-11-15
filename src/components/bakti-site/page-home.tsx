"use client"

import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
} from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { AUDIENCES, BUSINESS, EMERGENCY_NOTICE, FAQS, LOCATIONS, PACKAGES, STEPS, TESTIMONIALS, TESTS } from "@/lib/bakti/content"
import { CLINIC_PHOTO } from "@/components/site/assets"
import { useSite } from "./site-shell"
import { Card, Eyebrow, H, Price, SButton, SLink, Section, container } from "./ui"

const TRUST = [
  { Icon: Award, label: `${BUSINESS.accreditation}` },
  { Icon: Smile, label: "Gentle approach for anxious patients" },
  { Icon: MapPin, label: "2 branches in George Town & Bayan Lepas" },
  { Icon: ShieldCheck, label: `Serving families since ${BUSINESS.established}` },
]

export function HomePage({ theme }: { theme: SiteTheme }) {
  const { book, href } = useSite()
  const popular = TESTS.filter((t) => t.popular)

  const heroCopy = (
    <div className={cn("flex flex-col gap-6", theme.hero === "centered" && "items-center text-center")}>
      <Eyebrow className={theme.hero === "banner" ? "text-(--s-soft)" : undefined}>
        General, Family & Orthodontics · Penang
      </Eyebrow>
      <H as="h1" className={cn("text-[38px] leading-[1.08] tracking-tight sm:text-[56px]", theme.hero === "banner" && "text-white")}>
        Clear, caring dental care for your whole family
      </H>
      <p className={cn("max-w-xl text-[18px] leading-relaxed sm:text-[19px]", theme.hero === "banner" ? "text-white/80" : "text-(--s-muted)")}>
        Routine check-ups, teeth cleaning, braces and emergency care in George Town and Bayan Lepas. We explain everything
        before we start, with honest from-prices and no surprises.
      </p>
      <div className="flex flex-wrap gap-3">
        <SButton size="lg" tone={theme.hero === "banner" ? "light" : "primary"} onClick={() => book()}>
          <CalendarCheck /> Book an appointment
        </SButton>
        <SLink size="lg" tone="secondary" href={href("treatments")} className={theme.hero === "banner" ? "border-white/30 bg-transparent text-white hover:border-white" : ""}>
          See treatments & prices
        </SLink>
      </div>
    </div>
  )

  return (
    <>
      {/* hero */}
      {theme.hero === "banner" ? (
        <section className="relative overflow-hidden bg-(--s-ink)">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
            <Image src={CLINIC_PHOTO} alt="Comfortable modern dental surgery room" fill sizes="50vw" className="object-cover opacity-90" priority />
            <div className="absolute inset-0 bg-linear-to-r from-(--s-ink) via-(--s-ink)/40 to-transparent" />
          </div>
          <div className={cn(container, "relative py-20 sm:py-28 lg:w-full")}>
            <div className="max-w-xl">{heroCopy}</div>
          </div>
        </section>
      ) : theme.hero === "centered" ? (
        <section className="relative overflow-hidden bg-(--s-tint) pt-16 sm:pt-24">
          <div className={cn(container, "flex flex-col items-center gap-12")}>
            <div className="max-w-3xl">{heroCopy}</div>
            <div className="relative aspect-[16/7] w-full max-w-5xl overflow-hidden rounded-t-(--s-radius-lg)">
              <Image src={CLINIC_PHOTO} alt="Warm welcoming dental clinic reception and care team" fill sizes="(max-width: 1180px) 100vw, 1024px" className="object-cover object-[50%_30%]" priority />
            </div>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden">
          <div className={cn(container, "grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr]")}>
            {heroCopy}
            <div className="relative">
              <div className="absolute -top-6 -right-6 size-40 rounded-full bg-(--s-soft) opacity-50 blur-2xl" aria-hidden />
              <div className="relative aspect-[4/5] overflow-hidden rounded-(--s-radius-lg) bg-(--s-tint)">
                <Image src={CLINIC_PHOTO} alt="Patient consulting comfortably with the dentist" fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" priority />
              </div>
              <div className="absolute bottom-6 -left-4 flex items-center gap-3 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-4 shadow-lg sm:-left-10">
                <span className="grid size-11 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
                  <Heart className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold">Anxious about visiting?</span>
                  <span className="text-[13px] text-(--s-muted)">Tell us — we pause whenever you need</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* trust strip (Playbook §6.1) */}
      <div className="border-y border-(--s-line) bg-(--s-card)">
        <ul className={cn(container, "grid grid-cols-2 gap-4 py-6 lg:grid-cols-4")}>
          {TRUST.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-[14px] font-medium sm:text-[15px]">
              <Icon className="size-5 shrink-0 text-(--s-primary)" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Who we help */}
      <Section>
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>Personalised care</Eyebrow>
          <H className="text-[30px] sm:text-[40px]">Dentistry tailored to each stage of your smile</H>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((a, i) => {
            const Icon = [Smile, Heart, Sparkles][i]
            return (
              <Card key={a.id} className="flex flex-col gap-4 p-7">
                <span className="grid size-12 place-items-center rounded-(--s-radius) bg-(--s-tint) text-(--s-primary)">
                  <Icon className="size-6" />
                </span>
                <H as="h3" className="text-[22px]">{a.title}</H>
                <p className="flex-1 text-[15px] leading-relaxed text-(--s-muted)">{a.text}</p>
                <Link href={href(a.href)} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-(--s-primary) hover:gap-2.5">
                  {a.cta} <ArrowRight className="size-4 transition-all" />
                </Link>
              </Card>
            )
          })}
        </div>
      </Section>

      {/* Popular treatments with honest prices */}
      <Section tone="tint">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Popular treatments</Eyebrow>
            <H className="text-[30px] sm:text-[40px]">Transparent prices, honest guidance</H>
            <p className="text-[14px] text-(--s-muted)">Final fees confirmed after clinical examination · No hidden charges</p>
          </div>
          <SLink tone="secondary" href={href("treatments")}>All treatments & prices <ArrowRight /></SLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <H as="h3" className="text-[18px] leading-snug">{t.name}</H>
                <div className="text-right">
                  <span className="text-[12px] text-(--s-muted)">from </span>
                  <Price value={t.price} className="text-[20px] font-bold text-(--s-primary)" />
                </div>
              </div>
              <p className="flex-1 text-[14px] leading-relaxed text-(--s-muted)">{t.description}</p>
              {t.comfortNote && (
                <div className="rounded-(--s-radius) bg-(--s-tint)/50 p-2 text-[12px] text-(--s-muted)">
                  💡 {t.comfortNote}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-(--s-line) pt-3 text-[13px]">
                <span className="text-(--s-muted)">{t.duration} · {t.turnaround}</span>
                <button type="button" onClick={() => book(t.id)} className="font-semibold text-(--s-primary) hover:underline">
                  Book visit
                </button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Packages / Routine care */}
      <Section>
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>Preventive dental plans</Eyebrow>
          <H className="text-[30px] sm:text-[40px]">Care bundles to keep you smiling</H>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p) => (
            <div key={p.id} className={cn("flex flex-col gap-3 rounded-(--s-radius-lg) border p-5", p.featured ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-card)")}>
              <span className={cn("text-[13px] font-semibold uppercase tracking-wider", p.featured ? "opacity-80" : "text-(--s-muted)")}>Includes {p.tests} items</span>
              <H as="h3" className={cn("text-[20px]", p.featured && "text-(--s-on-primary)")}>{p.name}</H>
              <p className={cn("flex-1 text-[14px]", p.featured ? "opacity-85" : "text-(--s-muted)")}>{p.for}</p>
              <div>
                <span className="text-[12px] opacity-75">from </span>
                <Price value={p.price} className="text-[24px] font-bold" />
              </div>
              <SButton tone={p.featured ? "light" : "secondary"} onClick={() => book(p.id)} className="w-full">
                Book appointment
              </SButton>
            </div>
          ))}
        </div>
      </Section>

      {/* How a first visit works (Playbook §6.1) */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <Eyebrow className="text-(--s-soft)">Your first visit</Eyebrow>
            <H className="text-[30px] text-white sm:text-[40px]">What happens when you visit us</H>
            <p className="text-[17px] leading-relaxed text-white/70">
              We know visiting the dentist can feel daunting. We keep things calm, unhurried, and completely under your control from start to finish.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3 rounded-(--s-radius-lg) border border-white/10 bg-white/5 p-6">
                <span className="text-[40px] leading-none text-(--s-accent)" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
                  {i + 1}
                </span>
                <span className="text-[18px] font-semibold text-white">{s.title}</span>
                <span className="text-[15px] leading-relaxed text-white/70">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Real reviews (Playbook §9 guardrails: no fake praise, real attributable experiences) */}
      <Section>
        <div className="mb-10 flex flex-col gap-2">
          <Eyebrow>Patient experiences</Eyebrow>
          <H className="text-[30px] sm:text-[40px]">What our patients say</H>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col gap-5 rounded-(--s-radius-lg) bg-(--s-tint) p-7">
              <blockquote className="flex-1 text-[17px] leading-relaxed" style={{ fontFamily: "var(--s-heading)" }}>
                “{t.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-(--s-primary) text-[14px] font-semibold text-(--s-on-primary)">
                  {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <span className="flex flex-col text-[14px]">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-(--s-muted)">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Locations & Opening hours */}
      <Section tone="card">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Practices</Eyebrow>
            <H className="text-[30px] sm:text-[40px]">Two convenient Penang locations</H>
          </div>
          <SLink tone="secondary" href={href("locations")}>Maps, directions & hours <ArrowRight /></SLink>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {LOCATIONS.map((l) => (
            <Card key={l.id} className="flex flex-col gap-2.5 bg-(--s-paper) p-6">
              <span className="text-[13px] font-semibold text-(--s-primary)">{l.kind}</span>
              <H as="h3" className="text-[22px]">{l.name}</H>
              <p className="text-[15px] text-(--s-muted)">{l.address.join(", ")}</p>
              <div className="mt-2 text-[14px]">
                <p><strong>{l.hours[0].days}:</strong> {l.hours[0].time}</p>
                <p><strong>{l.hours[1].days}:</strong> {l.hours[1].time}</p>
              </div>
              {l.note && <p className="mt-1 text-[13px] text-(--s-muted)">🚗 {l.note}</p>}
            </Card>
          ))}
        </div>
      </Section>

      {/* FAQ teaser + booking CTA */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <H className="text-[30px] sm:text-[40px]">Common dental questions</H>
            <dl className="flex flex-col divide-y divide-(--s-line) border-y border-(--s-line)">
              {FAQS.slice(0, 3).map((f) => (
                <div key={f.q} className="flex flex-col gap-2 py-5">
                  <dt className="text-[17px] font-semibold">{f.q}</dt>
                  <dd className="text-[15px] leading-relaxed text-(--s-muted)">{f.a}</dd>
                </div>
              ))}
            </dl>
            <Link href={href("faq")} className="inline-flex items-center gap-1.5 font-semibold text-(--s-primary)">
              More answers <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="flex flex-col justify-between gap-8 rounded-(--s-radius-lg) bg-(--s-primary) p-8 text-(--s-on-primary) sm:p-10">
            <div className="flex flex-col gap-4">
              <Smile className="size-9 opacity-80" />
              <H className="text-[30px] text-(--s-on-primary) sm:text-[36px]">Ready to book your visit?</H>
              <p className="text-[17px] leading-relaxed opacity-85">
                Pick a branch and convenient slot online, or message our team on WhatsApp. We reply promptly during opening hours.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SButton tone="light" size="lg" onClick={() => book()}>
                <CalendarCheck /> Book an appointment
              </SButton>
              <a
                href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-13 items-center gap-2 rounded-(--s-btn-radius) border border-white/40 px-6 font-semibold hover:bg-white/10"
              >
                <MessageCircle className="size-[18px]" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
