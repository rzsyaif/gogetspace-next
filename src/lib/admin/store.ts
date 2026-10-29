"use client"

import { useSyncExternalStore } from "react"
import type { Plan } from "@/lib/plans"
import {
  ADMIN_DOMAINS,
  ADMIN_SITES,
  AUDIT_SEED,
  CLIENTS,
  DEFAULT_ROUTING,
  FLAGS_SEED,
  ME,
  PAYMENTS,
  PLAN_SETTINGS_SEED,
  FEEDBACK,
  SUBSCRIPTIONS,
  TEAM,
  type AIStep,
  type AdminDomain,
  type AdminSite,
  type AuditEntry,
  type Client,
  type Payment,
  type PlanSettings,
  type Feedback,
  type ResearchStatus,
  type Role,
  type Subscription,
  type TeamMember,
} from "./data"

/**
 * Everything the admin console can change, kept in sessionStorage so actions stick while the tab is open.
 * Every action writes an audit entry, the same way a real console should.
 */
export interface AdminState {
  v: 1
  clients: Client[]
  sites: AdminSite[]
  subscriptions: Subscription[]
  payments: Payment[]
  domains: AdminDomain[]
  feedback: Feedback[]
  routing: Record<AIStep, string>
  plans: PlanSettings[]
  /** free websites allowed per account; null = no limit (still undecided) */
  freeSiteLimit: number | null
  flags: typeof FLAGS_SEED
  team: TeamMember[]
  notes: Record<string, { text: string; by: string; at: number }[]>
  audit: AuditEntry[]
}

const KEY = "gogetspace-admin-v2"
const SEED: AdminState = {
  v: 1,
  clients: CLIENTS,
  sites: ADMIN_SITES,
  subscriptions: SUBSCRIPTIONS,
  payments: PAYMENTS,
  domains: ADMIN_DOMAINS,
  feedback: FEEDBACK,
  routing: DEFAULT_ROUTING,
  plans: PLAN_SETTINGS_SEED,
  freeSiteLimit: null,
  flags: FLAGS_SEED,
  team: TEAM,
  notes: {
    "budi-santoso": [{ text: "Asked for invoices in IDR. Told him USD only for now.", by: "Dewi Lestari", at: 0 }],
    "frank-tan": [{ text: "Wants Rahma Dental live before Hari Raya promo. Offered help with the brief.", by: "Melissa Chong", at: 0 }],
  },
  audit: AUDIT_SEED,
}

let state: AdminState | null = null
const listeners = new Set<() => void>()

function read(): AdminState {
  if (state) return state
  try {
    const raw = sessionStorage.getItem(KEY)
    const saved = raw ? (JSON.parse(raw) as AdminState) : null
    state = saved?.v === 1 ? saved : SEED
  } catch {
    state = SEED
  }
  return state
}

function write(next: AdminState) {
  state = next
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAdmin() {
  return useSyncExternalStore(subscribe, read, () => SEED)
}

/**
 * Answers from the feedback card after a first build land here, so the admin Feedback page shows them straight
 * away (both live in this browser tab in the prototype).
 */
export function submitFeedback(f: Omit<Feedback, "id" | "hoursAgo" | "at" | "researchStatus">) {
  const s = read()
  write({ ...s, feedback: [{ ...f, id: `fb_${Date.now()}`, hoursAgo: 0, at: Date.now(), researchStatus: "new" }, ...s.feedback] })
}

/* ---------------- toast ---------------- */

let toast: { id: number; message: string; tone: "success" | "info" | "error" } | null = null
const toastListeners = new Set<() => void>()
let timer: number | undefined
export function showToast(message: string, tone: "success" | "info" | "error" = "success") {
  toast = { id: Date.now(), message, tone }
  toastListeners.forEach((l) => l())
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    toast = null
    toastListeners.forEach((l) => l())
  }, 3200)
}
export function useToast() {
  return useSyncExternalStore(
    (l) => {
      toastListeners.add(l)
      return () => toastListeners.delete(l)
    },
    () => toast,
    () => null,
  )
}

/* ---------------- actions ---------------- */

function log(s: AdminState, action: string, target: string, detail?: string): AdminState {
  return { ...s, audit: [{ id: `a${Date.now()}`, minutesAgo: 0, at: Date.now(), actor: ME.name, action, target, detail }, ...s.audit] }
}

const siteName = (s: AdminState, id: string) => s.sites.find((x) => x.id === id)?.name ?? id
const clientName = (s: AdminState, id: string) => s.clients.find((x) => x.id === id)?.name ?? id

export const adminActions = {
  impersonate(clientId: string, reason: string) {
    const s = read()
    write(log(s, "Logged in as client", clientName(s, clientId), reason ? `Reason: ${reason}` : undefined))
  },
  setClientStatus(clientId: string, status: Client["status"], reason: string) {
    let s = read()
    s = {
      ...s,
      clients: s.clients.map((c) => (c.id === clientId ? { ...c, status } : c)),
      // suspending takes the client's live sites offline; reactivating doesn't republish them automatically
      sites: status === "suspended" ? s.sites.map((x) => (x.clientId === clientId && x.status === "live" ? { ...x, status: "suspended" } : x)) : s.sites,
    }
    const label = status === "suspended" ? "Suspended client" : status === "deletion" ? "Scheduled data deletion" : "Reactivated client"
    write(log(s, label, clientName(s, clientId), reason || undefined))
  },
  sendPasswordReset(clientId: string) {
    const s = read()
    write(log(s, "Sent password reset", clientName(s, clientId)))
  },
  verifyEmail(clientId: string) {
    const s = read()
    write(log({ ...s, clients: s.clients.map((c) => (c.id === clientId ? { ...c, verified: true } : c)) }, "Marked email verified", clientName(s, clientId)))
  },
  addNote(clientId: string, text: string) {
    const s = read()
    write(log({ ...s, notes: { ...s.notes, [clientId]: [{ text, by: ME.name, at: Date.now() }, ...(s.notes[clientId] ?? [])] } }, "Added note", clientName(s, clientId)))
  },
  setSiteStatus(siteId: string, status: AdminSite["status"], reason?: string) {
    const s = read()
    const label = status === "suspended" ? "Unpublished website" : status === "live" ? "Republished website" : "Moved website to draft"
    write(log({ ...s, sites: s.sites.map((x) => (x.id === siteId ? { ...x, status, publishedAgo: status === "live" ? 0 : x.publishedAgo } : x)) }, label, siteName(s, siteId), reason))
  },
  grantCredits(siteId: string, amount: number, reason: string) {
    const s = read()
    write(log({ ...s, sites: s.sites.map((x) => (x.id === siteId ? { ...x, bonusCredits: x.bonusCredits + amount } : x)) }, "Granted credits", siteName(s, siteId), `+${amount} credits${reason ? ` · ${reason}` : ""}`))
  },
  rerunFailed(siteId: string) {
    const s = read()
    write(log({ ...s, sites: s.sites.map((x) => (x.id === siteId ? { ...x, failedGenerations: 0 } : x)) }, "Re-ran failed generations", siteName(s, siteId)))
  },
  changePlan(siteId: string, plan: Plan, reason: string) {
    const s = read()
    const from = s.sites.find((x) => x.id === siteId)?.plan
    write(
      log(
        {
          ...s,
          sites: s.sites.map((x) => (x.id === siteId ? { ...x, plan } : x)),
          subscriptions: s.subscriptions.map((x) => (x.siteId === siteId ? { ...x, plan, status: plan === "free" ? "canceled" : x.status } : x)),
        },
        "Changed plan",
        siteName(s, siteId),
        `${from} → ${plan}${reason ? ` · ${reason}` : ""}`,
      ),
    )
  },
  refund(paymentId: string, reason: string) {
    const s = read()
    const p = s.payments.find((x) => x.id === paymentId)
    if (!p) return
    write(log({ ...s, payments: s.payments.map((x) => (x.id === paymentId ? { ...x, status: "refunded" } : x)) }, "Refunded payment", p.siteId ? siteName(s, p.siteId) : clientName(s, p.clientId), `$${p.amount}${reason ? ` · ${reason}` : ""}`))
  },
  retryPayment(paymentId: string) {
    const s = read()
    const p = s.payments.find((x) => x.id === paymentId)
    if (!p) return
    write(
      log(
        {
          ...s,
          payments: s.payments.map((x) => (x.id === paymentId ? { ...x, status: "paid", failure: undefined, daysAgo: 0 } : x)),
          subscriptions: s.subscriptions.map((x) => (x.siteId === p.siteId && x.status === "past_due" ? { ...x, status: "active", renewsIn: 30 } : x)),
        },
        "Retried payment",
        p.siteId ? siteName(s, p.siteId) : clientName(s, p.clientId),
        `$${p.amount} · paid`,
      ),
    )
  },
  cancelSubscription(siteId: string) {
    const s = read()
    write(log({ ...s, subscriptions: s.subscriptions.map((x) => (x.siteId === siteId ? { ...x, status: "canceled" } : x)) }, "Canceled subscription", siteName(s, siteId), "Stays on the plan until the end of the period"))
  },
  recheckDns(name: string) {
    const s = read()
    write(log({ ...s, domains: s.domains.map((d) => (d.name === name ? { ...d, checkedHoursAgo: 0 } : d)) }, "Re-checked DNS", name))
  },
  sendDnsReminder(name: string) {
    const s = read()
    write(log(s, "Sent DNS reminder", name))
  },
  setAutoRenew(name: string, on: boolean) {
    const s = read()
    write(log({ ...s, domains: s.domains.map((d) => (d.name === name ? { ...d, autoRenew: on } : d)) }, on ? "Turned on auto-renew" : "Turned off auto-renew", name))
  },
  renewDomain(name: string) {
    const s = read()
    write(log({ ...s, domains: s.domains.map((d) => (d.name === name ? { ...d, expiresIn: d.expiresIn + 365, health: d.health === "expiring" ? "active" : d.health } : d)) }, "Renewed domain", name, "1 year"))
  },
  reissueSsl(name: string) {
    const s = read()
    write(log({ ...s, domains: s.domains.map((d) => (d.name === name ? { ...d, health: "active" } : d)) }, "Re-issued SSL certificate", name))
  },
  setResearchStatus(id: string, status: ResearchStatus) {
    const s = read()
    const f = s.feedback.find((x) => x.id === id)
    const label = { new: "Reset research status", invited: "Invited to research", scheduled: "Scheduled research call", done: "Finished research call", declined: "Marked research as declined" }[status]
    write(log({ ...s, feedback: s.feedback.map((x) => (x.id === id ? { ...x, researchStatus: status } : x)) }, label, f?.email ?? f?.name ?? id, f ? f.siteName : undefined))
  },
  setRouting(step: AIStep, model: string, labels: { step: string; from: string; to: string }) {
    const s = read()
    write(log({ ...s, routing: { ...s.routing, [step]: model } }, "Changed model routing", labels.step, `${labels.from} → ${labels.to}`))
  },
  savePlans(plans: PlanSettings[], freeSiteLimit: number | null) {
    const s = read()
    const changed = plans.filter((p, i) => JSON.stringify(p) !== JSON.stringify(s.plans[i])).map((p) => p.name)
    const limitChanged = freeSiteLimit !== s.freeSiteLimit
    write(log({ ...s, plans, freeSiteLimit }, "Updated plans", [...changed, ...(limitChanged ? ["Free website limit"] : [])].join(", ") || "No changes"))
  },
  setFlag(id: string, on: boolean) {
    const s = read()
    const f = s.flags.find((x) => x.id === id)
    write(log({ ...s, flags: s.flags.map((x) => (x.id === id ? { ...x, on } : x)) }, on ? "Turned on feature" : "Turned off feature", f?.label ?? id))
  },
  setRole(memberId: string, role: Role) {
    const s = read()
    const m = s.team.find((x) => x.id === memberId)
    write(log({ ...s, team: s.team.map((x) => (x.id === memberId ? { ...x, role } : x)) }, "Changed role", m?.name ?? memberId, `${m?.role} → ${role}`))
  },
  invite(name: string, email: string, role: Role) {
    const s = read()
    write(log({ ...s, team: [...s.team, { id: email, name, email, role, lastActive: "Invited", twoFactor: false }] }, "Invited team member", name, `${email} · ${role}`))
  },
  removeMember(memberId: string) {
    const s = read()
    const m = s.team.find((x) => x.id === memberId)
    write(log({ ...s, team: s.team.filter((x) => x.id !== memberId) }, "Removed team member", m?.name ?? memberId))
  },
  resendEmail(to: string, template: string) {
    const s = read()
    write(log(s, "Resent email", to, template))
  },
  reset() {
    write(SEED)
  },
}

/** minutes since an audit entry or note happened */
export const minutesSince = (e: { minutesAgo?: number; at?: number }) => (e.at ? Math.floor((Date.now() - e.at) / 60000) : e.minutesAgo ?? 0)
