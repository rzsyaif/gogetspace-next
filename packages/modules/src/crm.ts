/**
 * CRM: the people who might become clients, and where each one is in deciding.
 *
 * - a **client** is a person (optionally at a company)
 * - an **enquiry** is one possible piece of work for a client ("Invisalign, about RM 12,000"), moving through stages
 * - **activity** is the history with a client: the enquiry, bookings, notes, calls, emails, stage changes
 */

export type StageKind = "open" | "won" | "lost"

export interface CrmStage {
  id: string
  name: string
  kind: StageKind
}

export type LeadSource = "website" | "walk-in" | "phone" | "referral" | "other"

export const SOURCES: { id: LeadSource; label: string }[] = [
  { id: "website", label: "Website" },
  { id: "walk-in", label: "Walk-in" },
  { id: "phone", label: "Phone" },
  { id: "referral", label: "Referral" },
  { id: "other", label: "Other" },
]

export interface CrmClient {
  id: string
  name: string
  phone?: string
  email?: string
  companyId?: string
  source: LeadSource
  /** ISO date-time */
  createdAt: string
}

export interface CrmCompany {
  id: string
  name: string
  industry?: string
}

export interface CrmEnquiry {
  id: string
  clientId: string
  /** what they're after, in a few words */
  title: string
  /** optional: a check-up isn't worth tracking in money */
  value?: number
  stageId: string
  /** last time anything happened on it (ISO date-time) */
  updatedAt: string
  /** what to do next, and by when (ISO date) */
  nextStep?: { text: string; due: string }
  /** hidden from the follow-up list until this date (ISO date) */
  snoozedUntil?: string
  /** when it was won or lost (ISO date-time) */
  closedAt?: string
  lostReason?: string
}

export type ActivityKind = "enquiry" | "booking" | "note" | "call" | "email" | "stage"

export interface CrmActivity {
  id: string
  clientId: string
  enquiryId?: string
  /** ISO date-time */
  at: string
  kind: ActivityKind
  text: string
}

export interface CrmSettings {
  stages: CrmStage[]
  /** flag an open enquiry after this many days without activity */
  quietDays: number
  companies: boolean
  /** where new enquiries come from on their own */
  auto: { website: boolean; appointments: boolean }
}

export interface CrmData {
  settings: CrmSettings
  clients: CrmClient[]
  companies: CrmCompany[]
  enquiries: CrmEnquiry[]
  activity: CrmActivity[]
}

/** the stages the agent sets up, by kind of business */
export const STAGE_PRESETS: Record<"dentist" | "lawyer" | "general", CrmStage[]> = {
  dentist: [
    { id: "new", name: "New enquiry", kind: "open" },
    { id: "consult", name: "Consultation booked", kind: "open" },
    { id: "plan", name: "Treatment plan sent", kind: "open" },
    { id: "won", name: "Going ahead", kind: "won" },
    { id: "lost", name: "Not going ahead", kind: "lost" },
  ],
  lawyer: [
    { id: "new", name: "New enquiry", kind: "open" },
    { id: "consult", name: "Consultation booked", kind: "open" },
    { id: "letter", name: "Engagement letter sent", kind: "open" },
    { id: "won", name: "Retained", kind: "won" },
    { id: "lost", name: "Declined", kind: "lost" },
  ],
  general: [
    { id: "new", name: "New enquiry", kind: "open" },
    { id: "talking", name: "In conversation", kind: "open" },
    { id: "quote", name: "Quote sent", kind: "open" },
    { id: "won", name: "Won", kind: "won" },
    { id: "lost", name: "Lost", kind: "lost" },
  ],
}

/** reasons offered when an enquiry doesn't go ahead */
export const LOST_REASONS = ["Price", "Went elsewhere", "Not the right time", "No reply", "Other"]

const DAY = 24 * 60 * 60 * 1000
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
/** whole days from `a` to `b` (calendar days, local time) */
export const daysBetween = (a: Date, b: Date) => Math.round((startOf(b).getTime() - startOf(a).getTime()) / DAY)

export const stageOf = (d: Pick<CrmData, "settings">, id: string) => d.settings.stages.find((s) => s.id === id)
export const isOpen = (d: Pick<CrmData, "settings">, e: CrmEnquiry) => stageOf(d, e.stageId)?.kind === "open"

export type FollowUpReason = "overdue" | "due" | "new" | "quiet"

export interface FollowUp {
  enquiry: CrmEnquiry
  client: CrmClient
  reason: FollowUpReason
  /** "Call back about the quote · 2 days overdue" */
  why: string
  /** days overdue, or days quiet */
  days: number
}

/**
 * Who to follow up, most urgent first: overdue next steps (most overdue first), then next steps due today, then new
 * enquiries nobody has replied to, then enquiries quiet for `quietDays` or more (quietest first). Snoozed ones wait.
 */
export function followUps(d: CrmData, now: Date): FollowUp[] {
  const today = isoDay(now)
  const out: FollowUp[] = []
  for (const e of d.enquiries) {
    if (!isOpen(d, e)) continue
    if (e.snoozedUntil && e.snoozedUntil > today) continue
    const client = d.clients.find((c) => c.id === e.clientId)
    if (!client) continue
    const quiet = daysBetween(new Date(e.updatedAt), now)
    if (e.nextStep && e.nextStep.due < today) {
      const late = daysBetween(new Date(`${e.nextStep.due}T00:00`), now)
      out.push({ enquiry: e, client, reason: "overdue", why: `${e.nextStep.text} · ${late === 1 ? "1 day" : `${late} days`} overdue`, days: late })
    } else if (e.nextStep && e.nextStep.due === today) {
      out.push({ enquiry: e, client, reason: "due", why: `${e.nextStep.text} · due today`, days: 0 })
    } else if (e.stageId === d.settings.stages[0]?.id && !d.activity.some((a) => a.enquiryId === e.id && a.kind !== "enquiry")) {
      out.push({ enquiry: e, client, reason: "new", why: quiet === 0 ? "New enquiry today · no reply yet" : `New enquiry ${quiet === 1 ? "yesterday" : `${quiet} days ago`} · no reply yet`, days: quiet })
    } else if (quiet >= d.settings.quietDays && !e.nextStep) {
      out.push({ enquiry: e, client, reason: "quiet", why: `${stageOf(d, e.stageId)?.name} · no activity for ${quiet} days`, days: quiet })
    }
  }
  const rank: Record<FollowUpReason, number> = { overdue: 0, due: 1, new: 2, quiet: 3 }
  return out.sort((a, b) => rank[a.reason] - rank[b.reason] || b.days - a.days)
}

export interface CrmStats {
  /** total value of open enquiries that have one */
  openValue: number
  open: number
  /** won this calendar month */
  wonValue: number
  won: number
  /** won ÷ (won + lost), closed in the last 90 days; null when nothing closed */
  conversion: number | null
}

export function crmStats(d: CrmData, now: Date): CrmStats {
  const month = isoDay(now).slice(0, 7)
  const since = now.getTime() - 90 * DAY
  let openValue = 0,
    open = 0,
    wonValue = 0,
    won = 0,
    won90 = 0,
    lost90 = 0
  for (const e of d.enquiries) {
    const kind = stageOf(d, e.stageId)?.kind
    if (kind === "open") {
      open++
      openValue += e.value ?? 0
    } else if (e.closedAt) {
      const t = new Date(e.closedAt)
      if (kind === "won" && isoDay(t).slice(0, 7) === month) {
        won++
        wonValue += e.value ?? 0
      }
      if (t.getTime() >= since) {
        if (kind === "won") won90++
        else lost90++
      }
    }
  }
  return { openValue, open, wonValue, won, conversion: won90 + lost90 ? won90 / (won90 + lost90) : null }
}

/** "RM 12,000", "RM 850" */
export const formatMoney = (n: number, currency = "RM") => `${currency} ${Math.round(n).toLocaleString("en-US")}`

/** "today", "yesterday", "3 days ago", "12 Nov" */
export function ago(iso: string, now: Date) {
  const d = new Date(iso)
  const n = daysBetween(d, now)
  if (n <= 0) return "today"
  if (n === 1) return "yesterday"
  if (n < 7) return `${n} days ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

/** initials for an avatar: "Nur Aina" → "NA" */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("")
