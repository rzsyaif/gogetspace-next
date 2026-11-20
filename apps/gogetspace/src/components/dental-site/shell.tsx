"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronRight, Clock, Mail, MapPin, Menu, MessageCircle, Phone, Siren, X } from "lucide-react"
import { cn } from "@gogetspace/baseplate/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { DENTIST } from "@/lib/playbooks/dentist"
import { RAHMA } from "@/lib/playbooks/dentist-plan"
import { decodeConfig, encodeConfig, type DentalConfig } from "@/lib/playbooks/site-config"
import { siteFontVars } from "@/components/bakti-site/site-fonts"
import { container, themeVars } from "@/components/bakti-site/ui"
import { EditBridge } from "@/components/bakti-site/edit-bridge"

interface DentalCtx {
  c: DentalConfig
  theme: SiteTheme
  href: (slug: string) => string
  has: (module: string) => boolean
  /** the main button: label and where it goes */
  cta: { label: string; slug: string | null }
  phone: string
  whatsapp: string
  hours: string
  address: string
}
const Ctx = createContext<DentalCtx | null>(null)
export function useDental() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useDental outside DentalShell")
  return c
}

/** the main button for the plan, with the same fallbacks as the plan card */
function ctaFor(c: DentalConfig): DentalCtx["cta"] {
  const has = (m: string) => c.modules.includes(m)
  const main = c.goals[0]
  if (main === "G3" || has("emergency")) return has("appointments") ? { label: "Call now or book same day", slug: "emergency" } : { label: "Call now", slug: "emergency" }
  if (main === "G2" && has("estimates")) return { label: "Book a consultation", slug: "consultation" }
  if (main === "G8" && has("estimates")) return { label: "Request a quote", slug: "consultation" }
  if (has("appointments")) return { label: main === "G4" ? "Book your check-up" : "Book an appointment", slug: "book" }
  if (has("estimates")) return { label: "Request a consultation", slug: "consultation" }
  return { label: "Call or message us", slug: "contact" }
}

export function DentalShell({ theme, slug, children }: { theme: SiteTheme; slug: string; children: ReactNode }) {
  const params = useSearchParams()
  const c = decodeConfig(params)
  const query = encodeConfig(c)
  const base = `/preview/dental/${theme.id}`
  const href = (s: string) => `${s ? `${base}/${s}` : base}?${query}`
  const has = (m: string) => c.modules.includes(m)
  const [menu, setMenu] = useState(false)
  const phone = c.demo ? "04-828 1186" : "[Your phone number]"
  const value: DentalCtx = {
    c,
    theme,
    href,
    has,
    cta: ctaFor(c),
    phone,
    whatsapp: c.demo ? "+60 12-480 1186" : "[Your WhatsApp]",
    hours: c.demo ? RAHMA.hours : "Call for opening hours",
    address: c.demo ? "21 Jalan Pasar, Air Itam, 11500 Penang" : c.place ? `[Street address], ${c.place}` : "[Your address]",
  }
  const nav = [
    { title: "Treatments", slug: "treatments" },
    { title: c.focus === "pediatric" ? "First visit" : "New patients", slug: "new-patients" },
    { title: "Our dentists", slug: "our-dentists" },
    { title: c.insurance === "list" ? "Prices & insurance" : "Prices", slug: "prices" },
    ...(has("branches") ? [{ title: "Branches", slug: "branches" }] : []),
    { title: "Contact", slug: "contact" },
  ]

  useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ type: "bakti:page", slug }, window.location.origin)
  }, [slug])

  const ctaButton = (cls?: string, onClick?: () => void) =>
    value.cta.slug ? (
      <Link href={href(value.cta.slug)} onClick={onClick} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-(--s-btn-radius) bg-(--s-primary) px-5 text-[15px] font-semibold whitespace-nowrap text-(--s-on-primary) hover:bg-(--s-primary-hover)", cls)}>
        {value.cta.label}
      </Link>
    ) : null

  return (
    <Ctx.Provider value={value}>
      <div data-theme="light" className={cn(siteFontVars, "flex min-h-svh w-full flex-col bg-(--s-paper) text-[16px] text-(--s-ink) antialiased")} style={{ ...themeVars(theme), fontFamily: "var(--s-body)" }}>
        {has("emergency") && (
          <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 bg-(--s-ink) px-4 py-2 text-center text-[14px] font-medium text-white">
            <Siren className="size-4 shrink-0 text-(--s-accent)" /> In pain today? Call {phone} — same-day slots{c.emergency === "daily" ? " every day" : ""}
          </a>
        )}
        <header className="sticky top-0 z-40 border-b border-(--s-line) bg-(--s-paper)/90 backdrop-blur-md">
          <div className={cn(container, "flex h-18 items-center gap-6")}>
            <Link href={href("")} className="flex min-w-0 items-center gap-2.5" onClick={() => setMenu(false)}>
              <ToothMark />
              <span className="flex min-w-0 flex-col leading-none">
                <span className="truncate text-[19px] text-(--s-ink)" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
                  {c.name}
                </span>
                <span className="mt-1 truncate text-[11px] tracking-[0.12em] text-(--s-muted) uppercase">{c.place ?? "Dental clinic"}</span>
              </span>
            </Link>
            <nav aria-label="Main" className="ml-auto hidden items-center gap-1 xl:flex">
              {nav.map((n) => (
                <Link key={n.slug} href={href(n.slug)} aria-current={slug === n.slug ? "page" : undefined} className="rounded-(--s-btn-radius) px-3 py-2 text-[15px] font-medium text-(--s-muted) hover:text-(--s-ink) aria-[current=page]:text-(--s-primary)">
                  {n.title}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2 xl:ml-2">
              {ctaButton("hidden sm:inline-flex")}
              <button type="button" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="grid size-11 place-items-center rounded-(--s-btn-radius) border border-(--s-line) xl:hidden">
                {menu ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
          {menu && (
            <nav aria-label="Mobile" className={cn(container, "flex flex-col gap-1 pb-5 xl:hidden")}>
              {[{ title: "Home", slug: "" }, ...nav, { title: "FAQ", slug: "faq" }].map((n) => (
                <Link key={n.slug} href={href(n.slug)} onClick={() => setMenu(false)} className="flex items-center justify-between rounded-(--s-radius) px-3 py-3 text-[16px] font-medium hover:bg-(--s-tint)">
                  {n.title}
                  <ChevronRight className="size-4 text-(--s-muted)" />
                </Link>
              ))}
              {ctaButton("mt-2 h-13 w-full", () => setMenu(false))}
            </nav>
          )}
        </header>

        <EditBridge />
        <main className="flex-1">{children}</main>

        <footer className="bg-(--s-ink) text-white/80">
          <div className={cn(container, "grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]")}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <ToothMark light />
                <span className="text-[19px] text-white" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>
                  {c.name}
                </span>
              </div>
              <div className="flex flex-col gap-2 text-[14px]">
                <span className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> {value.address}</span>
                <span className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" /> {value.hours}</span>
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white"><Phone className="size-4" /> {phone}</a>
                <span className="flex items-center gap-2"><Mail className="size-4" /> {c.demo ? "hello@rahmadental.my" : "[Your email]"}</span>
              </div>
            </div>
            <FooterCol title="Care" links={[["Treatments", "treatments"], ["New patients", "new-patients"], ["Prices", "prices"], ...(has("emergency") ? ([["Emergencies", "emergency"]] as [string, string][]) : [])]} />
            <FooterCol title="Clinic" links={[["Our dentists", "our-dentists"], ["Contact", "contact"], ["FAQ", "faq"]]} />
            <FooterCol title="Legal" links={[["Privacy Policy", "privacy"], ["Terms and Conditions", "terms"]]} />
          </div>
          <div className="border-t border-white/10">
            <div className={cn(container, "flex flex-col gap-2 py-6 text-[13px] text-white/50 sm:flex-row sm:justify-between")}>
              <span>
                © 2026 {c.name}. In a dental emergency with severe swelling, trouble breathing or heavy bleeding, call {DENTIST.market.emergencyNumber}.
              </span>
              <span className="shrink-0">Built with GoGetSpace</span>
            </div>
          </div>
        </footer>

        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label="Message us on WhatsApp"
          className="fixed right-5 bottom-5 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-5 font-semibold text-white shadow-lg hover:brightness-95"
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline">WhatsApp us</span>
        </a>
      </div>
    </Ctx.Provider>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  const { href } = useDental()
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

/** a simple tooth in a rounded square, in the theme colours */
export function ToothMark({ light, size = "md" }: { light?: boolean; size?: "sm" | "md" }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-(--s-radius)", size === "sm" ? "size-9" : "size-10", light ? "bg-white/10" : "bg-(--s-primary)")}>
      <svg viewBox="0 0 24 24" className={size === "sm" ? "size-5" : "size-6"} fill="none">
        <path
          d="M7.2 4.2c1.6-.6 3 .1 4.8.1s3.2-.7 4.8-.1c2.1.8 2.9 3.4 2.2 6-.5 1.8-1.1 3-1.4 5.2-.3 2.2-.7 4.4-2 4.4-1.6 0-1.4-4.6-3.6-4.6s-2 4.6-3.6 4.6c-1.3 0-1.7-2.2-2-4.4-.3-2.2-.9-3.4-1.4-5.2-.7-2.6.1-5.2 2.2-6Z"
          fill={light ? "white" : "var(--s-on-primary)"}
        />
        <path d="M9 8.2c.9.4 2 .6 3 .6" stroke="var(--s-accent)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** a primary-styled link button inside the dental site */
export function DLink({ slug, children, tone = "primary", size = "md", className }: { slug: string; children: ReactNode; tone?: "primary" | "secondary" | "light"; size?: "md" | "lg"; className?: string }) {
  const { href } = useDental()
  return (
    <Link
      href={href(slug)}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-(--s-btn-radius) font-semibold whitespace-nowrap transition-colors [&_svg]:size-[18px]",
        size === "lg" ? "h-13 px-6 text-[16px]" : "h-11 px-5 text-[15px]",
        tone === "primary" && "bg-(--s-primary) text-(--s-on-primary) hover:bg-(--s-primary-hover)",
        tone === "secondary" && "border border-(--s-line) bg-(--s-card) text-(--s-ink) hover:border-(--s-primary)",
        tone === "light" && "bg-white text-(--s-ink) hover:bg-white/90",
        className,
      )}
    >
      {children}
    </Link>
  )
}

