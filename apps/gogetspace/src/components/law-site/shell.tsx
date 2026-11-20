"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronRight, Clock, Mail, MapPin, Menu, MessageCircle, Phone, PhoneCall, X } from "lucide-react"
import { cn } from "@gogetspace/baseplate/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { jurisdictionOf } from "@/lib/playbooks/lawyer"
import { LAW_DEMO } from "@/lib/playbooks/lawyer-plan"
import { decodeLawConfig, encodeLawConfig, type LawConfig } from "@/lib/playbooks/law-site-config"
import type { Market } from "@/lib/playbooks/types"
import { siteFontVars } from "@/components/bakti-site/site-fonts"
import { container, themeVars } from "@/components/bakti-site/ui"
import { EditBridge } from "@/components/bakti-site/edit-bridge"

interface LawCtx {
  c: LawConfig
  theme: SiteTheme
  href: (slug: string) => string
  has: (module: string) => boolean
  /** the main button: label and where it goes */
  cta: { label: string; slug: string }
  phone: string
  whatsapp: string
  hours: string
  address: string
  email: string
  /** the rules the site follows */
  rules: Market & { label: string; reviews: boolean }
}
const Ctx = createContext<LawCtx | null>(null)
export function useLaw() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useLaw outside LawShell")
  return c
}

/** the main button for the plan, with the same fallbacks as the plan card */
export function lawCta(c: LawConfig): LawCtx["cta"] {
  const has = (m: string) => c.modules.includes(m)
  const main = c.goals[0]
  if (main === "LG3" || has("urgent-line")) return { label: "Call now", slug: has("urgent-line") ? "urgent" : "contact" }
  if (main === "LG2" && has("case-enquiries")) return { label: "Tell us about your matter", slug: "enquiry" }
  if (main === "LG5" && has("fee-proposals")) return { label: "Request a fee proposal", slug: "fee-proposal" }
  if (has("consultations")) return { label: main === "LG8" ? "Book with a lawyer" : c.areas.includes("family") ? "Book a confidential consultation" : "Book a consultation", slug: "book" }
  if (has("case-enquiries")) return { label: "Tell us about your matter", slug: "enquiry" }
  if (has("fee-proposals")) return { label: "Request a fee proposal", slug: "fee-proposal" }
  return { label: "Call or message us", slug: "contact" }
}

export const NOT_ADVICE = "This page is general information, not legal advice."
export const RELATIONSHIP = "Please don't send confidential details here. Contacting us doesn't create a lawyer-client relationship until we confirm in writing."

export function LawShell({ theme, slug, children }: { theme: SiteTheme; slug: string; children: ReactNode }) {
  const params = useSearchParams()
  const c = decodeLawConfig(params)
  const query = encodeLawConfig(c)
  const base = `/preview/law/${theme.id}`
  const href = (s: string) => `${s ? `${base}/${s}` : base}?${query}`
  const has = (m: string) => c.modules.includes(m)
  const [menu, setMenu] = useState(false)
  const phone = c.demo ? "03-2283 4410" : "[Your phone number]"
  const value: LawCtx = {
    c,
    theme,
    href,
    has,
    cta: lawCta(c),
    phone,
    whatsapp: c.demo ? "+60 12-660 4410" : "[Your WhatsApp]",
    hours: c.demo ? LAW_DEMO.hours : "Call for opening hours",
    address: c.demo ? "Level 8, Menara Bangsar, 59100 Kuala Lumpur" : c.place ? `[Street address], ${c.place}` : "[Your address]",
    email: c.demo ? "hello@azizlim.my" : "[Your email]",
    rules: jurisdictionOf(c.jurisdiction),
  }
  const nav = [
    { title: "Practice areas", slug: "practice-areas" },
    { title: "How we work", slug: "how-we-work" },
    { title: "Our lawyers", slug: "our-lawyers" },
    { title: "Fees", slug: "fees" },
    ...(has("articles") ? [{ title: "Articles", slug: "articles" }] : []),
    { title: "Contact", slug: "contact" },
  ]

  useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ type: "bakti:page", slug }, window.location.origin)
  }, [slug])

  const ctaButton = (cls?: string, onClick?: () => void) => (
    <Link href={href(value.cta.slug)} onClick={onClick} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-(--s-btn-radius) bg-(--s-primary) px-5 text-[15px] font-semibold whitespace-nowrap text-(--s-on-primary) hover:bg-(--s-primary-hover)", cls)}>
      {value.cta.label}
    </Link>
  )

  return (
    <Ctx.Provider value={value}>
      <div data-theme="light" className={cn(siteFontVars, "flex min-h-svh w-full flex-col bg-(--s-paper) text-[16px] text-(--s-ink) antialiased")} style={{ ...themeVars(theme), fontFamily: "var(--s-body)" }}>
        {has("urgent-line") && (
          <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 bg-(--s-ink) px-4 py-2 text-center text-[14px] font-medium text-white">
            <PhoneCall className="size-4 shrink-0 text-(--s-accent)" /> Urgent matter? Call {phone}
            {c.urgent === "always" ? " — 24 hours a day" : ""}
          </a>
        )}
        <header className="sticky top-0 z-40 border-b border-(--s-line) bg-(--s-paper)/90 backdrop-blur-md">
          <div className={cn(container, "flex h-18 items-center gap-6")}>
            <Link href={href("")} className="flex min-w-0 items-center gap-2.5" onClick={() => setMenu(false)}>
              <FirmMark name={c.name} />
              <span className="flex min-w-0 flex-col leading-none">
                <span className="truncate text-[19px] text-(--s-ink)" style={{ fontFamily: "var(--s-heading)", fontWeight: theme.headingWeight }}>
                  {c.name}
                </span>
                <span className="mt-1 truncate text-[11px] tracking-[0.12em] text-(--s-muted) uppercase">{c.place ?? "Law practice"}</span>
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
                <FirmMark name={c.name} light />
                <span className="text-[19px] text-white" style={{ fontFamily: "var(--s-heading)", fontWeight: theme.headingWeight }}>
                  {c.name}
                </span>
              </div>
              <div className="flex flex-col gap-2 text-[14px]">
                <span className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> {value.address}</span>
                <span className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" /> {value.hours}</span>
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white"><Phone className="size-4" /> {phone}</a>
                <span className="flex items-center gap-2"><Mail className="size-4" /> {value.email}</span>
              </div>
            </div>
            <FooterCol title="Practice" links={[["Practice areas", "practice-areas"], ["How we work", "how-we-work"], ["Fees", "fees"], ...(has("urgent-line") ? ([["Urgent help", "urgent"]] as [string, string][]) : [])]} />
            <FooterCol title="Firm" links={[["Our lawyers", "our-lawyers"], ["Contact", "contact"], ["FAQ", "faq"]]} />
            <FooterCol title="Legal" links={[["Privacy Policy", "privacy"], ["Terms and Disclaimer", "terms"]]} />
          </div>
          <div className="border-t border-white/10">
            <div className={cn(container, "flex flex-col gap-2 py-6 text-[13px] text-white/50 sm:flex-row sm:justify-between")}>
              <span>
                © 2026 {c.name}.{c.jurisdiction !== "unsure" ? ` Regulated by ${value.rules.regulator}.` : ""} This website is general information, not legal advice.
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
  const { href } = useLaw()
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

/** the firm's initials in a square — no gavels or scales (§7) */
export function FirmMark({ name, light, size = "md" }: { name: string; light?: boolean; size?: "sm" | "md" }) {
  const letters = name
    .replace(/&|\b(and|advocates|solicitors|law|legal|firm|office|partners|associates|llp|chambers|group)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-(--s-radius) text-[15px] tracking-wide", size === "sm" ? "size-9" : "size-10", light ? "bg-white/10 text-white" : "bg-(--s-primary) text-(--s-on-primary)")}
      style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}
    >
      {letters || "LF"}
    </span>
  )
}

/** a primary-styled link button inside the law site */
export function LLink({ slug, children, tone = "primary", size = "md", className }: { slug: string; children: ReactNode; tone?: "primary" | "secondary" | "light"; size?: "md" | "lg"; className?: string }) {
  const { href } = useLaw()
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
