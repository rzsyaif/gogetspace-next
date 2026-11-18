import type { ReactNode } from "react"
import { BadgeCheck, CalendarCheck, Clock, Lock, Phone, PhoneCall, ReceiptText, ShieldCheck, Star } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { jurisdictionOf } from "@/lib/playbooks/lawyer"
import { LAW_DEMO } from "@/lib/playbooks/lawyer-plan"
import { siteAreas, type LawConfig } from "@/lib/playbooks/law-site-config"

/** §6.5 sample headlines, by the highest-intent scenario */
export function lawHeroCopy(c: LawConfig) {
  const urgent = c.goals[0] === "LG3" || c.areas.includes("criminal")
  const areas = siteAreas(c)
  const where = c.place ? ` · ${c.place}` : ""
  if (urgent)
    return {
      eyebrow: `Criminal defence${where}`,
      title: "Facing urgent charges? Call us now",
      intro: "A lawyer picks up and tells you what to do next. Clear advice on your options, in plain words — and what it will cost before we start.",
    }
  if (c.areas.includes("family"))
    return {
      eyebrow: `Family law${where}`,
      title: "A confidential first conversation about your family matter",
      intro: "Divorce, custody and support, handled calmly. You choose how we contact you, and nothing you tell us is shared.",
    }
  if (c.clients === "businesses" || c.goals[0] === "LG5")
    return {
      eyebrow: `Business law${where}`,
      title: "Legal support for growing businesses",
      intro: "Contracts, company formation and disputes — with a clear scope and a fee proposal before any work starts.",
    }
  if (c.areas.includes("estates") && areas.length === 1)
    return {
      eyebrow: `Wills and estates${where}`,
      title: "Plan ahead with a will that says what you mean",
      intro: "Wills, inheritance and probate, explained gently and done for a fixed fee where we can.",
    }
  return {
    eyebrow: `${areas.length > 1 ? "Law practice" : areas[0]?.title ?? "Law practice"}${where}`,
    title: "Clear legal help, explained in plain words",
    intro: `${areas.map((a) => a.title.replace(" law", "")).slice(0, 3).join(", ")} — a first meeting that tells you where you stand, what it will cost and what happens next.`,
  }
}

export function lawTrustItems(c: LawConfig) {
  const j = jurisdictionOf(c.jurisdiction)
  return [
    ...(c.demo && c.reviews && c.modules.includes("legal-reviews") ? [{ Icon: Star, label: LAW_DEMO.rating }] : []),
    { Icon: BadgeCheck, label: c.jurisdiction !== "unsure" ? `Admitted in ${j.label}` : "[Where you're admitted]" },
    { Icon: Clock, label: c.demo ? `Practicing since ${LAW_DEMO.since}` : "Practicing since [year]" },
    { Icon: ReceiptText, label: c.fees === "ask" ? "Fees agreed before we start" : "Fees explained up front" },
    { Icon: Lock, label: "Confidential from the first call" },
  ].slice(0, 4)
}

/**
 * The homepage hero for a law practice, shared by the generated site and the style step's preview. The visual is
 * the consultation request card (or the call card) rather than stock photos of gavels and handshakes (§7).
 */
export function LawHero({ c, theme, cta, secondary, compact }: { c: LawConfig; theme: SiteTheme; cta: ReactNode; secondary: ReactNode; compact?: boolean }) {
  const copy = lawHeroCopy(c)
  const centered = theme.hero === "centered"
  return (
    <div className={cn("grid items-center gap-10 py-12 @3xl:py-20", centered ? "justify-items-center text-center" : "@3xl:grid-cols-[1.1fr_1fr] @3xl:gap-14")}>
      <div className={cn("flex flex-col gap-5", centered && "max-w-3xl items-center")}>
        <p className="text-[12px] font-semibold tracking-[0.08em] text-(--s-primary) uppercase">{copy.eyebrow}</p>
        <h1 className="text-[36px] leading-[1.08] tracking-tight text-balance @3xl:text-[54px]" style={{ fontFamily: "var(--s-heading)", fontWeight: theme.headingWeight }}>
          {copy.title}
        </h1>
        <p className="max-w-xl text-[16px] leading-relaxed text-(--s-muted) @3xl:text-[18px]">{copy.intro}</p>
        <div className={cn("flex flex-wrap gap-3", centered && "justify-center")}>
          {cta}
          {secondary}
        </div>
      </div>
      {!compact && <HeroCard c={c} wide={centered} />}
    </div>
  )
}

function HeroCard({ c, wide }: { c: LawConfig; wide?: boolean }) {
  const booking = c.modules.includes("consultations")
  const urgent = c.goals[0] === "LG3" || c.modules.includes("urgent-line")
  const meeting = c.meeting === "free" ? "Free first meeting · 30 min" : c.meeting === "evaluation" ? "Free case evaluation · 15 min" : c.meeting === "fixed" ? "Fixed-fee package" : "Initial consultation · 45 min"
  return (
    <div className={cn("relative w-full", wide ? "max-w-2xl" : "max-w-[520px] justify-self-end")}>
      <div className="absolute -top-8 -right-6 size-48 rounded-full bg-(--s-soft) opacity-60 blur-2xl" aria-hidden />
      <div className="relative flex flex-col gap-5 rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-6 text-left shadow-xl">
        {urgent ? (
          <>
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <PhoneCall className="size-5 text-(--s-primary)" /> Urgent help
            </span>
            <p className="text-[26px] leading-tight" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
              {c.demo ? "03-2283 4410" : "[Your phone number]"}
            </p>
            <p className="text-[14px] text-(--s-muted)">{c.urgent === "always" ? "A lawyer answers 24 hours a day." : c.urgent === "hours" ? "A lawyer answers during opening hours, with a call-back after hours." : "Call first — we tell you what to do now."}</p>
          </>
        ) : booking ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[15px] font-semibold">
                <CalendarCheck className="size-5 text-(--s-primary)" /> Request a consultation
              </span>
            </div>
            <div className="flex flex-col gap-2 text-[14px]">
              {[meeting, "Phone, video or in person"].map((x, i) => (
                <span key={x} className={cn("rounded-(--s-radius) border px-3 py-2.5", i === 0 ? "border-(--s-primary) font-semibold text-(--s-primary)" : "border-(--s-line)")}>
                  {x}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[14px]">
              {["Tue 10:00", "Wed 2:30", "Thu 11:00"].map((t, i) => (
                <span key={t} className={cn("rounded-(--s-radius) border py-2 text-center", i === 1 ? "border-(--s-primary) bg-(--s-primary) font-semibold text-(--s-on-primary)" : "border-(--s-line)")}>
                  {t}
                </span>
              ))}
            </div>
            <p className="flex items-center gap-2 rounded-(--s-radius) bg-(--s-tint) px-3 py-2 text-[13px]">
              <ShieldCheck className="size-4 shrink-0 text-(--s-primary)" /> We confirm after a quick conflict check
            </p>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <Phone className="size-5 text-(--s-primary)" /> Talk to a lawyer
            </span>
            <p className="text-[24px] leading-tight" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
              {c.demo ? "03-2283 4410" : "[Your phone number]"}
            </p>
            <p className="text-[14px] text-(--s-muted)">Call or WhatsApp — we reply within one working day. Tell us how you&apos;d like us to contact you.</p>
          </>
        )}
        <p className="flex items-start gap-2 border-t border-(--s-line) pt-4 text-[12px] text-(--s-muted)">
          <Lock className="mt-0.5 size-3.5 shrink-0" /> Please don&apos;t send confidential details until we&apos;ve confirmed we can act for you.
        </p>
      </div>
    </div>
  )
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
