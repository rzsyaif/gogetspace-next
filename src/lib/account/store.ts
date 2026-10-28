"use client"

import { useSyncExternalStore } from "react"
import type { Plan } from "@/lib/plans"
import { planInfo } from "@/lib/plans"
import { ENQUIRIES, INVOICES, SITES, type EnquiryStatus, type Invoice, type Site } from "./data"

/**
 * The signed-in account's websites, enquiry statuses and invoices. A tiny external store shared by the
 * dashboard and the editor, kept in sessionStorage so a plan change shows up everywhere until the tab closes.
 */
export interface AccountState {
  v: 1
  sites: Site[]
  enquiryStatus: Record<string, EnquiryStatus>
  invoices: Invoice[]
}

const KEY = "gogetspace-account"
const SEED: AccountState = {
  v: 1,
  sites: SITES,
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
    state = saved?.v === 1 ? saved : SEED
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
  /** each website has its own plan; upgrading bills the difference today */
  setPlan(siteId: string, plan: Plan) {
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
              description: `${info.name} plan · ${MONTH.format(new Date())}`,
              amount: info.price,
              status: "paid" as const,
            },
            ...s.invoices,
          ]
        : s.invoices
    write({
      ...s,
      invoices,
      sites: s.sites.map((x) => (x.id === siteId ? { ...x, plan, renews: info.price > 0 ? x.renews ?? "28 Nov 2026" : undefined } : x)),
    })
  },
  setEnquiryStatus(id: string, status: EnquiryStatus) {
    const s = read()
    write({ ...s, enquiryStatus: { ...s.enquiryStatus, [id]: status } })
  },
  connectDomain(siteId: string, name: string) {
    const s = read()
    write({ ...s, sites: s.sites.map((x) => (x.id === siteId ? { ...x, domain: { name, status: "pending" } } : x)) })
  },
  reset() {
    write(SEED)
  },
}
