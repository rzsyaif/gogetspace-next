/**
 * Sample data for the signed-in account: several websites, each with its own plan, plus analytics,
 * enquiries and invoices. Everything here is made up for the prototype.
 */
import type { Plan } from "@/lib/plans"

export interface Account {
  name: string
  firstName: string
  email: string
  card: { brand: string; last4: string; expires: string }
}

export const ACCOUNT: Account = {
  name: "Frank Tan",
  firstName: "Frank",
  email: "frank@baktianalisa.my",
  card: { brand: "Visa", last4: "4242", expires: "08/28" },
}

export type SiteStatus = "live" | "draft"
export type DomainStatus = "connected" | "pending"

export interface Site {
  id: string
  name: string
  status: SiteStatus
  /** the plan belongs to the website, not the account */
  plan: Plan
  /** the free address every site gets */
  freeDomain: string
  /** a domain the owner connected, if any */
  domain: { name: string; status: DomainStatus } | null
  /** style option the site was built with (null while still being planned) */
  themeId: string | null
  /** false while the plan hasn't been confirmed and built yet */
  built: boolean
  /** what the person first asked for */
  prompt: string
  lastEdited: string
  pagesBuilt: number
  pagesPlanned: number
  /** agent credits used this month, % of the plan's allowance */
  creditsUsed: number
  /** next renewal for paid plans */
  renews?: string
}

export const SITES: Site[] = [
  {
    id: "bakti-analisa",
    name: "Bakti Analisa Clinical Laboratory Penang",
    status: "live",
    plan: "starter",
    freeDomain: "bakti-analisa.get.space",
    domain: { name: "baktianalisa.my", status: "connected" },
    themeId: "clinical-clarity",
    built: true,
    prompt: "Website for clinical laboratory in penang named BAKTI ANALISA",
    lastEdited: "2 days ago",
    pagesBuilt: 5,
    pagesPlanned: 11,
    creditsUsed: 62,
    renews: "1 Nov 2026",
  },
  {
    id: "rahma-dental",
    name: "Rahma Family Dental",
    status: "draft",
    plan: "free",
    freeDomain: "rahma-dental.get.space",
    domain: null,
    themeId: null,
    built: false,
    prompt: "Website for a family dental clinic in Penang",
    lastEdited: "5 days ago",
    pagesBuilt: 0,
    pagesPlanned: 6,
    creditsUsed: 8,
  },
  {
    id: "lim-partners",
    name: "Lim & Partners Advocates",
    status: "draft",
    plan: "free",
    freeDomain: "lim-partners.get.space",
    domain: null,
    themeId: null,
    built: false,
    prompt: "Website for a small law firm in Kuala Lumpur",
    lastEdited: "3 weeks ago",
    pagesBuilt: 0,
    pagesPlanned: 7,
    creditsUsed: 3,
  },
]

export const siteUrl = (s: Pick<Site, "domain" | "freeDomain">) => (s.domain?.status === "connected" ? s.domain.name : s.freeDomain)

/* ---------------- enquiries ---------------- */

export type EnquiryKind = "Booking request" | "Contact form" | "Corporate quote" | "Doctor sign-up"
export type EnquiryStatus = "new" | "replied" | "archived"

export interface Enquiry {
  id: string
  siteId: string
  name: string
  email?: string
  phone?: string
  kind: EnquiryKind
  /** page the form was sent from */
  page: string
  message: string
  received: string
  /** for "today" grouping and sorting */
  ageHours: number
  status: EnquiryStatus
}

export const ENQUIRIES: Enquiry[] = [
  {
    id: "e1",
    siteId: "bakti-analisa",
    name: "Nurul Aina",
    phone: "+60 12-418 2290",
    kind: "Booking request",
    page: "Tests & Packages",
    message: "Hi, I'd like to book the Comprehensive health screening for this Saturday morning at the George Town centre. Do I need to fast from the night before?",
    received: "Today, 9:42 AM",
    ageHours: 2,
    status: "new",
  },
  {
    id: "e2",
    siteId: "bakti-analisa",
    name: "Daniel Ong",
    email: "daniel.ong@example.com",
    kind: "Corporate quote",
    page: "Corporate Screening",
    message: "We're a logistics company in Bayan Lepas with about 120 staff. Could you send a quote for annual screening, ideally with on-site sample collection in January?",
    received: "Today, 8:15 AM",
    ageHours: 3,
    status: "new",
  },
  {
    id: "e3",
    siteId: "bakti-analisa",
    name: "Dr. Kavitha Raj",
    email: "kavitha@example.com",
    kind: "Doctor sign-up",
    page: "For Doctors & Clinics",
    message: "I run a GP clinic in Butterworth and would like to open an account for referrals and e-reports. What's the courier pick-up schedule?",
    received: "Yesterday, 4:30 PM",
    ageHours: 20,
    status: "new",
  },
  {
    id: "e4",
    siteId: "bakti-analisa",
    name: "Mei Ling",
    phone: "+60 16-552 0187",
    kind: "Contact form",
    page: "Locations & Contact",
    message: "Is the Butterworth centre open on public holidays? I need a fasting blood sugar test next Monday.",
    received: "Yesterday, 11:05 AM",
    ageHours: 26,
    status: "replied",
  },
  {
    id: "e5",
    siteId: "bakti-analisa",
    name: "Ahmad Faiz",
    phone: "+60 13-702 4419",
    kind: "Booking request",
    page: "Homepage",
    message: "Booking a full blood count and lipid profile for my father (68). Can we come in at 8 AM on Wednesday?",
    received: "Mon, 2:20 PM",
    ageHours: 70,
    status: "replied",
  },
  {
    id: "e6",
    siteId: "bakti-analisa",
    name: "Sarah Lim",
    email: "sarah.lim@example.com",
    kind: "Contact form",
    page: "Prepare for Your Test",
    message: "How long does the HbA1c result usually take? My doctor needs it before Friday.",
    received: "Sun, 10:12 AM",
    ageHours: 98,
    status: "replied",
  },
  {
    id: "e7",
    siteId: "bakti-analisa",
    name: "Raj Kumar",
    phone: "+60 17-330 9002",
    kind: "Booking request",
    page: "Tests & Packages",
    message: "Do you have a men's health package with PSA? Looking to book for next week.",
    received: "Last week",
    ageHours: 190,
    status: "archived",
  },
]

/* ---------------- analytics ---------------- */

/** deterministic pseudo-random numbers so charts look the same on every render */
function rng(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export interface DayStat {
  /** days before today (0 = today) */
  ago: number
  visitors: number
  enquiries: number
}

/** one year of daily numbers for a live site, oldest first; weekdays are busier and traffic grows slowly */
export function dailyStats(siteId: string): DayStat[] {
  if (siteId !== "bakti-analisa") return []
  const rand = rng(7)
  const out: DayStat[] = []
  for (let ago = 364; ago >= 0; ago--) {
    const weekday = (ago + 3) % 7 // 0..6, 5 and 6 are the weekend
    const base = 70 + (364 - ago) * 0.22
    const visitors = Math.round(base * (weekday >= 5 ? 0.62 : 1) * (0.82 + rand() * 0.36))
    const enquiries = Math.max(0, Math.round(visitors * (0.022 + rand() * 0.02)))
    out.push({ ago, visitors, enquiries })
  }
  return out
}

/** share of visits per page over the period (pages the Starter plan builds) */
export const TOP_PAGES = [
  { page: "Homepage", path: "/", share: 0.46 },
  { page: "Tests & Packages", path: "/tests-and-packages", share: 0.24 },
  { page: "Locations & Contact", path: "/locations", share: 0.14 },
  { page: "Prepare for Your Test", path: "/prepare-for-your-test", share: 0.09 },
  { page: "Services", path: "/services", share: 0.07 },
]

export const SOURCES = [
  { source: "Google search", share: 0.51 },
  { source: "Direct", share: 0.2 },
  { source: "Google Maps", share: 0.15 },
  { source: "Instagram", share: 0.09 },
  { source: "WhatsApp shares", share: 0.05 },
]

/** the clicks that matter for a clinic, as a share of visitors */
export const KEY_ACTIONS = [
  { action: "Book a test", rate: 0.034 },
  { action: "WhatsApp", rate: 0.052 },
  { action: "Call", rate: 0.018 },
  { action: "Get directions", rate: 0.041 },
]

/* ---------------- billing ---------------- */

export interface Invoice {
  id: string
  date: string
  siteId: string
  description: string
  amount: number
  status: "paid"
}

export const INVOICES: Invoice[] = [
  { id: "INV-2026-1001", date: "1 Oct 2026", siteId: "bakti-analisa", description: "Starter plan · October", amount: 9, status: "paid" },
  { id: "INV-2026-0901", date: "1 Sep 2026", siteId: "bakti-analisa", description: "Starter plan · September", amount: 9, status: "paid" },
  { id: "INV-2026-0801", date: "1 Aug 2026", siteId: "bakti-analisa", description: "Starter plan · August", amount: 9, status: "paid" },
]

/* ---------------- domains bought through GoGetSpace ---------------- */

export interface OwnedDomain {
  name: string
  /** website it points to; null while unused */
  siteId: string | null
  expires: string
  autoRenew: boolean
}

export const OWNED_DOMAINS: OwnedDomain[] = [
  { name: "baktianalisa.com", siteId: null, expires: "14 Mar 2027", autoRenew: true },
  { name: "rahmadental.my", siteId: null, expires: "2 Feb 2027", autoRenew: false },
]

/** yearly prices by ending, USD */
export const TLD_PRICES: Record<string, number> = { ".com": 12, ".my": 18, ".com.my": 16, ".clinic": 32, ".co": 26, ".net": 14, ".online": 5 }

/**
 * Pretend registry lookup: which endings are free for a name. Deterministic, so the same search always
 * gives the same answer; short or very common names are mostly taken.
 */
export function searchDomains(query: string) {
  const base = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\..*$/, "")
    .replace(/[^a-z0-9-]/g, "")
  if (!base) return []
  const asked = query.trim().toLowerCase().match(/(\.[a-z.]+)$/)?.[1]
  let h = 0
  for (const c of base) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const common = base.length <= 5
  return Object.entries(TLD_PRICES)
    .map(([tld, price], i) => ({
      name: base + tld,
      tld,
      price,
      available: !(common && (tld === ".com" || tld === ".net")) && ((h >> i) & 7) !== 0,
    }))
    .sort((a, b) => (a.tld === asked ? -1 : b.tld === asked ? 1 : 0))
}
