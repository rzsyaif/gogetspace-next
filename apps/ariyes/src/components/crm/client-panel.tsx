"use client"

import { useState } from "react"
import { ArrowRightLeft, CalendarPlus, Flag, Mail, MessageSquareText, Phone, PhoneCall, Send, Sparkles } from "lucide-react"
import { Avatar, Button, Drawer, DrawerContent, Field, Input, Select, Textarea, buttonVariants } from "@gogetspace/baseplate"
import { LOST_REASONS, SOURCES, ago, isoDay, stageOf, type ActivityKind, type CrmEnquiry } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"
import { useCrm } from "./crm-store"
import { ClientAppointments } from "./client-appointments"
import { Value } from "./bits"

const ICON: Record<ActivityKind, typeof Mail> = {
  enquiry: Sparkles,
  booking: CalendarPlus,
  note: MessageSquareText,
  call: PhoneCall,
  email: Send,
  stage: ArrowRightLeft,
}

/** one enquiry: its stage (changeable without dragging), value, and next step */
function EnquiryCard({ e }: { e: CrmEnquiry }) {
  const { data, now, moveTo, setNextStep } = useCrm()
  const d = data!
  const [stage, setStage] = useState(e.stageId)
  const [reason, setReason] = useState(LOST_REASONS[0])
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(e.nextStep?.text ?? "")
  const [due, setDue] = useState(e.nextStep?.due ?? isoDay(new Date(now.getTime() + 2 * 86400000)))
  const lost = stageOf(d, stage)?.kind === "lost" && stage !== e.stageId
  const today = isoDay(now)
  const open = stageOf(d, e.stageId)?.kind === "open"

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line-default bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 type-label-lg text-fg-primary">{e.title}</p>
        <Value e={e} className="shrink-0 type-label-md text-fg-primary" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="type-caption text-fg-tertiary">Stage</span>
        <Select ariaLabel={`Stage of ${e.title}`} value={stage} onValueChange={(v) => {
            setStage(v)
            // lost asks why first; any other stage moves at once
            if (v !== e.stageId && stageOf(d, v)?.kind !== "lost") moveTo(e.id, v)
          }} options={d.settings.stages.map((s) => ({ value: s.id, label: s.name }))} className="h-10 px-3" />
        {lost && (
          <div className="flex flex-col gap-2 rounded-md bg-subtle p-3">
            <span className="type-label-sm text-fg-primary">Why not?</span>
            <div className="flex gap-2">
              <Select ariaLabel="Reason" value={reason} onValueChange={setReason} options={LOST_REASONS.map((r) => ({ value: r, label: r }))} className="h-10 min-w-0 flex-1 px-3" />
              <Button size="sm" onClick={() => moveTo(e.id, stage, reason)}>
                Move
              </Button>
            </div>
          </div>
        )}
        {e.lostReason && <p className="type-body-sm text-fg-secondary">Reason: {e.lostReason}</p>}
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t border-line-default pt-3">
          <span className="type-caption text-fg-tertiary">Next step</span>
          {editing ? (
            <div className="flex flex-col gap-2">
              <Input aria-label="Next step" value={text} onChange={(ev) => setText(ev.target.value)} placeholder="e.g. Call back about the quote" maxLength={120} />
              <div className="flex flex-wrap items-center gap-2">
                <Input aria-label="Due" type="date" value={due} min={today} onChange={(ev) => setDue(ev.target.value)} className="w-auto" />
                <span className="flex-1" />
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!text.trim() || !due}
                  onClick={() => {
                    setNextStep(e.id, { text: text.trim(), due })
                    setEditing(false)
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : e.nextStep ? (
            <div className="flex items-start justify-between gap-3">
              <p className={cn("flex items-start gap-2 type-body-md", e.nextStep.due < today ? "text-status-error-text" : "text-fg-primary")}>
                <Flag aria-hidden className="mt-1 size-4 shrink-0" />
                <span>
                  {e.nextStep.text}
                  <span className="block type-body-sm text-fg-secondary">
                    {e.nextStep.due < today ? "Overdue, was due " : e.nextStep.due === today ? "Due " : "Due "}
                    {e.nextStep.due === today ? "today" : new Date(`${e.nextStep.due}T00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                </span>
              </p>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Change
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="flex w-fit items-center gap-1.5 rounded-sm px-1 py-1 type-label-md text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
              <Flag aria-hidden className="size-4" /> Set a next step
            </button>
          )}
        </div>
      )}
    </li>
  )
}

/**
 * A client's details, in a side panel over any CRM page: how to reach them, their enquiries (stage, value, next
 * step), a note box, and everything that has happened with them.
 */
export function ClientPanel() {
  const { data, now, openClient, setOpenClient, addNote } = useCrm()
  const [note, setNote] = useState("")
  const c = data && openClient ? data.clients.find((x) => x.id === openClient) : null
  const company = c?.companyId ? data!.companies.find((x) => x.id === c.companyId) : null
  const enquiries = c ? data!.enquiries.filter((e) => e.clientId === c.id) : []
  const history = c ? data!.activity.filter((a) => a.clientId === c.id).sort((a, b) => (a.at < b.at ? 1 : -1)) : []

  return (
    <Drawer
      open={!!c}
      onOpenChange={(o) => {
        if (!o) {
          setOpenClient(null)
          setNote("")
        }
      }}
    >
      {c && (
        <DrawerContent
          title={c.name}
          className="w-[min(460px,calc(100vw-24px))]"
          header={
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size="lg" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate type-h5 text-fg-primary">{c.name}</span>
                <span className="truncate type-body-sm text-fg-secondary">
                  {company ? `${company.name} · ` : ""}
                  {SOURCES.find((s) => s.id === c.source)?.label} · since {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-6 px-1 pb-6">
            <div className="flex flex-wrap gap-2">
              {c.phone && (
                <a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  <Phone aria-hidden className="size-4" /> {c.phone}
                </a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "max-w-full")}>
                  <Mail aria-hidden className="size-4 shrink-0" /> <span className="truncate">{c.email}</span>
                </a>
              )}
            </div>

            <section className="flex flex-col gap-3">
              <h3 className="type-label-lg text-fg-primary">{enquiries.length === 1 ? "Enquiry" : "Enquiries"}</h3>
              <ul className="flex flex-col gap-3">
                {enquiries.map((e) => (
                  <EnquiryCard key={`${e.id}-${e.stageId}-${e.nextStep?.text}-${e.nextStep?.due}`} e={e} />
                ))}
              </ul>
            </section>

            <ClientAppointments key={c.id} client={c} />

            <section className="flex flex-col gap-3">
              <h3 className="type-label-lg text-fg-primary">History</h3>
              <Field label={<span className="sr-only">Add a note</span>}>
                <Textarea rows={2} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Add a note, e.g. what you talked about" />
              </Field>
              {note.trim() && (
                <Button
                  size="sm"
                  className="self-end"
                  onClick={() => {
                    addNote(c.id, note.trim(), enquiries.find((e) => stageOf(data!, e.stageId)?.kind === "open")?.id)
                    setNote("")
                  }}
                >
                  Add note
                </Button>
              )}
              <ol className="flex flex-col">
                {history.map((a, i) => {
                  const Icon = ICON[a.kind]
                  return (
                    <li key={a.id} className="relative flex gap-3 pb-4">
                      {i < history.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-[15px] w-px bg-line-default" />}
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-fg-secondary">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-col pt-1">
                        <span className="type-body-md text-fg-primary">{a.text}</span>
                        <span className="type-caption text-fg-tertiary">{ago(a.at, now)}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          </div>
        </DrawerContent>
      )}
    </Drawer>
  )
}
