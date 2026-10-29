"use client"

import { useSyncExternalStore } from "react"
import type { Plan } from "@/lib/plans"
import { planInfo } from "@/lib/plans"
import { ENQUIRIES, INVOICES, OWNED_DOMAINS, SITES, type EnquiryStatus, type Invoice, type OwnedDomain, type Site } from "./data"

/**
 * The signed-in account's websites, enquiry statuses and invoices. A tiny external store shared by the
 * dashboard and the editor, kept in sessionStorage so a plan change shows up everywhere until the tab closes.
 */
export interface AccountState {
  v: 2
  sites: Site[]
  /** domains bought through GoGetSpace (used or not) */
  domains: OwnedDomain[]
  enquiryStatus: Record<string, EnquiryStatus>
  invoices: Invoice[]
}

const KEY = "gogetspace-account"
const SEED: AccountState = {
  v: 2,
  sites: SITES,
  domains: OWNED_DOMAINS,
  enquiryStatus: Object.fromEntries(ENQUIRIES.map((e) => [e.id, e.status])),
  invoices: INVOICES,
}

let state: AccountState | null = null
const listeners = new Set<() => void>()

function read(): AccountState {
  if (state) return state
  try {
    const raw = sessionStorage.getItem(KEY)
    const saved = raw ? (JSON.parse(raw) as AccountState) : null
    state = saved?.v === 2 ? saved : SEED
  } catch {
    state = SEED
  }
  return state
}

function write(next: AccountState) {
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

export function useAccountState() {
  return useSyncExternalStore(subscribe, read, () => SEED)
}

export function useSite(id: string) {
  return useAccountState().sites.find((s) => s.id === id) ?? null
}

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long" })

export const accountActions = {
  /** each website has its own plan; upgrading starts today and bills `charge` (the prorated difference) */
  setPlan(siteId: string, plan: Plan, charge?: number) {
    const s = read()
    const site = s.sites.find((x) => x.id === siteId)
    if (!site || site.plan === plan) return
    const info = planInfo(plan)
    const invoices =
      info.price > 0
        ? [
            {
              id: `INV-${siteId.slice(0, 4).toUpperCase()}-${s.invoices.length + 1}`,
              date: "Today",
              siteId,
              description: `${info.name} plan${charge !== undefined && charge !== info.price ? " · prorated upgrade" : ""} · ${MONTH.format(new Date())}`,
              amount: charge ?? info.price,
              status: "paid" as const,
            },
            ...s.invoices,
          ]
        : s.invoices
    write({
      ...s,
      invoices,
      sites: s.sites.map((x) => (x.id === siteId ? { ...x, plan, scheduledPlan: undefined, renews: info.price > 0 ? x.renews ?? "29 Nov 2026" : undefined } : x)),
    })
  },
  /** downgrades wait for the end of the period that's already paid for */
  schedulePlan(siteId: string, plan: Plan) {
    const s = read()
    write({ ...s, sites: s.sites.map((x) => (x.id === siteId && x.renews ? { ...x, scheduledPlan: { plan, on: x.renews } } : x)) })
  },
  cancelScheduledPlan(siteId: string) {
    const s = read()
    write({ ...s, sites: s.sites.map((x) => (x.id === siteId ? { ...x, scheduledPlan: undefined } : x)) })
  },
  setEnquiryStatus(id: string, status: EnquiryStatus) {
    const s = read()
    write({ ...s, enquiryStatus: { ...s.enquiryStatus, [id]: status } })
  },
  /** a domain bought elsewhere: "pending" until its DNS records are found, then "connected" */
  connectDomain(siteId: string, name: string, status: "pending" | "connected" = "pending") {
    const s = read()
    write({ ...s, sites: s.sites.map((x) => (x.id === siteId ? { ...x, domain: { name, status } } : x)) })
  },
  /** register a domain for `years`; optionally point it at a website straight away */
  buyDomain(name: string, years: number, price: number, siteId: string | null) {
    const s = read()
    const today = new Date()
    const expires = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(today.getFullYear() + years, today.getMonth(), today.getDate()))
    write({
      ...s,
      domains: [{ name, siteId: null, expires, autoRenew: true }, ...s.domains.filter((d) => d.name !== name)],
      invoices: [
        { id: `DOM-${s.invoices.length + 1}`, date: "Today", siteId: siteId ?? "", description: `${name} · ${years} ${years === 1 ? "year" : "years"}`, amount: price * years, status: "paid" as const },
        ...s.invoices,
      ],
    })
    if (siteId) accountActions.assignDomain(siteId, name)
  },
  /** point a domain the account owns at a website; bought here, so it connects without DNS steps */
  assignDomain(siteId: string, name: string) {
    const s = read()
    write({
      ...s,
      // the site's previous GoGetSpace domain becomes unused again
      domains: s.domains.map((d) => (d.name === name ? { ...d, siteId } : d.siteId === siteId ? { ...d, siteId: null } : d)),
      sites: s.sites.map((x) => (x.id === siteId ? { ...x, domain: { name, status: "connected" } } : x)),
    })
  },
  disconnectDomain(siteId: string) {
    const s = read()
    write({
      ...s,
      domains: s.domains.map((d) => (d.siteId === siteId ? { ...d, siteId: null } : d)),
      sites: s.sites.map((x) => (x.id === siteId ? { ...x, domain: null } : x)),
    })
  },
  reset() {
    write(SEED)
  },
}
