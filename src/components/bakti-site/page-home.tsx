"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Award, Building2, CalendarCheck, Clock, HeartPulse, MapPin, MessageCircle, ShieldCheck, Smartphone, Stethoscope, Users } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { AUDIENCES, BUSINESS, FAQS, LOCATIONS, PACKAGES, STEPS, TESTIMONIALS, TESTS } from "@/lib/bakti/content"
import { CLINIC_PHOTO } from "@/components/site/assets"
import { useSite } from "./site-shell"
import { Card, Eyebrow, H, Price, SButton, SLink, Section, container } from "./ui"

const TRUST = [
  { Icon: Award, label: `${BUSINESS.accreditation} accredited` },
  { Icon: Clock, label: "Most results the same day" },
  { Icon: MapPin, label: "3 centres across Penang" },
  { Icon: ShieldCheck, label: `Trusted since ${BUSINESS.established}` },
]

export function HomePage({ theme }: { theme: SiteTheme }) {
  const { book, href } = useSite()
  const popular = TESTS.filter((t) => t.popular)

  const heroCopy = (
    <div className={cn("flex flex-col gap-6", theme.hero === "centered" && "items-center text-center")}>
      <Eyebrow className={theme.hero === "banner" ? "text-(--s-soft)" : undefined}>Clinical laboratory · Penang</Eyebrow>
      <H as="h1" className={cn("text-[40px] leading-[1.05] tracking-tight sm:text-[60px]", theme.hero === "banner" && "text-white")}>
        Lab results you and your doctor can act on
      </H>
      <p className={cn("max-w-xl text-[18px] leading-relaxed sm:text-[19px]", theme.hero === "banner" ? "text-white/80" : "text-(--s-muted)")}>
        Blood tests and health screening in George Town, Bayan Lepas and Butterworth. Book in a minute, walk out in ten, and get
        your results on your phone.
      </p>
      <div className="flex flex-wrap gap-3">
        <SButton size="lg" tone={theme.hero === "banner" ? "light" : "primary"} onClick={() => book()}>
          <CalendarCheck /> Book a test
        </SButton>
        <SLink size="lg" tone="secondary" href={href("tests-and-packages")} className={theme.hero === "banner" ? "border-white/30 bg-transparent text-white hover:border-white" : ""}>
          See tests & prices
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
            <Image src={CLINIC_PHOTO} alt="" fill sizes="50vw" className="object-cover opacity-90" priority />
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
              <Image src={CLINIC_PHOTO} alt="A patient smiling as she reads her lab results" fill sizes="(max-width: 1180px) 100vw, 1024px" className="object-cover object-[50%_30%]" priority />
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
                <Image src={CLINIC_PHOTO} alt="A patient smiling as she reads her lab results" fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" priority />
              </div>
              <div className="absolute bottom-6 -left-4 flex items-center gap-3 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-4 shadow-lg sm:-left-10">
                <span className="grid size-11 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
                  <Smartphone className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold">Results ready</span>
                  <span className="text-[13px] text-(--s-muted)">Sent to your phone · 4:12 pm</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* trust strip */}
      <div className="border-y border-(--s-line) bg-(--s-card)">
        <ul className={cn(container, "grid grid-cols-2 gap-4 py-6 lg:grid-cols-4")}>
          {TRUST.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-[15px] font-medium">
              <Icon className="size-5 shrink-0 text-(--s-primary)" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* audiences */}
      <Section>
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>Who we help</Eyebrow>
          <H className="text-[30px] sm:text-[40px]">One lab for patients, doctors and companies</H>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((a, i) => {
            const Icon = [HeartPulse, Stethoscope, Building2][i]
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

      {/* popular tests */}
      <Section tone="tint">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Popular tests</Eyebrow>
            <H className="text-[30px] sm:text-[40px]">Clear prices, no surprises</H>
          </div>
          <SLink tone="secondary" href={href("tests-and-packages")}>All tests & packages <ArrowRight /></SLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <H as="h3" className="text-[18px] leading-snug">{t.name}</H>
                <Price value={t.price} className="text-[20px] font-bold text-(--s-primary)" />
              </div>
              <p className="flex-1 text-[14px] leading-relaxed text-(--s-muted)">{t.description}</p>
              <div className="flex items-center justify-between gap-2 border-t border-(--s-line) pt-3 text-[13px]">
                <span className="text-(--s-muted)">{t.fasting ? `Fast ${t.fasting}` : "No fasting"} · {t.turnaround}</span>
                <button type="button" onClick={() => book(t.id)} className="font-semibold text-(--s-primary) hover:underline">Book</button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* packages */}
      <Section>
        <div className="mb-10 flex flex-col gap-3">
          <Eyebrow>Health screening</Eyebrow>
          <H className="text-[30px] sm:text-[40px]">Packages for every stage of life</H>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {PACKAGES.map((p) => (
            <div key={p.id} className={cn("flex flex-col gap-3 rounded-(--s-radius-lg) border p-5", p.featured ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-card)")}>
              <span className={cn("text-[13px] font-semibold uppercase tracking-wider", p.featured ? "opacity-80" : "text-(--s-muted)")}>{p.tests} tests</span>
              <H as="h3" className={cn("text-[22px]", p.featured && "text-(--s-on-primary)")}>{p.name}</H>
              <p className={cn("flex-1 text-[14px]", p.featured ? "opacity-85" : "text-(--s-muted)")}>{p.for}</p>
              <Price value={p.price} className="text-[26px] font-bold" />
              <SButton tone={p.featured ? "light" : "secondary"} onClick={() => book(p.id)} className="w-full">Book</SButton>
            </div>
          ))}
        </div>
      </Section>

      {/* how it works */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-4">
            <Eyebrow className="text-(--s-soft)">How it works</Eyebrow>
            <H className="text-[30px] text-white sm:text-[40px]">From booking to results in three steps</H>
            <p className="text-[17px] leading-relaxed text-white/70">No referral needed for most tests. Bring your IC and, if you have one, your doctor&apos;s letter.</p>
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

      {/* testimonials */}
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col gap-5 rounded-(--s-radius-lg) bg-(--s-tint) p-7">
              <blockquote className="flex-1 text-[18px] leading-relaxed" style={{ fontFamily: "var(--s-heading)" }}>
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

      {/* locations */}
      <Section tone="card">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Eyebrow>Locations</Eyebrow>
            <H className="text-[30px] sm:text-[40px]">Three centres across Penang</H>
          </div>
          <SLink tone="secondary" href={href("locations")}>Maps & opening hours <ArrowRight /></SLink>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {LOCATIONS.map((l) => (
            <Card key={l.id} className="flex flex-col gap-2 bg-(--s-paper)">
              <span className="text-[13px] font-semibold text-(--s-primary)">{l.kind}</span>
              <H as="h3" className="text-[22px]">{l.name}</H>
              <p className="text-[15px] text-(--s-muted)">{l.address.join(", ")}</p>
              <p className="mt-2 text-[14px]"><strong>{l.hours[0].days}</strong> {l.hours[0].time}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* faq teaser + cta */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <H className="text-[30px] sm:text-[40px]">Questions before your visit?</H>
            <dl className="flex flex-col divide-y divide-(--s-line) border-y border-(--s-line)">
              {FAQS.slice(0, 3).map((f) => (
                <div key={f.q} className="flex flex-col gap-2 py-5">
                  <dt className="text-[17px] font-semibold">{f.q}</dt>
                  <dd className="text-[15px] leading-relaxed text-(--s-muted)">{f.a}</dd>
                </div>
              ))}
            </dl>
            <Link href={href("faq")} className="inline-flex items-center gap-1.5 font-semibold text-(--s-primary)">More answers <ArrowRight className="size-4" /></Link>
          </div>
          <div className="flex flex-col justify-between gap-8 rounded-(--s-radius-lg) bg-(--s-primary) p-8 text-(--s-on-primary) sm:p-10">
            <div className="flex flex-col gap-4">
              <Users className="size-9 opacity-80" />
              <H className="text-[30px] text-(--s-on-primary) sm:text-[36px]">Book your test today</H>
              <p className="text-[17px] leading-relaxed opacity-85">Pick a centre and time online, or message us on WhatsApp — we usually reply within 10 minutes during opening hours.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SButton tone="light" size="lg" onClick={() => book()}><CalendarCheck /> Book a test</SButton>
              <a href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-13 items-center gap-2 rounded-(--s-btn-radius) border border-white/40 px-6 font-semibold hover:bg-white/10">
                <MessageCircle className="size-[18px]" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
