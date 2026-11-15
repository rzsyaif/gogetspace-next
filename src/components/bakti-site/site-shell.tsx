"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { Dialog } from "radix-ui"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Heart,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Shield,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { BUSINESS, EMERGENCY_NOTICE, LOCATIONS, PACKAGES, TESTS } from "@/lib/bakti/content"
import { siteFontVars } from "./site-fonts"
import { FieldLabel, H, SButton, container, inputClass, themeVars } from "./ui"
import { EditBridge } from "./edit-bridge"

interface SiteCtx {
  base: string
  href: (slug: string) => string
  book: (preselect?: string) => void
}
const Ctx = createContext<SiteCtx | null>(null)
export function useSite() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useSite outside SiteShell")
  return c
}

const NAV = [
  { title: "Treatments", slug: "treatments" },
  { title: "Our Dentists", slug: "our-dentists" },
  { title: "New Patients", slug: "new-patients" },
  { title: "Prices & Insurance", slug: "prices" },
  { title: "Locations & Contact", slug: "locations" },
]

/**
 * Frame of the generated dental practice website: theme variables, header, footer, booking dialog,
 * mobile quick-contact bar (phone & WhatsApp per playbook section 5), and standing emergency notice.
 */
export function SiteShell({ theme, slug, children }: { theme: SiteTheme; slug: string; children: ReactNode }) {
  const base = `/preview/${theme.id}`
  const href = (s: string) => (s ? `${base}/${s}` : base)
  const [menu, setMenu] = useState(false)
  const [booking, setBooking] = useState<{ open: boolean; preselect?: string }>({ open: false })

  useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ type: "bakti:page", slug }, window.location.origin)
  }, [slug])

  return (
    <Ctx.Provider value={{ base, href, book: (preselect) => setBooking({ open: true, preselect }) }}>
      <div
        data-theme="light"
        className={cn(siteFontVars, "flex min-h-svh w-full flex-col bg-(--s-paper) text-[16px] text-(--s-ink) antialiased")}
        style={{ ...themeVars(theme), fontFamily: "var(--s-body)" }}
      >
        {/* top emergency alert notice */}
        <aside aria-label="Urgent care notice" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[13px] text-amber-950 sm:text-center">
          <div className={cn(container, "flex items-center justify-between gap-3 sm:justify-center")}>
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="size-4 shrink-0 text-amber-700" />
              <span>Dental emergency or severe toothache? Same-day slots available daily.</span>
            </span>
            <a href={`tel:${BUSINESS.emergencyPhone}`} className="font-semibold text-amber-900 underline hover:no-underline">
              Call {BUSINESS.emergencyPhone}
            </a>
          </div>
        </aside>

        <header className="sticky top-0 z-40 border-b border-(--s-line) bg-(--s-paper)/90 backdrop-blur-md">
          <div className={cn(container, "flex h-18 items-center gap-6")}>
            <Link href={href("")} className="flex items-center gap-2.5" onClick={() => setMenu(false)}>
              <Mark />
              <span className="flex flex-col leading-none">
                <span className="text-[19px] text-(--s-ink)" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
                  {BUSINESS.name}
                </span>
                <span className="mt-1 text-[11px] tracking-[0.12em] text-(--s-muted) uppercase">Dental Clinic</span>
              </span>
            </Link>
            <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
              {NAV.map((n) => (
                <Link
                  key={n.slug}
                  href={href(n.slug)}
                  aria-current={slug === n.slug ? "page" : undefined}
                  className="rounded-(--s-btn-radius) px-3 py-2 text-[15px] font-medium text-(--s-muted) hover:text-(--s-ink) aria-[current=page]:text-(--s-primary)"
                >
                  {n.title}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2 lg:ml-2">
              <SButton className="hidden sm:inline-flex" onClick={() => setBooking({ open: true })}>
                Book an appointment
              </SButton>
              <button
                type="button"
                aria-label={menu ? "Close menu" : "Open menu"}
                aria-expanded={menu}
                onClick={() => setMenu((m) => !m)}
                className="grid size-11 place-items-center rounded-(--s-btn-radius) border border-(--s-line) lg:hidden"
              >
                {menu ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
          {menu && (
            <nav aria-label="Mobile" className={cn(container, "flex flex-col gap-1 pb-5 lg:hidden")}>
              {[{ title: "Home", slug: "" }, ...NAV, { title: "FAQ", slug: "faq" }].map((n) => (
                <Link key={n.slug} href={href(n.slug)} onClick={() => setMenu(false)} className="flex items-center justify-between rounded-(--s-radius) px-3 py-3 text-[16px] font-medium hover:bg-(--s-tint)">
                  {n.title}
                  <ChevronRight className="size-4 text-(--s-muted)" />
                </Link>
              ))}
              <SButton size="lg" className="mt-2 w-full" onClick={() => { setMenu(false); setBooking({ open: true }) }}>
                Book an appointment
              </SButton>
            </nav>
          )}
        </header>

        <EditBridge />
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>

        {/* standing emergency notice footer banner */}
        <section className="border-t border-amber-200 bg-amber-50/60 py-6 text-[14px] text-amber-950">
          <div className={cn(container, "flex items-start gap-3")}>
            <Shield className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div className="flex flex-col gap-1">
              <strong className="font-semibold text-amber-900">Emergency & Urgent Care Guidance:</strong>
              <p className="leading-relaxed opacity-90">{EMERGENCY_NOTICE}</p>
            </div>
          </div>
        </section>

        <footer className="bg-(--s-ink) text-white/80">
          <div className={cn(container, "grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]")}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Mark light />
                <span className="text-[19px] text-white" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
                  {BUSINESS.name}
                </span>
              </div>
              <p className="max-w-xs text-[14px] leading-relaxed text-white/60">
                {BUSINESS.accreditation} · {BUSINESS.registrationNo}. Caring, gentle dental care for your whole family since {BUSINESS.established}.
              </p>
              <div className="flex flex-col gap-2 text-[14px]">
                <a href={`tel:${BUSINESS.phone}`} className="flex items-center gap-2 hover:text-white"><Phone className="size-4" /> {BUSINESS.phone}</a>
                <a href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`} className="flex items-center gap-2 hover:text-white"><MessageCircle className="size-4" /> WhatsApp: {BUSINESS.whatsapp}</a>
                <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2 hover:text-white"><Mail className="size-4" /> {BUSINESS.email}</a>
              </div>
            </div>
            <FooterCol title="Treatments" links={[["Check-up & Cleaning", "treatments"], ["Teeth Whitening", "treatments"], ["Braces & Aligners", "treatments"], ["Dental Implants", "treatments"], ["Children's Dentistry", "new-patients"]]} />
            <FooterCol title="Practice" links={[["Our Dentists", "our-dentists"], ["New Patients Guide", "new-patients"], ["Prices & Insurance", "prices"], ["Contact & Locations", "locations"], ["FAQ", "faq"]]} />
            <FooterCol title="Legal & Safety" links={[["Terms of Service", "terms"], ["Privacy Policy", "privacy"], ["Patient Rights", "terms"]]} />
          </div>
          <div className="border-t border-white/10">
            <div className={cn(container, "flex flex-col gap-2 py-6 text-[13px] text-white/50 sm:flex-row sm:justify-between")}>
              <span>© 2026 {BUSINESS.legalName} · MDC Reg. {BUSINESS.registrationNo}</span>
              <span>All dental procedures performed by registered practitioners · Results vary</span>
            </div>
          </div>
        </footer>

        {/* Mobile quick-contact bar (phone & WhatsApp visible on mobile as required by section 5) */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-(--s-line) bg-(--s-paper)/95 backdrop-blur-md sm:hidden">
          <a
            href={`tel:${BUSINESS.phone}`}
            className="flex flex-1 items-center justify-center gap-2 border-r border-(--s-line) text-[14px] font-semibold text-(--s-ink)"
          >
            <Phone className="size-4 text-(--s-primary)" /> Call clinic
          </a>
          <a
            href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 text-[14px] font-semibold text-[#128C7E]"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setBooking({ open: true })}
            className="flex flex-1 items-center justify-center bg-(--s-primary) text-[14px] font-semibold text-(--s-on-primary)"
          >
            Book
          </button>
        </div>

        {/* Desktop WhatsApp pill */}
        <a
          href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with our dental reception on WhatsApp"
          className="fixed right-5 bottom-5 z-40 hidden h-14 items-center gap-2 rounded-full bg-[#25D366] px-5 font-semibold text-white shadow-lg hover:brightness-95 sm:flex"
        >
          <MessageCircle className="size-5" />
          <span>Chat on WhatsApp</span>
        </a>

        {booking.open && <BookingDialog open preselect={booking.preselect} onOpenChange={(open) => setBooking((b) => ({ ...b, open }))} />}
      </div>
    </Ctx.Provider>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  const { href } = useSite()
  return (
    <div className="flex flex-col gap-3 text-[14px]">
      <p className="text-[12px] font-semibold tracking-[0.1em] text-white/50 uppercase">{title}</p>
      {links.map(([label, slug]) => (
        <Link key={slug} href={href(slug)} className="hover:text-white">
          {label}
        </Link>
      ))}
    </div>
  )
}

/** Dental Tooth Icon in the theme colours */
export function Mark({ light }: { light?: boolean }) {
  return (
    <span aria-hidden className={cn("grid size-10 place-items-center rounded-(--s-radius)", light ? "bg-white/10" : "bg-(--s-primary)")}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke={light ? "white" : "var(--s-on-primary)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C9 2 7 3.5 6 6c-1.5 4-2.5 8-1 12 1 2.5 3 3 4.5 1 1.2-1.6 1.8-2 2.5-2s1.3.4 2.5 2c1.5 2 3.5 1.5 4.5-1 1.5-4 .5-8-1-12-1-2.5-3-4-6-4Z" />
        <path d="M9 7c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
      </svg>
    </span>
  )
}

/* ---------------- booking dialog (Dentist Playbook §8.2 & §8.3) ---------------- */

function nextDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  }).filter((d) => d.getDay() !== 0)
}
const SLOTS = ["9:00 am", "9:45 am", "10:30 am", "11:15 am", "2:00 pm", "2:45 pm", "3:30 pm", "4:15 pm", "5:00 pm"]

function BookingDialog({ open, preselect, onOpenChange }: { open: boolean; preselect?: string; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0)
  const [what, setWhat] = useState(preselect ?? "checkup-clean")
  const [where, setWhere] = useState(LOCATIONS[0].id)
  const [day, setDay] = useState(0)
  const [slot, setSlot] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [patientType, setPatientType] = useState<"me" | "child" | "other">("me")
  const [guardianName, setGuardianName] = useState("")
  const [insurance, setInsurance] = useState("")
  const [DAYS] = useState<Date[]>(nextDays)

  const options = [
    { id: "checkup-clean", label: "Check-up & Teeth Cleaning (Scaling)", price: 120, note: "Routine care · 30–45 min" },
    { id: "new-patient-exam", label: "New Patient Comprehensive Exam & X-rays", price: 160, note: "Initial visit · 45–60 min" },
    { id: "emergency-toothache", label: "Toothache or Emergency Relief", price: 100, note: "Same-day priority slot · 30 min" },
    { id: "child-visit", label: "Child's First Dental Visit", price: 80, note: "Gentle & fun · 30 min" },
    { id: "clear-aligners", label: "Consultation (Braces / Aligners / Implants)", price: 150, note: "Assessment & scan · 45 min" },
    { id: "unsure", label: "Not sure / Discuss with dentist", price: 0, note: "We'll examine first" },
  ]
  const chosen = options.find((o) => o.id === what) ?? { id: what, label: "Dental appointment", price: 0, note: "" }
  const loc = LOCATIONS.find((l) => l.id === where)!

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[bp-fade-in_150ms]" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92svh] flex-col overflow-hidden rounded-t-(--s-radius-lg) bg-(--s-paper) text-(--s-ink) shadow-2xl outline-none sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:w-[540px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-(--s-radius-lg) data-[state=open]:animate-[bp-dialog-in_200ms]"
          style={{ fontFamily: "var(--s-body)" }}
        >
          <div className="flex items-center gap-3 border-b border-(--s-line) px-6 py-4">
            {step > 0 && step < 3 && (
              <button type="button" aria-label="Back" onClick={() => setStep((s) => s - 1)} className="-ml-2 grid size-9 place-items-center rounded-full hover:bg-(--s-tint)">
                <ArrowLeft className="size-5" />
              </button>
            )}
            <Dialog.Title asChild>
              <H as="h2" className="text-[20px]">
                {step === 3 ? "Appointment confirmed" : "Book an appointment"}
              </H>
            </Dialog.Title>
            {step < 3 && <span className="text-[13px] text-(--s-muted)">Step {step + 1} of 3</span>}
            <Dialog.Close aria-label="Close" className="ml-auto grid size-9 place-items-center rounded-full hover:bg-(--s-tint)">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Choose a reason for your visit, select a clinic branch and time, and enter your contact details.</Dialog.Description>

          <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
            {step === 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-[15px] font-semibold">Reason for visit</legend>
                {options.map((o) => (
                  <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-(--s-radius) border px-4 py-3", what === o.id ? "border-(--s-primary) bg-(--s-tint)" : "border-(--s-line) bg-(--s-card)")}>
                    <input type="radio" name="what" value={o.id} checked={what === o.id} onChange={() => setWhat(o.id)} className="mt-1 accent-(--s-primary)" />
                    <span className="flex flex-1 flex-col">
                      <span className="text-[15px] font-medium">{o.label}</span>
                      <span className="text-[12px] text-(--s-muted)">{o.note}</span>
                    </span>
                    {o.price > 0 && <span className="text-[13px] font-semibold tabular-nums text-(--s-muted)">from RM {o.price}</span>}
                  </label>
                ))}
              </fieldset>
            )}

            {step === 1 && (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[15px] font-semibold">Select clinic branch</legend>
                  {LOCATIONS.map((l) => (
                    <label key={l.id} className={cn("flex cursor-pointer items-start gap-3 rounded-(--s-radius) border px-4 py-3", where === l.id ? "border-(--s-primary) bg-(--s-tint)" : "border-(--s-line) bg-(--s-card)")}>
                      <input type="radio" name="where" checked={where === l.id} onChange={() => setWhere(l.id)} className="mt-1 accent-(--s-primary)" />
                      <span className="flex flex-col">
                        <span className="text-[15px] font-semibold">{l.name}</span>
                        <span className="text-[13px] text-(--s-muted)">{l.address[0]}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="flex flex-col gap-2">
                  <p className="text-[15px] font-semibold">Select date</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {DAYS.map((d, i) => (
                      <button key={i} type="button" onClick={() => setDay(i)} className={cn("flex min-w-16 flex-col items-center rounded-(--s-radius) border px-3 py-2", day === i ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-card)")}>
                        <span className="text-[12px] uppercase opacity-80">{d.toLocaleDateString("en-MY", { weekday: "short" })}</span>
                        <span className="text-[18px] font-semibold">{d.getDate()}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[15px] font-semibold">Select time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOTS.map((s, i) => {
                      const full = (i + day) % 5 === 4
                      return (
                        <button key={s} type="button" disabled={full} onClick={() => setSlot(s)} className={cn("h-11 rounded-(--s-radius) border text-[14px] disabled:cursor-not-allowed disabled:line-through disabled:opacity-40", slot === s ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-card)")}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <form id="booking-details" className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setStep(3) }}>
                {/* Playbook 8.3 fields */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-[14px] font-semibold">Who is this visit for?</legend>
                  <div className="flex gap-3">
                    {[
                      { id: "me", label: "Myself" },
                      { id: "child", label: "My child" },
                      { id: "other", label: "Someone else" },
                    ].map((p) => (
                      <label key={p.id} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-(--s-radius) border py-2 text-[14px]", patientType === p.id ? "border-(--s-primary) bg-(--s-tint) font-medium text-(--s-primary)" : "border-(--s-line)")}>
                        <input type="radio" name="ptype" value={p.id} checked={patientType === p.id} onChange={() => setPatientType(p.id as "me" | "child" | "other")} className="sr-only" />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <FieldLabel label="Patient full name">
                  <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Nurul Huda binti Ahmad" autoComplete="name" />
                </FieldLabel>

                {patientType === "child" && (
                  <FieldLabel label="Parent or Guardian name">
                    <input required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={inputClass} placeholder="Parent / Legal Guardian name" />
                  </FieldLabel>
                )}

                <FieldLabel label="WhatsApp mobile number (for confirmation & reminders)">
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} inputMode="tel" placeholder="012-345 6789" autoComplete="tel" />
                </FieldLabel>

                <FieldLabel label="Email address (optional)">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@example.com" autoComplete="email" />
                </FieldLabel>

                <FieldLabel label="Insurance / Corporate Panel (optional)">
                  <input value={insurance} onChange={(e) => setInsurance(e.target.value)} className={inputClass} placeholder="e.g. AIA, Prudential, PMCare" />
                </FieldLabel>

                {/* Guardrail 8.3 & 9: Privacy warning */}
                <div className="rounded-(--s-radius) bg-(--s-tint)/60 p-3 text-[13px] leading-relaxed text-(--s-muted)">
                  <span className="font-semibold text-(--s-ink)">Privacy notice: </span>
                  Please do not include confidential medical conditions or medications here. A private health history questionnaire will be completed securely at the clinic.
                </div>

                <label className="flex items-start gap-3 text-[13px] text-(--s-muted)">
                  <input type="checkbox" required className="mt-1 accent-(--s-primary)" />
                  I confirm the details above and consent to receiving appointment reminders via WhatsApp. Free cancellation up to 24 hours prior.
                </label>
              </form>
            )}

            {step === 3 && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
                  <Check className="size-8" />
                </span>
                <p className="text-[17px] font-medium">
                  {name ? `Thank you, ${name.split(" ")[0]}! ` : "Thank you! "}Your appointment is reserved.
                </p>
                <p className="text-[14px] text-(--s-muted)">
                  We have sent confirmation and arrival guidance to <strong>{phone || "your WhatsApp"}</strong>.
                </p>
                <div className="flex w-full flex-col gap-2.5 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-4 text-left text-[14px]">
                  <span className="flex items-center gap-2 font-medium">
                    <Calendar className="size-4 text-(--s-primary)" /> {DAYS[day]?.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}, {slot}
                  </span>
                  <span className="flex items-center gap-2 text-(--s-muted)">
                    <MapPin className="size-4 text-(--s-primary)" /> {loc.name} — {loc.address[0]}
                  </span>
                  <span className="flex items-center gap-2 text-(--s-muted)">
                    <Sparkles className="size-4 text-(--s-primary)" /> {chosen.label}
                  </span>
                  {chosen.price > 0 && (
                    <span className="mt-1 text-[13px] text-(--s-muted)">
                      Estimated fee: <strong>from RM {chosen.price}</strong> (confirmed after consultation)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-(--s-line) px-6 py-4">
            {step === 0 && <SButton className="ml-auto" onClick={() => setStep(1)}>Continue</SButton>}
            {step === 1 && <SButton className="ml-auto" disabled={!slot} onClick={() => setStep(2)}>Continue</SButton>}
            {step === 2 && <SButton className="ml-auto" type="submit" form="booking-details">Confirm appointment</SButton>}
            {step === 3 && <SButton className="w-full" onClick={() => onOpenChange(false)}>Close</SButton>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
