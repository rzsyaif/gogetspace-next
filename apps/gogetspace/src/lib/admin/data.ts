/**
 * Sample data for the internal admin console: every client, their websites, subscriptions, payments, domains,
 * AI usage, feedback after the first build, the team and system health. Everything here is made up for the prototype and
 * generated deterministically, so numbers stay the same between renders.
 */
import { PLANS, planInfo, type Plan } from "@/lib/plans"

/** the prototype's "today" */
export const TODAY = new Date(2026, 9, 29)
const D = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
const DM = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" })
const MON = new Intl.DateTimeFormat("en-GB", { month: "short" })
export const dateAgo = (days: number) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - days)
export const fmtDate = (days: number) => D.format(dateAgo(days))
export const fmtDay = (days: number) => DM.format(dateAgo(days))
export const relDays = (days: number) => (days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 30 ? `${days} days ago` : days < 60 ? "1 month ago" : `${Math.floor(days / 30)} months ago`)
export const usd = (n: number, cents = false) => `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`

function rng(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)

/* ---------------- clients and their websites ---------------- */

export type ClientStatus = "active" | "suspended" | "deletion"
export type Industry = "Clinic" | "Laboratory" | "Dental" | "Law firm" | "Pharmacy" | "Physiotherapy" | "Accounting" | "Notary"
export type AdminSiteStatus = "live" | "draft" | "suspended"

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  city: string
  country: "Malaysia" | "Singapore" | "Indonesia"
  joinedAgo: number
  lastActiveAgo: number
  status: ClientStatus
  verified: boolean
  /** saved card, if they've ever paid */
  card: { brand: string; last4: string } | null
  signup: "Google" | "Email"
}

export interface AdminSite {
  id: string
  clientId: string
  name: string
  industry: Industry
  plan: Plan
  status: AdminSiteStatus
  freeDomain: string
  domain: { name: string; status: "connected" | "pending" } | null
  createdAgo: number
  /** null while still a draft */
  publishedAgo: number | null
  pages: number
  visitors30: number
  enquiries30: number
  /** agent credits used this month (the plan's allowance is in PLANS) */
  credits: number
  /** extra credits support granted this month */
  bonusCredits: number
  generations: number
  failedGenerations: number
}

type SiteSeed = [name: string, industry: Industry, plan: Plan, status: AdminSiteStatus, domain?: string, pendingDns?: boolean]
type ClientSeed = [id: string, name: string, email: string, city: string, country: Client["country"], joinedAgo: number, sites: SiteSeed[], extra?: Partial<Client>]

const SEEDS: ClientSeed[] = [
  ["frank-tan", "Frank Tan", "frank@baktianalisa.my", "George Town", "Malaysia", 142, [
    ["Bakti Analisa Clinical Laboratory Penang", "Laboratory", "starter", "live", "baktianalisa.my"],
    ["Rahma Family Dental", "Dental", "free", "draft"],
    ["Lim & Partners Advocates", "Law firm", "free", "draft"],
  ]],
  ["nurul-aziz", "Nurul Aziz", "nurul@klinikaziz.my", "Shah Alam", "Malaysia", 211, [["Klinik Aziz Shah Alam", "Clinic", "business", "live", "klinikaziz.my"], ["Aziz Kids Clinic", "Clinic", "starter", "live", "azizkids.my"]]],
  ["rajesh-kumar", "Rajesh Kumar", "rajesh@kumarlaw.com.my", "Kuala Lumpur", "Malaysia", 188, [["Kumar & Co Advocates", "Law firm", "business", "live", "kumarlaw.com.my"]]],
  ["mei-ling", "Ong Mei Ling", "meiling@smilestudio.sg", "Singapore", "Singapore", 96, [["Smile Studio Dental", "Dental", "starter", "live", "smilestudio.sg"]]],
  ["budi-santoso", "Budi Santoso", "budi@apotekbudi.id", "Surabaya", "Indonesia", 64, [["Apotek Budi Sehat", "Pharmacy", "starter", "live", "apotekbudi.id", true]]],
  ["siti-hajar", "Siti Hajar", "siti.hajar@gmail.com", "Johor Bahru", "Malaysia", 41, [["Hajar Physio & Rehab", "Physiotherapy", "free", "live"]]],
  ["daniel-wong", "Daniel Wong", "daniel@wongaccounting.my", "Ipoh", "Malaysia", 233, [["Wong & Associates Chartered Accountants", "Accounting", "starter", "live", "wongaccounting.my"]], { card: { brand: "Mastercard", last4: "1881" } }],
  ["aisyah-rahman", "Aisyah Rahman", "aisyah@rahmanpharmacy.my", "Kota Bharu", "Malaysia", 27, [["Rahman Pharmacy", "Pharmacy", "free", "draft"]]],
  ["kevin-lee", "Kevin Lee", "kevin@leenotary.sg", "Singapore", "Singapore", 154, [["Lee Notary Public", "Notary", "starter", "live", "leenotary.sg"]]],
  ["priya-nair", "Priya Nair", "priya@nairdental.my", "Petaling Jaya", "Malaysia", 120, [["Nair Dental Surgery", "Dental", "business", "live", "nairdental.my"], ["Nair Orthodontics", "Dental", "starter", "live", "nairortho.my", true]]],
  ["ahmad-fauzi", "Ahmad Fauzi", "fauzi.ahmad@yahoo.com", "Kuantan", "Malaysia", 12, [["Fauzi Medical Centre", "Clinic", "free", "draft"]]],
  ["chloe-tan", "Chloe Tan", "chloe@physiohub.my", "Kuala Lumpur", "Malaysia", 79, [["PhysioHub Bangsar", "Physiotherapy", "starter", "live", "physiohub.my"]]],
  ["hendra-wijaya", "Hendra Wijaya", "hendra@wijayalaw.id", "Jakarta", "Indonesia", 58, [["Wijaya & Rekan Law Office", "Law firm", "business", "live", "wijayalaw.id"]]],
  ["lim-boon-keat", "Lim Boon Keat", "bk.lim@hotmail.com", "Melaka", "Malaysia", 9, [["Klinik Lim Melaka", "Clinic", "free", "draft"]]],
  ["farah-hassan", "Farah Hassan", "farah@hassanlab.my", "Kuching", "Malaysia", 101, [["Hassan Diagnostics Lab", "Laboratory", "starter", "live", "hassanlab.my"]], { status: "active" }],
  ["andi-pratama", "Andi Pratama", "andi.p@gmail.com", "Bandung", "Indonesia", 6, [["Klinik Pratama Bandung", "Clinic", "free", "draft"]]],
  ["grace-teo", "Grace Teo", "grace@teoandco.sg", "Singapore", "Singapore", 175, [["Teo & Co Accounting", "Accounting", "business", "live", "teoandco.sg"]]],
  ["mohd-irfan", "Mohd Irfan", "irfan@doktorirfan.my", "Alor Setar", "Malaysia", 33, [["Doktor Irfan Online", "Clinic", "free", "suspended"]], { status: "suspended" }],
  ["jessica-ng", "Jessica Ng", "jessica@ngskinclinic.my", "Kota Kinabalu", "Malaysia", 3, [["Ng Skin & Aesthetics", "Clinic", "free", "draft"]], { verified: false }],
  ["yusuf-ali", "Yusuf Ali", "yusuf@alipharmacy.my", "Seremban", "Malaysia", 270, [["Ali Pharmacy Seremban", "Pharmacy", "starter", "live", "alipharmacy.my"]], { status: "deletion" }],
  ["rina-kartika", "Rina Kartika", "rina@kartikadental.id", "Yogyakarta", "Indonesia", 19, [["Kartika Dental Care", "Dental", "starter", "live", "kartikadental.id", true]]],
  ["thomas-goh", "Thomas Goh", "thomas@gohlegal.my", "George Town", "Malaysia", 1, [["Goh Legal Chambers", "Law firm", "free", "draft"]], { verified: false }],
]

const CARDS = ["Visa", "Mastercard", "Visa", "Amex"]

export const CLIENTS: Client[] = SEEDS.map(([id, name, email, city, country, joinedAgo, sites, extra]) => {
  const r = rng(hash(id))
  const paid = sites.some((s) => s[2] !== "free")
  return {
    id,
    name,
    email,
    phone: country === "Singapore" ? `+65 9${Math.floor(r() * 9000000 + 1000000)}` : country === "Indonesia" ? `+62 81${Math.floor(r() * 900000000 + 100000000)}` : `+60 1${Math.floor(r() * 9)}-${Math.floor(r() * 9000000 + 1000000)}`,
    city,
    country,
    joinedAgo,
    lastActiveAgo: Math.min(joinedAgo, Math.floor(r() * 9)),
    status: "active",
    verified: true,
    card: paid ? { brand: CARDS[Math.floor(r() * CARDS.length)], last4: String(1000 + Math.floor(r() * 8999)) } : null,
    signup: r() > 0.45 ? "Google" : "Email",
    ...extra,
  }
})

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 3)
    .join("-")

export const ADMIN_SITES: AdminSite[] = SEEDS.flatMap(([clientId, , , , , joinedAgo, sites]) =>
  sites.map(([name, industry, plan, status, domain, pendingDns], i) => {
    const id = clientId === "frank-tan" ? ["bakti-analisa", "rahma-dental", "lim-partners"][i] : slug(name)
    const r = rng(hash(id))
    const createdAgo = Math.max(0, joinedAgo - i * Math.floor(r() * 20 + 5))
    const live = status === "live"
    const allowance = planInfo(plan).credits
    const visitors30 = live ? Math.round((plan === "business" ? 2600 : plan === "starter" ? 1200 : 300) * (0.5 + r())) : 0
    const generations = Math.round(6 + r() * 30 + (plan === "business" ? 40 : 0))
    return {
      id,
      clientId,
      name,
      industry,
      plan,
      status,
      freeDomain: `${id}.get.space`,
      domain: domain ? { name: domain, status: pendingDns ? ("pending" as const) : ("connected" as const) } : null,
      createdAgo,
      publishedAgo: live ? Math.floor(r() * Math.min(20, createdAgo + 1)) : status === "suspended" ? 14 : null,
      pages: plan === "free" ? 1 : plan === "starter" ? Math.ceil(2 + r() * 3) : Math.ceil(6 + r() * 8),
      visitors30,
      enquiries30: Math.round(visitors30 * (0.02 + r() * 0.02)),
      // a couple of free accounts burning far more than their allowance
      credits: id === "fauzi-medical-centre" ? 212 : id === "klinik-pratama-bandung" ? 148 : Math.round(allowance * (0.08 + r() * 0.82)),
      bonusCredits: 0,
      generations: id === "fauzi-medical-centre" ? 96 : generations,
      failedGenerations: Math.floor(r() * 3) + (id === "fauzi-medical-centre" ? 11 : 0),
    }
  }),
)

/* ---------------- subscriptions and payments ---------------- */

export type SubStatus = "active" | "past_due" | "canceled"
export interface Subscription {
  siteId: string
  clientId: string
  plan: Plan
  status: SubStatus
  startedAgo: number
  /** days until the next renewal (negative = overdue) */
  renewsIn: number
}

const PAST_DUE = new Set(["apotek-budi-sehat", "nair-orthodontics"])
export const SUBSCRIPTIONS: Subscription[] = [
  ...ADMIN_SITES.filter((s) => s.plan !== "free").map((s) => {
    const r = rng(hash(s.id) + 3)
    return {
      siteId: s.id,
      clientId: s.clientId,
      plan: s.plan,
      status: PAST_DUE.has(s.id) ? ("past_due" as const) : ("active" as const),
      startedAgo: Math.max(1, s.createdAgo - Math.floor(r() * 5)),
      renewsIn: PAST_DUE.has(s.id) ? -Math.ceil(r() * 6) : Math.ceil(r() * 29),
    }
  }),
  { siteId: "hajar-physio-and", clientId: "siti-hajar", plan: "starter", status: "canceled", startedAgo: 38, renewsIn: 4 },
]

export type PaymentStatus = "paid" | "failed" | "refunded"
export interface Payment {
  id: string
  daysAgo: number
  clientId: string
  siteId: string | null
  description: string
  amount: number
  status: PaymentStatus
  /** why it failed */
  failure?: string
}

export const PAYMENTS: Payment[] = (() => {
  const out: Payment[] = []
  let n = 4100
  for (const sub of SUBSCRIPTIONS) {
    const price = planInfo(sub.plan).price
    const site = ADMIN_SITES.find((s) => s.id === sub.siteId)
    const months = Math.min(6, Math.floor(sub.startedAgo / 30) + 1)
    for (let m = 0; m < months; m++) {
      const daysAgo = Math.max(0, 30 - (sub.renewsIn > 0 ? sub.renewsIn : 30) + m * 30)
      const failed = sub.status === "past_due" && m === 0
      out.push({
        id: `pay_${n++}`,
        daysAgo: failed ? -sub.renewsIn : daysAgo,
        clientId: sub.clientId,
        siteId: sub.siteId,
        description: `${planInfo(sub.plan).name} plan · ${site?.name ?? sub.siteId}`,
        amount: price,
        status: failed ? "failed" : "paid",
        failure: failed ? (sub.siteId === "apotek-budi-sehat" ? "Card declined · insufficient funds" : "Card expired") : undefined,
      })
    }
  }
  for (const s of ADMIN_SITES.filter((x) => x.domain)) {
    out.push({ id: `pay_${n++}`, daysAgo: Math.max(0, s.createdAgo - 2), clientId: s.clientId, siteId: s.id, description: `${s.domain!.name} · 1 year`, amount: s.domain!.name.endsWith(".sg") ? 24 : s.domain!.name.endsWith(".id") ? 20 : 18, status: "paid" })
  }
  out.push({ id: `pay_${n++}`, daysAgo: 11, clientId: "siti-hajar", siteId: "hajar-physio-and", description: "Starter plan · Hajar Physio & Rehab", amount: 9, status: "refunded" })
  out.push({ id: `pay_${n++}`, daysAgo: 23, clientId: "grace-teo", siteId: "teo-and-co", description: "Business plan · duplicate charge", amount: 19, status: "refunded" })
  return out.sort((a, b) => a.daysAgo - b.daysAgo)
})()

export const mrrOf = (subs: Subscription[]) => subs.filter((s) => s.status !== "canceled").reduce((n, s) => n + planInfo(s.plan).price, 0)

/** MRR at the start of each of the last 12 months, from when each subscription started, ending with today's */
export function mrrHistory(subs: Subscription[]) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = i === 11 ? TODAY : new Date(TODAY.getFullYear(), TODAY.getMonth() - 10 + i, 1)
    const ago = Math.round((TODAY.getTime() - d.getTime()) / 86_400_000)
    const value = subs.filter((s) => s.startedAgo >= ago && (s.status !== "canceled" || ago > 0)).reduce((n, s) => n + planInfo(s.plan).price, 0)
    return { label: i === 11 ? "Now" : MON.format(d), value }
  })
}

/** total clients at the end of each of the last 26 weeks, from when each one joined */
export function clientGrowth(clients: Client[]) {
  return Array.from({ length: 26 }, (_, i) => {
    const ago = (25 - i) * 7
    return { label: DM.format(dateAgo(ago)), value: clients.filter((c) => c.joinedAgo >= ago).length }
  })
}

/* ---------------- domains ---------------- */

export type DomainHealth = "active" | "pending_dns" | "expiring" | "ssl_error"
export interface AdminDomain {
  name: string
  clientId: string
  siteId: string | null
  /** registered through GoGetSpace, or connected from another registrar */
  source: "GoGetSpace" | "External"
  health: DomainHealth
  expiresIn: number
  autoRenew: boolean
  /** hours since the DNS records were last checked */
  checkedHoursAgo: number
  /** for pending DNS: how long it's been waiting */
  waitingHours?: number
}

export const ADMIN_DOMAINS: AdminDomain[] = [
  ...ADMIN_SITES.filter((s) => s.domain).map((s) => {
    const r = rng(hash(s.domain!.name))
    const external = s.domain!.name.endsWith(".sg") || s.id === "kumar-and-co"
    const pending = s.domain!.status === "pending"
    return {
      name: s.domain!.name,
      clientId: s.clientId,
      siteId: s.id,
      source: external || pending ? ("External" as const) : ("GoGetSpace" as const),
      health: pending ? ("pending_dns" as const) : s.id === "lee-notary-public" ? ("ssl_error" as const) : s.id === "wong-and-associates" ? ("expiring" as const) : ("active" as const),
      expiresIn: s.id === "wong-and-associates" ? 12 : Math.round(60 + r() * 300),
      autoRenew: s.id !== "wong-and-associates",
      checkedHoursAgo: Math.ceil(r() * 6),
      waitingHours: pending ? (s.id === "apotek-budi-sehat" ? 76 : s.id === "kartika-dental-care" ? 52 : 20) : undefined,
    }
  }),
  { name: "rahmadental.my", clientId: "frank-tan", siteId: null, source: "GoGetSpace", health: "active", expiresIn: 300, autoRenew: true, checkedHoursAgo: 3 },
]

export const DOMAIN_HEALTH: Record<DomainHealth, { label: string; tone: "success" | "warning" | "error" }> = {
  active: { label: "Connected", tone: "success" },
  pending_dns: { label: "Waiting for DNS", tone: "warning" },
  expiring: { label: "Expiring soon", tone: "warning" },
  ssl_error: { label: "SSL error", tone: "error" },
}

/* ---------------- AI usage ---------------- */

export interface AIModel {
  id: string
  name: string
  /** USD per 1M input / output tokens (list price, prompts up to 100K tokens); images priced per image */
  input: number
  output: number
  perImage?: number
  kind: "text" | "image"
  /** where the price comes from */
  source: string
}

/** Anthropic list prices, checked 29 Oct 2026 (platform.claude.com pricing). No caching or batch discount applied. */
export const PRICES_CHECKED = "29 Oct 2026"
export const AI_MODELS: AIModel[] = [
  { id: "opus", name: "Claude Opus 5.5", input: 4, output: 20, kind: "text", source: "Anthropic list price" },
  { id: "sonnet", name: "Claude Sonnet 5.5", input: 2, output: 10, kind: "text", source: "Anthropic list price" },
  { id: "haiku", name: "Claude Haiku 5.5", input: 0.1, output: 0.5, kind: "text", source: "Anthropic list price" },
  { id: "image", name: "Image model", input: 0, output: 0, perImage: 0.04, kind: "image", source: "Placeholder — set your image provider's price" },
]

export type AIStep = "brief" | "style" | "sitemap" | "page" | "edit" | "images" | "scan"
export interface AIStepInfo {
  id: AIStep
  label: string
  help: string
  kind: "text" | "image"
  /** share of all runs, for the usage totals */
  share: number
  /** tokens per run: what we send (system prompt, brief, context) and what comes back */
  avgIn: number
  avgOut: number
  /** images per run, for image steps */
  images?: number
  /** how many times the step runs in a first build, per page or once */
  perBuild: "once" | "per page" | "none"
}
export const AI_STEPS: AIStepInfo[] = [
  { id: "brief", label: "Project brief", help: "Turns the first prompt + web search into a brief", kind: "text", share: 0.06, avgIn: 6_000, avgOut: 1_500, perBuild: "once" },
  { id: "style", label: "Design & style", help: "Four style options and their hero previews", kind: "text", share: 0.12, avgIn: 5_000, avgOut: 4_000, perBuild: "once" },
  { id: "sitemap", label: "Sitemap plan", help: "Pages and sections for the plan", kind: "text", share: 0.07, avgIn: 6_000, avgOut: 1_500, perBuild: "once" },
  { id: "page", label: "Page build", help: "Writes one page's copy and layout", kind: "text", share: 0.44, avgIn: 12_000, avgOut: 6_000, perBuild: "per page" },
  { id: "edit", label: "Editor chat", help: "One change asked for in the editor", kind: "text", share: 0.22, avgIn: 10_000, avgOut: 2_000, perBuild: "none" },
  { id: "images", label: "Images", help: "Hero and section images for one page", kind: "image", share: 0.05, avgIn: 0, avgOut: 0, images: 3, perBuild: "per page" },
  { id: "scan", label: "Safety scan", help: "Checks one page for risky claims before publishing", kind: "text", share: 0.04, avgIn: 6_000, avgOut: 300, perBuild: "per page" },
]

export const DEFAULT_ROUTING: Record<AIStep, string> = { brief: "haiku", style: "sonnet", sitemap: "sonnet", page: "opus", edit: "sonnet", images: "image", scan: "haiku" }

/** one run's cost split into input and output (images: per image) */
export function stepBreakdown(step: AIStepInfo, modelId: string) {
  const m = AI_MODELS.find((x) => x.id === modelId)!
  if (m.kind === "image") return { input: 0, output: (m.perImage ?? 0) * (step.images ?? 1), total: (m.perImage ?? 0) * (step.images ?? 1) }
  const input = (step.avgIn * m.input) / 1_000_000
  const output = (step.avgOut * m.output) / 1_000_000
  return { input, output, total: input + output }
}

export const stepCost = (step: AIStepInfo, modelId: string) => stepBreakdown(step, modelId).total

/** what the agent spends building a whole site the first time (plan, style, sitemap, then every page) */
export function firstBuildCost(routing: Record<AIStep, string>, pages: number) {
  return AI_STEPS.reduce((n, s) => n + stepCost(s, routing[s.id]) * (s.perBuild === "once" ? 1 : s.perBuild === "per page" ? pages : 0), 0)
}

/** generations per day for the last 30 days, oldest first */
export const AI_DAILY: { ago: number; generations: number; failed: number }[] = (() => {
  const r = rng(53)
  return Array.from({ length: 60 }, (_, i) => {
    const ago = 59 - i
    const generations = Math.round((12 + (60 - ago) * 0.25) * (0.7 + r() * 0.6) * (((ago + 3) % 7) >= 5 ? 0.7 : 1))
    return { ago, generations, failed: Math.round(generations * (0.01 + r() * 0.04)) }
  })
})()

export type GenStatus = "ok" | "failed" | "retried"
export interface Generation {
  id: string
  minutesAgo: number
  siteId: string
  step: AIStep
  model: string
  tokens: number
  cost: number
  seconds: number
  status: GenStatus
  error?: string
}

export const GENERATIONS: Generation[] = (() => {
  const r = rng(77)
  const sites = ADMIN_SITES.filter((s) => s.status !== "suspended")
  const errors: Record<number, string> = { 2: "Timed out after 120 s", 5: "Provider overloaded (529) — retried automatically", 9: "Output failed layout validation", 13: "Timed out after 120 s" }
  return Array.from({ length: 16 }, (_, i) => {
    const step = AI_STEPS[Math.floor(r() * AI_STEPS.length)]
    const site = i === 2 || i === 9 ? ADMIN_SITES.find((s) => s.id === "fauzi-medical-centre")! : sites[Math.floor(r() * sites.length)]
    const model = DEFAULT_ROUTING[step.id]
    return {
      id: `gen_${9820 - i}`,
      minutesAgo: i * 7 + Math.floor(r() * 6),
      siteId: site.id,
      step: step.id,
      model,
      tokens: step.kind === "image" ? 0 : Math.round((step.avgIn + step.avgOut) * (0.6 + r() * 0.8)),
      cost: stepCost(step, model) * (0.6 + r() * 0.8),
      seconds: Math.round(step.id === "page" ? 40 + r() * 70 : 4 + r() * 20),
      status: i === 5 ? "retried" : errors[i] ? "failed" : "ok",
      error: errors[i],
    }
  })
})()

/* ---------------- feedback after the first build ---------------- */

export type Rating = "good" | "fine" | "bad"
export type ResearchStatus = "new" | "invited" | "scheduled" | "done" | "declined"

export interface Feedback {
  id: string
  /** hours ago when seeded; live answers carry a timestamp instead */
  hoursAgo: number
  at?: number
  clientId: string | null
  /** who answered: the client's name, or what they typed before signing up */
  name: string
  email: string | null
  siteName: string
  siteId: string | null
  rating: Rating
  /** follow-up answers (what they liked / what went wrong) */
  tags: string[]
  comment: string
  /** said yes to "Can we contact you for research?" */
  research: boolean
  researchStatus: ResearchStatus
}

export const RATING: Record<Rating, { label: string; tone: "success" | "warning" | "error"; question: string; tags: string[] }> = {
  good: {
    label: "Good",
    tone: "success",
    question: "What did you like most?",
    tags: ["The design", "The writing", "Page structure", "How fast it was", "It understood my business"],
  },
  fine: {
    label: "Fine",
    tone: "warning",
    question: "What would make it better?",
    tags: ["The design", "The writing", "Missing information", "Images", "Too generic"],
  },
  bad: {
    label: "Bad",
    tone: "error",
    question: "What went wrong?",
    tags: ["Doesn't look like my business", "Wrong or made-up details", "The design", "The writing", "Missing pages", "Too slow"],
  },
}

const COMMENTS: Record<Rating, string[]> = {
  good: [
    "Honestly better than the agency quote I got. The services page is exactly how I explain it to patients.",
    "Loved that it found our address and opening hours by itself.",
    "",
    "Clean and professional. My partner thought we paid for it.",
    "",
  ],
  fine: [
    "Looks nice but the photos don't look like Malaysia at all.",
    "Good start. It used 'clinic' when we're a pharmacy in a few places.",
    "",
    "I wanted to see the price list on the homepage.",
  ],
  bad: [
    "It said we've been open since 1998 — we opened in 2019. Had to fix a lot of text.",
    "The colours are nothing like our signboard. Wanted our green.",
    "Took too long and then the Corporate page failed.",
  ],
}

export const FEEDBACK: Feedback[] = (() => {
  const r = rng(404)
  const out: Feedback[] = []
  // one answer per built website, roughly in the order they were built
  const built = ADMIN_SITES.filter((s) => s.status !== "draft" || s.generations > 15)
  built.forEach((site, i) => {
    if (r() < 0.22) return // didn't answer
    const client = CLIENTS.find((c) => c.id === site.clientId)!
    const roll = r()
    const rating: Rating = roll < 0.55 ? "good" : roll < 0.83 ? "fine" : "bad"
    const pool = RATING[rating].tags
    const tags = pool.filter(() => r() < 0.35).slice(0, 3)
    if (tags.length === 0) tags.push(pool[Math.floor(r() * pool.length)])
    const research = r() < 0.45
    out.push({
      id: `fb_${700 + i}`,
      hoursAgo: Math.max(1, site.createdAgo * 24 - Math.floor(r() * 20)),
      clientId: client.id,
      name: client.name,
      email: client.email,
      siteName: site.name,
      siteId: site.id,
      rating,
      tags,
      comment: COMMENTS[rating][Math.floor(r() * COMMENTS[rating].length)],
      research,
      researchStatus: !research ? "new" : site.createdAgo > 60 ? (r() < 0.6 ? "done" : "scheduled") : site.createdAgo > 20 ? "invited" : "new",
    })
  })
  // most first builds come from people who haven't signed up yet
  const DRAFTS = ["Klinik Mesra", "Poliklinik Seri Iskandar", "Chong Dental", "Ramesh & Co", "Apotek Sejahtera", "Siew Physio", "Klinik Pergigian Aman", "Harun Legal", "Bright Eyes Optometry", "Klinik Kesihatan Wanita", "Tay Accounting", "Pusat Fisioterapi Ceria"]
  for (let i = 0; i < 96; i++) {
    const roll = r()
    const hoursAgo = Math.floor(Math.pow(r(), 1.15) * 110 * 24) + 2
    // quality improves over the quarter: fewer "Bad" answers in recent weeks
    const badCut = 0.1 + (hoursAgo / (110 * 24)) * 0.14
    const rating: Rating = roll < badCut ? "bad" : roll < badCut + 0.3 ? "fine" : "good"
    const pool = RATING[rating].tags
    const tags = pool.filter(() => r() < 0.3).slice(0, 3)
    if (tags.length === 0) tags.push(pool[Math.floor(r() * pool.length)])
    const research = r() < 0.3
    const draft = DRAFTS[Math.floor(r() * DRAFTS.length)]
    out.push({
      id: `fb_${600 + i}`,
      hoursAgo,
      clientId: null,
      name: "Not signed up",
      email: research ? `${draft.toLowerCase().replace(/[^a-z]+/g, "")}@gmail.com` : null,
      siteName: `${draft} (draft)`,
      siteId: null,
      rating,
      tags,
      comment: r() < 0.3 ? COMMENTS[rating][Math.floor(r() * COMMENTS[rating].length)] : "",
      research,
      researchStatus: !research ? "new" : hoursAgo > 40 * 24 ? "done" : hoursAgo > 14 * 24 ? (r() < 0.5 ? "scheduled" : "invited") : "new",
    })
  }
  // two recent ones worth reading
  out.push(
    { id: "fb_690", hoursAgo: 3, clientId: null, name: "Not signed up", email: "drsharifah.clinic@gmail.com", siteName: "Klinik Sharifah (draft)", siteId: null, rating: "fine", tags: ["Images", "Too generic"], comment: "Would sign up if I could use my own photos first.", research: true, researchStatus: "new" },
    { id: "fb_691", hoursAgo: 26, clientId: null, name: "Not signed up", email: null, siteName: "Tan Legal (draft)", siteId: null, rating: "bad", tags: ["Wrong or made-up details"], comment: "Made up two partners who don't exist.", research: false, researchStatus: "new" },
  )
  return out.sort((a, b) => a.hoursAgo - b.hoursAgo)
})()

/* ---------------- team, roles and audit ---------------- */

export type Role = "Owner" | "Admin" | "Support" | "Finance" | "Viewer"
export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  lastActive: string
  twoFactor: boolean
}

export const ME = { id: "kiki", name: "Kiki", email: "kiki@get.space", role: "Owner" as Role }

export const TEAM: TeamMember[] = [
  { id: "kiki", name: "Kiki", email: "kiki@get.space", role: "Owner", lastActive: "Now", twoFactor: true },
  { id: "hafiz", name: "Hafiz Rahim", email: "hafiz@get.space", role: "Admin", lastActive: "1 hour ago", twoFactor: true },
  { id: "melissa", name: "Melissa Chong", email: "melissa@get.space", role: "Support", lastActive: "12 min ago", twoFactor: true },
  { id: "dewi", name: "Dewi Lestari", email: "dewi@get.space", role: "Support", lastActive: "Yesterday", twoFactor: false },
  { id: "arun", name: "Arun Pillai", email: "arun@get.space", role: "Finance", lastActive: "3 days ago", twoFactor: true },
]

export const PERMISSIONS: { id: string; label: string; roles: Role[] }[] = [
  { id: "view", label: "View clients, websites and usage", roles: ["Owner", "Admin", "Support", "Finance", "Viewer"] },
  { id: "impersonate", label: "Log in as a client", roles: ["Owner", "Admin", "Support"] },
  { id: "unpublish", label: "Unpublish or suspend", roles: ["Owner", "Admin", "Support"] },
  { id: "credits", label: "Grant agent credits", roles: ["Owner", "Admin", "Support"] },
  { id: "refund", label: "Refund and retry payments", roles: ["Owner", "Admin", "Finance"] },
  { id: "plans", label: "Change plans, prices and flags", roles: ["Owner", "Admin"] },
  { id: "models", label: "Change AI model routing", roles: ["Owner", "Admin"] },
  { id: "delete", label: "Delete client data", roles: ["Owner"] },
  { id: "team", label: "Manage the team", roles: ["Owner"] },
]

export interface AuditEntry {
  id: string
  /** minutes ago when seeded; new entries use 0 and a real timestamp */
  minutesAgo: number
  at?: number
  actor: string
  action: string
  target: string
  detail?: string
}

export const AUDIT_SEED: AuditEntry[] = [
  { id: "a1", minutesAgo: 18, actor: "Melissa Chong", action: "Logged in as client", target: "Ong Mei Ling", detail: "Reason: help replacing the team photos (ticket #2231)" },
  { id: "a2", minutesAgo: 64, actor: "Hafiz Rahim", action: "Granted credits", target: "Klinik Aziz Shah Alam", detail: "+100 credits · page build failed twice" },
  { id: "a3", minutesAgo: 190, actor: "Arun Pillai", action: "Refunded payment", target: "Teo & Co Accounting", detail: "$19 · duplicate charge" },
  { id: "a4", minutesAgo: 420, actor: "Kiki", action: "Changed model routing", target: "Editor chat", detail: "Claude Opus 5.5 → Claude Sonnet 5.5" },
  { id: "a5", minutesAgo: 1440, actor: "Dewi Lestari", action: "Sent DNS reminder", target: "apotekbudi.id" },
  { id: "a6", minutesAgo: 2900, actor: "Hafiz Rahim", action: "Suspended client", target: "Mohd Irfan", detail: "Impersonating a registered doctor (rep_311)" },
  { id: "a7", minutesAgo: 4320, actor: "Kiki", action: "Updated plan", target: "Business", detail: "Credits 400 → 500" },
  { id: "a8", minutesAgo: 5800, actor: "Yusuf Ali", action: "Requested data deletion", target: "Yusuf Ali", detail: "Scheduled for 12 Nov 2026 (30-day grace period)" },
]

/* ---------------- system ---------------- */

export type ServiceStatus = "operational" | "degraded" | "down"
export const SERVICES: { name: string; role: string; status: ServiceStatus; latency: string; note?: string }[] = [
  { name: "AI provider", role: "Brief, style, pages, editor chat", status: "degraded", latency: "2.8 s p50", note: "Elevated overload errors since 11:40 — retries are absorbing most of them." },
  { name: "Image generation", role: "Hero and section images", status: "operational", latency: "6.1 s p50" },
  { name: "Payments", role: "Plans, domains, refunds", status: "operational", latency: "310 ms" },
  { name: "Domain registrar", role: "Search, register, renew", status: "operational", latency: "880 ms" },
  { name: "Hosting & SSL", role: "Published sites, certificates", status: "operational", latency: "42 ms" },
  { name: "Email delivery", role: "Receipts, reminders, enquiries", status: "operational", latency: "1.2 s" },
]

export const QUEUE = { waiting: 7, running: 12, failedLastHour: 4, p50: 38, p95: 112 }

export interface SentEmail {
  id: string
  minutesAgo: number
  to: string
  clientId: string
  template: string
  status: "delivered" | "opened" | "bounced"
}

export const EMAILS: SentEmail[] = [
  { id: "em1", minutesAgo: 9, to: "thomas@gohlegal.my", clientId: "thomas-goh", template: "Verify your email", status: "delivered" },
  { id: "em2", minutesAgo: 40, to: "nurul@klinikaziz.my", clientId: "nurul-aziz", template: "New enquiry from your website", status: "opened" },
  { id: "em3", minutesAgo: 95, to: "budi@apotekbudi.id", clientId: "budi-santoso", template: "Payment failed — update your card", status: "opened" },
  { id: "em4", minutesAgo: 180, to: "jessica@ngskinclinic.my", clientId: "jessica-ng", template: "Verify your email", status: "bounced" },
  { id: "em5", minutesAgo: 260, to: "rina@kartikadental.id", clientId: "rina-kartika", template: "Finish connecting your domain", status: "delivered" },
  { id: "em6", minutesAgo: 600, to: "frank@baktianalisa.my", clientId: "frank-tan", template: "Your receipt — Starter plan", status: "opened" },
  { id: "em7", minutesAgo: 1300, to: "daniel@wongaccounting.my", clientId: "daniel-wong", template: "Your domain expires in 2 weeks", status: "delivered" },
  { id: "em8", minutesAgo: 1500, to: "priya@nairdental.my", clientId: "priya-nair", template: "Payment failed — update your card", status: "delivered" },
]

export const minutesLabel = (m: number) => (m < 1 ? "Just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : relDays(Math.floor(m / 1440)))

/* ---------------- plan settings ---------------- */

export interface PlanSettings {
  id: Plan
  name: string
  price: number
  pages: number | null
  credits: number
  analyticsDays: number
  customDomain: boolean
}

export const PLAN_SETTINGS_SEED: PlanSettings[] = PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  pages: Number.isFinite(p.pages) ? p.pages : null,
  credits: p.credits,
  analyticsDays: p.analyticsDays,
  customDomain: p.customDomain,
}))

export const FLAGS_SEED: { id: string; label: string; help: string; on: boolean; audience: string }[] = [
  { id: "booking", label: "Appointment booking", help: "Booking widget on Business sites", on: true, audience: "Business plan" },
  { id: "images", label: "AI images", help: "Generate hero and section images instead of placeholders", on: true, audience: "Everyone" },
  { id: "whatsapp", label: "WhatsApp button", help: "Floating chat button on published sites", on: true, audience: "Everyone" },
  { id: "custom-style", label: "Create your own style", help: "Fifth card in Design & Style", on: false, audience: "Staff only" },
  { id: "id-market", label: "Indonesian onboarding", help: "Bahasa Indonesia prompts and .id domains first", on: false, audience: "Indonesia" },
]

/** average cost of one generation with the given model routing (weighted by how often each step runs) */
export const costPerGeneration = (routing: Record<AIStep, string>) => AI_STEPS.reduce((n, s) => n + s.share * stepCost(s, routing[s.id]), 0)

/** total generations over the last `days` (and the period before, for deltas) */
export function generationsIn(days: number, offset = 0) {
  return AI_DAILY.slice(AI_DAILY.length - days - offset, AI_DAILY.length - offset).reduce((n, d) => n + d.generations, 0)
}
