"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { isoDay, stageOf, type CrmActivity, type CrmData, type CrmEnquiry, type CrmSettings, type LeadSource, type Project } from "@gogetspace/modules"
import { getCrm } from "@gogetspace/modules/mock"
import { useMounted } from "../use-media"

export interface NewLead {
  name: string
  phone?: string
  email?: string
  companyId?: string
  title: string
  value?: number
  source: LeadSource
}

interface Toast {
  message: string
  undo?: () => void
}

interface Crm {
  project: Project
  /** null until the page runs in the browser: dates come from the viewer's clock */
  data: CrmData | null
  now: Date
  currency: string
  moveTo: (enquiryId: string, stageId: string, lostReason?: string) => void
  setNextStep: (enquiryId: string, next: CrmEnquiry["nextStep"]) => void
  /** done with today's follow-up: clears the next step and counts as activity */
  markDone: (enquiryId: string) => void
  snooze: (enquiryId: string, days: number) => void
  addNote: (clientId: string, text: string, enquiryId?: string) => void
  addLead: (lead: NewLead) => string
  saveSettings: (s: CrmSettings, message: string) => void
  /** the client whose details panel is open */
  openClient: string | null
  setOpenClient: (id: string | null) => void
  openCompany: string | null
  setOpenCompany: (id: string | null) => void
  addOpen: boolean
  setAddOpen: (open: boolean) => void
  toast: Toast | null
  setToast: (t: Toast | null) => void
}

const Ctx = createContext<Crm | null>(null)

export function useCrm() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useCrm outside CrmProvider")
  return c
}

/**
 * The CRM's state for every page under /[project]/crm. Changes are local to the prototype: each action is where a
 * real app calls its API. Moves and edits show a toast with Undo.
 */
export function CrmProvider({ project, children }: { project: Project; children: ReactNode }) {
  const mounted = useMounted()
  const now = useMemo(() => new Date(), [])
  const [data, setData] = useState<CrmData | null>(null)
  const [openClient, setOpenClient] = useState<string | null>(null)
  const [openCompany, setOpenCompany] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // the seed depends on today's date, so it's made in the browser
  if (mounted && !data) setData(getCrm(project.id, now))

  const stamp = () => new Date().toISOString()
  const log = (d: CrmData, a: Omit<CrmActivity, "id" | "at">): CrmActivity[] => [...d.activity, { ...a, id: `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`, at: stamp() }]
  /** apply a change, with a toast that can put things back */
  const change = (fn: (d: CrmData) => CrmData, message: string) => {
    if (!data) return
    const before = data
    setData(fn(data))
    setToast({ message, undo: () => setData(before) })
  }
  const patch = (d: CrmData, id: string, p: Partial<CrmEnquiry>) => d.enquiries.map((e) => (e.id === id ? { ...e, ...p } : e))
  const nameOf = (d: CrmData, enquiryId: string) => {
    const e = d.enquiries.find((x) => x.id === enquiryId)
    return d.clients.find((c) => c.id === e?.clientId)?.name ?? "Client"
  }

  const value: Crm = {
    project,
    data,
    now,
    currency: project.currency,
    moveTo: (id, stageId, lostReason) =>
      change(
        (d) => {
          const e = d.enquiries.find((x) => x.id === id)!
          const st = stageOf(d, stageId)!
          const closed = st.kind !== "open"
          return {
            ...d,
            enquiries: patch(d, id, { stageId, updatedAt: stamp(), closedAt: closed ? stamp() : undefined, lostReason: st.kind === "lost" ? lostReason : undefined, nextStep: closed ? undefined : e.nextStep }),
            activity: log(d, { clientId: e.clientId, enquiryId: id, kind: "stage", text: st.kind === "lost" && lostReason ? `${st.name}: ${lostReason.toLowerCase()}` : st.name }),
          }
        },
        data ? `Moved ${nameOf(data, id)} to ${stageOf(data, stageId)?.name}` : "",
      ),
    setNextStep: (id, next) =>
      change(
        (d) => ({ ...d, enquiries: patch(d, id, { nextStep: next, snoozedUntil: undefined }) }),
        next ? `Next step set for ${data ? nameOf(data, id) : ""}` : "Next step cleared",
      ),
    markDone: (id) =>
      change((d) => {
        const e = d.enquiries.find((x) => x.id === id)!
        return {
          ...d,
          enquiries: patch(d, id, { nextStep: undefined, updatedAt: stamp(), snoozedUntil: undefined }),
          activity: log(d, { clientId: e.clientId, enquiryId: id, kind: "note", text: e.nextStep ? `Done: ${e.nextStep.text.toLowerCase()}` : "Followed up" }),
        }
      }, `Followed up with ${data ? nameOf(data, id) : ""}`),
    snooze: (id, days) =>
      change(
        (d) => ({ ...d, enquiries: patch(d, id, { snoozedUntil: isoDay(new Date(Date.now() + days * 86400000)) }) }),
        `Snoozed ${data ? nameOf(data, id) : ""} until ${days === 1 ? "tomorrow" : `${days} days from now`}`,
      ),
    addNote: (clientId, text, enquiryId) =>
      change(
        (d) => ({
          ...d,
          enquiries: enquiryId ? patch(d, enquiryId, { updatedAt: stamp() }) : d.enquiries,
          activity: log(d, { clientId, enquiryId, kind: "note", text }),
        }),
        "Note added",
      ),
    addLead: (lead) => {
      const cid = `c${Date.now()}`
      const eid = `e${Date.now()}`
      change(
        (d) => ({
          ...d,
          clients: [...d.clients, { id: cid, name: lead.name, phone: lead.phone, email: lead.email, companyId: lead.companyId, source: lead.source, createdAt: stamp() }],
          enquiries: [...d.enquiries, { id: eid, clientId: cid, title: lead.title, value: lead.value, stageId: d.settings.stages[0].id, updatedAt: stamp(), nextStep: { text: "Get in touch", due: isoDay(new Date()) } }],
          activity: log(d, { clientId: cid, enquiryId: eid, kind: "enquiry", text: `Added by you: ${lead.title}` }),
        }),
        `Added ${lead.name}`,
      )
      return cid
    },
    saveSettings: (s, message) => change((d) => ({ ...d, settings: s }), message),
    openClient,
    setOpenClient,
    openCompany,
    setOpenCompany,
    addOpen,
    setAddOpen,
    toast,
    setToast,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
