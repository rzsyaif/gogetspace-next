"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { Dialog } from "radix-ui"
import { ArrowLeft, Calendar, Check, ChevronRight, Clock, Mail, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { BUSINESS, LOCATIONS, PACKAGES, TESTS } from "@/lib/bakti/content"
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
  { title: "Tests & Packages", slug: "tests-and-packages" },
  { title: "For Doctors", slug: "for-doctors" },
  { title: "Corporate", slug: "corporate-screening" },
  { title: "Locations", slug: "locations" },
  { title: "About", slug: "about" },
]

/**
 * Frame of the generated Bakti Analisa site: theme variables, header, footer, booking dialog and the
 * WhatsApp button. When it runs inside the builder's preview iframe it reports the current page upward.
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
        <header className="sticky top-0 z-40 border-b border-(--s-line) bg-(--s-paper)/90 backdrop-blur-md">
          <div className={cn(container, "flex h-18 items-center gap-6")}>
            <Link href={href("")} className="flex items-center gap-2.5" onClick={() => setMenu(false)}>
              <Mark />
              <span className="flex flex-col leading-none">
                <span className="text-[19px] text-(--s-ink)" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
                  Bakti Analisa
                </span>
                <span className="mt-1 text-[11px] tracking-[0.12em] text-(--s-muted) uppercase">Clinical Laboratory</span>
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
                Book a test
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
              {[{ title: "Home", slug: "" }, { title: "All services", slug: "services" }, ...NAV, { title: "FAQ", slug: "faq" }].map((n) => (
                <Link key={n.slug} href={href(n.slug)} onClick={() => setMenu(false)} className="flex items-center justify-between rounded-(--s-radius) px-3 py-3 text-[16px] font-medium hover:bg-(--s-tint)">
                  {n.title}
                  <ChevronRight className="size-4 text-(--s-muted)" />
                </Link>
              ))}
              <SButton size="lg" className="mt-2 w-full" onClick={() => { setMenu(false); setBooking({ open: true }) }}>
                Book a test
              </SButton>
            </nav>
          )}
        </header>

        <EditBridge />
        <main className="flex-1">{children}</main>

        <footer className="bg-(--s-ink) text-white/80">
          <div className={cn(container, "grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]")}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Mark light />
                <span className="text-[19px] text-white" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
                  Bakti Analisa
                </span>
              </div>
              <p className="max-w-xs text-[14px] leading-relaxed text-white/60">
                {BUSINESS.accreditation} accredited clinical laboratory serving Penang since {BUSINESS.established}.
              </p>
              <div className="flex flex-col gap-2 text-[14px]">
                <a href={`tel:${BUSINESS.phone}`} className="flex items-center gap-2 hover:text-white"><Phone className="size-4" /> {BUSINESS.phone}</a>
                <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2 hover:text-white"><Mail className="size-4" /> {BUSINESS.email}</a>
              </div>
            </div>
            <FooterCol title="Services" links={[["Tests & Packages", "tests-and-packages"], ["For Doctors & Clinics", "for-doctors"], ["Corporate Screening", "corporate-screening"], ["Prepare for Your Test", "prepare-for-your-test"]]} />
            <FooterCol title="Lab" links={[["About Us", "about"], ["Locations & Contact", "locations"], ["FAQ", "faq"]]} />
            <FooterCol title="Legal" links={[["Terms and Conditions", "terms"], ["Privacy Policy", "privacy"]]} />
          </div>
          <div className="border-t border-white/10">
            <div className={cn(container, "flex flex-col gap-2 py-6 text-[13px] text-white/50 sm:flex-row sm:justify-between")}>
              <span>© 2026 {BUSINESS.legalName}</span>
              <span>Built with GoGetSpace</span>
            </div>
          </div>
        </footer>

        <a
          href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="fixed right-5 bottom-5 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-5 font-semibold text-white shadow-lg hover:brightness-95"
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline">WhatsApp us</span>
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

/** Simple droplet-in-circle mark in the theme colours */
export function Mark({ light }: { light?: boolean }) {
  return (
    <span aria-hidden className={cn("grid size-10 place-items-center rounded-(--s-radius)", light ? "bg-white/10" : "bg-(--s-primary)")}>
      <svg viewBox="0 0 24 24" className="size-6" fill="none">
        <path d="M12 3.5c3 3.6 5.5 6.9 5.5 10a5.5 5.5 0 1 1-11 0c0-3.1 2.5-6.4 5.5-10Z" fill={light ? "white" : "var(--s-on-primary)"} />
        <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" stroke="var(--s-accent)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/* ---------------- booking ---------------- */

/** next 7 days except Sundays (computed on open, so prerendering never reads the clock) */
function nextDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  }).filter((d) => d.getDay() !== 0)
}
const SLOTS = ["7:30 am", "8:00 am", "8:30 am", "9:00 am", "9:30 am", "10:30 am", "11:30 am", "2:00 pm", "3:30 pm"]

/** Mounted only while open (fresh state each time, and the clock is never read while prerendering). */
function BookingDialog({ open, preselect, onOpenChange }: { open: boolean; preselect?: string; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0)
  const [what, setWhat] = useState(preselect ?? "comprehensive")
  const [where, setWhere] = useState(LOCATIONS[0].id)
  const [day, setDay] = useState(0)
  const [slot, setSlot] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [DAYS] = useState<Date[]>(nextDays)

  const options = [
    ...PACKAGES.map((p) => ({ id: p.id, label: `${p.name} health screening`, price: p.price })),
    ...TESTS.filter((t) => t.popular).map((t) => ({ id: t.id, label: t.name, price: t.price })),
    { id: "unsure", label: "Not sure yet — I'll ask at the counter", price: 0 },
  ]
  const chosen = options.find((o) => o.id === what) ?? TESTS.map((t) => ({ id: t.id, label: t.name, price: t.price })).find((o) => o.id === what)
  const loc = LOCATIONS.find((l) => l.id === where)!
  const fasting = TESTS.find((t) => t.id === what)?.fasting ?? (PACKAGES.some((p) => p.id === what) ? "10–12 hours" : undefined)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[bp-fade-in_150ms]" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92svh] flex-col overflow-hidden rounded-t-(--s-radius-lg) bg-(--s-paper) text-(--s-ink) shadow-2xl outline-none sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-(--s-radius-lg) data-[state=open]:animate-[bp-dialog-in_200ms]"
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
                {step === 3 ? "You're booked" : "Book a test"}
              </H>
            </Dialog.Title>
            {step < 3 && <span className="text-[13px] text-(--s-muted)">Step {step + 1} of 3</span>}
            <Dialog.Close aria-label="Close" className="ml-auto grid size-9 place-items-center rounded-full hover:bg-(--s-tint)">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Choose a test, a centre and a time, then add your details.</Dialog.Description>

          <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
            {step === 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-[15px] font-semibold">What would you like to do?</legend>
                {options.map((o) => (
                  <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-(--s-radius) border px-4 py-3", what === o.id ? "border-(--s-primary) bg-(--s-tint)" : "border-(--s-line) bg-(--s-card)")}>
                    <input type="radio" name="what" value={o.id} checked={what === o.id} onChange={() => setWhat(o.id)} className="accent-(--s-primary)" />
                    <span className="flex-1 text-[15px]">{o.label}</span>
                    {o.price > 0 && <span className="text-[14px] font-semibold tabular-nums">RM {o.price}</span>}
                  </label>
                ))}
              </fieldset>
            )}
            {step === 1 && (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-[15px] font-semibold">Centre</legend>
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
                  <p className="text-[15px] font-semibold">Day</p>
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
                  <p className="text-[15px] font-semibold">Time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOTS.filter((_, i) => DAYS[day]?.getDay() !== 6 || i < 6).map((s, i) => {
                      const full = (i + day) % 4 === 3
                      return (
                        <button key={s} type="button" disabled={full} onClick={() => setSlot(s)} className={cn("h-11 rounded-(--s-radius) border text-[14px] disabled:cursor-not-allowed disabled:line-through disabled:opacity-40", slot === s ? "border-(--s-primary) bg-(--s-primary) text-(--s-on-primary)" : "border-(--s-line) bg-(--s-card)")}>
                          {s}
                        </button>
                      )
                    })}
                  </div>
                  {fasting && <p className="flex items-center gap-2 rounded-(--s-radius) bg-(--s-tint) px-3 py-2 text-[13px]"><Clock className="size-4 shrink-0" /> Fasting needed: {fasting}. A morning slot is easiest.</p>}
                </div>
              </>
            )}
            {step === 2 && (
              <form id="booking-details" className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setStep(3) }}>
                <FieldLabel label="Full name">
                  <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
                </FieldLabel>
                <FieldLabel label="Mobile number (for your results link)">
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} inputMode="tel" placeholder="012-345 6789" autoComplete="tel" />
                </FieldLabel>
                <label className="flex items-start gap-3 text-[14px] text-(--s-muted)">
                  <input type="checkbox" required className="mt-1 accent-(--s-primary)" />
                  I agree to the privacy policy and to receive my booking details on WhatsApp.
                </label>
              </form>
            )}
            {step === 3 && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
                  <Check className="size-8" />
                </span>
                <p className="text-[16px]">
                  {name ? `Thanks, ${name.split(" ")[0]}! ` : ""}We&apos;ve sent your booking to WhatsApp.
                </p>
                <div className="flex w-full flex-col gap-2 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-4 text-left text-[14px]">
                  <span className="flex items-center gap-2"><Calendar className="size-4 text-(--s-primary)" /> {DAYS[day]?.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}, {slot}</span>
                  <span className="flex items-center gap-2"><MapPin className="size-4 text-(--s-primary)" /> {loc.name} — {loc.address[0]}</span>
                  <span className="flex items-center gap-2"><Check className="size-4 text-(--s-primary)" /> {chosen?.label}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-(--s-line) px-6 py-4">
            {step < 3 && chosen && chosen.price > 0 && (
              <span className="text-[14px] text-(--s-muted)">
                Total <strong className="text-[17px] text-(--s-ink)">RM {chosen.price}</strong>
              </span>
            )}
            {step === 0 && <SButton className="ml-auto" onClick={() => setStep(1)}>Continue</SButton>}
            {step === 1 && <SButton className="ml-auto" disabled={!slot} onClick={() => setStep(2)}>Continue</SButton>}
            {step === 2 && <SButton className="ml-auto" type="submit" form="booking-details">Confirm booking</SButton>}
            {step === 3 && <SButton className="w-full" onClick={() => onOpenChange(false)}>Done</SButton>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
