import type { ReactNode } from "react"
import { BadgeCheck, CalendarCheck, Clock, Phone, ReceiptText, Siren, Star } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { RAHMA } from "@/lib/playbooks/dentist-plan"
import type { DentalConfig } from "@/lib/playbooks/site-config"

const HEADLINE: Record<string, string> = {
  general: "Gentle, unhurried dental care for the whole family",
  ortho: "Straighter teeth, with a clear plan and price up front",
  cosmetic: "A smile you're happy to show, planned with you step by step",
  pediatric: "Happy first visits and healthy little teeth",
}
const KIND: Record<string, string> = { general: "Family dentist", ortho: "Orthodontics", cosmetic: "Cosmetic dentistry", pediatric: "Children's dentist" }

export function heroCopy(c: DentalConfig) {
  const urgent = c.goals[0] === "G3"
  return {
    eyebrow: `${KIND[c.focus] ?? KIND.general}${c.place ? ` · ${c.place}` : ""}`,
    title: urgent ? "Toothache? We'll see you today" : (HEADLINE[c.focus] ?? HEADLINE.general),
    intro: urgent
      ? "Call or message us now and we'll find you a same-day slot. Clear advice on the phone, and a price before any treatment."
      : c.focus === "pediatric"
        ? "Calm, playful check-ups so your child feels at home — and simple advice for you on looking after their teeth."
        : `${c.scale === "solo" ? "One dentist who knows you" : c.scale === "branches" ? "Several branches, one standard of care" : "A small team of dentists who take their time"}, clear prices before any treatment, and reminders so you never miss a check-up.`,
  }
}

export function trustItems(c: DentalConfig) {
  return [
    ...(c.demo && c.modules.includes("reviews") ? [{ Icon: Star, label: RAHMA.rating }] : []),
    { Icon: BadgeCheck, label: "Dentists registered with the MDC" },
    { Icon: ReceiptText, label: c.prices === "ask" ? "A written estimate before treatment" : "Prices shown before treatment" },
    { Icon: Clock, label: c.demo ? "Open Saturdays until 1 pm" : "Evening and weekend slots" },
  ].slice(0, 4)
}

/**
 * The homepage hero for a dental practice, shared by the generated site and the style step's preview. The visual
 * is the booking card (or the call card without Appointments) rather than a stock photo.
 */
export function DentalHero({ c, theme, cta, secondary, compact }: { c: DentalConfig; theme: SiteTheme; cta: ReactNode; secondary: ReactNode; compact?: boolean }) {
  const copy = heroCopy(c)
  const centered = theme.hero === "centered"
  return (
    <div className={cn("grid items-center gap-10 py-12 @3xl:py-20", centered ? "justify-items-center text-center" : "@3xl:grid-cols-[1.1fr_1fr] @3xl:gap-14")}>
      <div className={cn("flex flex-col gap-5", centered && "max-w-3xl items-center")}>
        <p className="text-[12px] font-semibold tracking-[0.08em] text-(--s-primary) uppercase">{copy.eyebrow}</p>
        <h1 className="text-[36px] leading-[1.06] tracking-tight text-balance @3xl:text-[56px]" style={{ fontFamily: "var(--s-heading)", fontWeight: theme.headingWeight }}>
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

function HeroCard({ c, wide }: { c: DentalConfig; wide?: boolean }) {
  const booking = c.modules.includes("appointments")
  const urgent = c.goals[0] === "G3" || c.modules.includes("emergency")
  return (
    <div className={cn("relative w-full", wide ? "max-w-2xl" : "max-w-[520px] justify-self-end")}>
      <div className="absolute -top-8 -right-6 size-48 rounded-full bg-(--s-soft) opacity-60 blur-2xl" aria-hidden />
      <div className="absolute -bottom-10 -left-8 size-40 rounded-full bg-(--s-accent) opacity-15 blur-2xl" aria-hidden />
      <div className="relative flex flex-col gap-5 rounded-(--s-radius-lg) border border-(--s-line) bg-(--s-card) p-6 text-left shadow-xl">
        {booking ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[15px] font-semibold">
                <CalendarCheck className="size-5 text-(--s-primary)" /> Next available
              </span>
              {urgent && <span className="rounded-full bg-(--s-tint) px-2.5 py-1 text-[12px] font-semibold text-(--s-primary)">Same-day slots</span>}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
                <span key={d} className={cn("flex flex-col items-center rounded-(--s-radius) border px-2 py-2", i === 1 ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-paper)")}>
                  <span className="text-[11px] uppercase opacity-75">{d}</span>
                  <span className="text-[17px] font-semibold">{17 + i}</span>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[14px]">
              {["9:30 am", "11:00 am", "2:30 pm", "3:15 pm", "4:00 pm", "5:30 pm"].map((t, i) => (
                <span key={t} className={cn("rounded-(--s-radius) border py-2 text-center", i === 2 ? "border-(--s-primary) font-semibold text-(--s-primary)" : "border-(--s-line)", i === 4 && "line-through opacity-40")}>
                  {t}
                </span>
              ))}
            </div>
            <p className="flex items-center gap-2 rounded-(--s-radius) bg-(--s-tint) px-3 py-2 text-[13px]">
              <CalendarCheck className="size-4 shrink-0 text-(--s-primary)" /> Confirmed instantly · reminder the day before
            </p>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              {urgent ? <Siren className="size-5 text-(--s-primary)" /> : <Phone className="size-5 text-(--s-primary)" />} {urgent ? "In pain right now?" : "Talk to us"}
            </span>
            <p className="text-[24px] leading-tight" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
              {c.demo ? "04-828 1186" : "[Your phone number]"}
            </p>
            <p className="text-[14px] text-(--s-muted)">Call or WhatsApp — we reply within the hour while the clinic is open.</p>
          </>
        )}
        {c.demo && (
          <div className="flex items-center gap-3 border-t border-(--s-line) pt-4">
            <span className="flex -space-x-2">
              {RAHMA.dentists.map((d) => (
                <span key={d} className="grid size-9 place-items-center rounded-full border-2 border-(--s-card) bg-(--s-soft) text-[12px] font-semibold text-(--s-ink)">
                  {initials(d)}
                </span>
              ))}
            </span>
            <span className="text-[13px] text-(--s-muted)">{RAHMA.dentists.join(" & ")}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
