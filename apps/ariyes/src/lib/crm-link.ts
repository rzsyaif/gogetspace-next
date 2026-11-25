"use client"

import { isoDay, stageOf, type ActivityKind, type CrmData, type Project } from "@gogetspace/modules"
import { getCrm } from "@gogetspace/modules/mock"
import { keys, readShared, writeShared } from "./shared"

/**
 * PROTOTYPE GLUE between Appointments and the CRM. The real product does this on the server: when a booking is
 * made, confirmed, moved or cancelled, it's written to the client's history, and a first booking moves their
 * enquiry on to the stage after "New enquiry".
 */
export const crmData = (project: Project) => readShared<CrmData>(keys.crm(project.id), () => getCrm(project.id, new Date()))

/** the CRM client with this name, if there is one (bookings only carry a name in the prototype) */
export function crmClientByName(project: Project, name: string) {
  const key = name.trim().toLowerCase()
  return crmData(project).clients.find((c) => c.name.toLowerCase() === key) ?? null
}

/**
 * Add a line to a client's history. For a booking, a client whose open enquiry is still in the first stage moves
 * to the next one. Returns what changed (or null when the name isn't in the CRM), and how to put it back.
 */
export function logToCrm(project: Project, name: string, kind: ActivityKind, text: string) {
  const before = crmData(project)
  const client = crmClientByName(project, name)
  if (!client) return null
  const at = new Date().toISOString()
  const open = before.enquiries.find((e) => e.clientId === client.id && stageOf(before, e.stageId)?.kind === "open")
  const first = before.settings.stages[0]
  const next = before.settings.stages[1]
  const advance = kind === "booking" && open && open.stageId === first?.id && next?.kind === "open" ? next : null
  const id = () => `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`
  const after: CrmData = {
    ...before,
    enquiries: before.enquiries.map((e) =>
      e.id === open?.id ? { ...e, updatedAt: at, stageId: advance ? advance.id : e.stageId, nextStep: advance && e.nextStep?.due === isoDay(new Date()) ? undefined : e.nextStep } : e,
    ),
    activity: [
      ...before.activity,
      { id: id(), clientId: client.id, enquiryId: open?.id, at, kind, text },
      ...(advance ? [{ id: id(), clientId: client.id, enquiryId: open?.id, at, kind: "stage" as const, text: `${advance.name} (after the booking)` }] : []),
    ],
  }
  writeShared(keys.crm(project.id), after)
  return { client, movedTo: advance?.name ?? null, undo: () => writeShared(keys.crm(project.id), before) }
}
