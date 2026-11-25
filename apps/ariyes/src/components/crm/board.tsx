"use client"

import { useState, type DragEvent } from "react"
import { AlertCircle, CalendarClock } from "lucide-react"
import { Button, Dialog, DialogContent } from "@gogetspace/baseplate"
import { LOST_REASONS, ago, daysBetween, formatMoney, isOpen, isoDay, type CrmEnquiry, type CrmStage } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"
import { useCrm } from "./crm-store"
import { stageTone, Value } from "./bits"

/** won and lost columns only show what closed in the last 30 days, so they don't grow forever */
const CLOSED_WINDOW_DAYS = 30

/** one enquiry on the board */
function Card({ e, onDragStart, dragging }: { e: CrmEnquiry; onDragStart: (ev: DragEvent, id: string) => void; dragging: boolean }) {
  const { data, now, setOpenClient } = useCrm()
  const client = data!.clients.find((c) => c.id === e.clientId)!
  const open = isOpen(data!, e)
  const today = isoDay(now)
  const late = e.nextStep && e.nextStep.due < today
  const quiet = daysBetween(new Date(e.updatedAt), now)
  return (
    <button
      type="button"
      draggable
      onDragStart={(ev) => onDragStart(ev, e.id)}
      onClick={() => setOpenClient(client.id)}
      aria-label={`${client.name}, ${e.title}. Open details`}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-md border border-line-default bg-surface p-3 text-left shadow-block-sm transition-[opacity,border-color,translate] duration-150 ease-out hover:border-line-strong focus-visible:outline-none focus-visible:focus-ring active:translate-y-px [@media(pointer:fine)]:cursor-grab",
        dragging && "opacity-40",
        !open && "shadow-none",
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate type-label-md text-fg-primary">{client.name}</span>
        <Value e={e} className="shrink-0 type-body-sm text-fg-secondary" />
      </span>
      <span className="truncate type-body-sm text-fg-secondary">{e.title}</span>
      {open ? (
        e.nextStep ? (
          <span className={cn("flex items-center gap-1 type-caption", late ? "text-status-error-text" : e.nextStep.due === today ? "text-status-warning-text" : "text-fg-tertiary")}>
            <CalendarClock aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">
              {e.nextStep.text}
              {late ? " · overdue" : e.nextStep.due === today ? " · today" : ""}
            </span>
          </span>
        ) : (
          <span className={cn("flex items-center gap-1 type-caption", quiet >= data!.settings.quietDays ? "text-status-warning-text" : "text-fg-tertiary")}>
            {quiet >= data!.settings.quietDays && <AlertCircle aria-hidden className="size-3.5 shrink-0" />}
            {quiet === 0 ? "Active today" : `Last activity ${ago(e.updatedAt, now)}`}
          </span>
        )
      ) : (
        <span className="type-caption text-fg-tertiary">
          {e.lostReason ? `${e.lostReason} · ` : ""}
          {e.closedAt ? ago(e.closedAt, now) : ""}
        </span>
      )}
    </button>
  )
}

/**
 * The pipeline as a kanban board: one column per stage, with how many enquiries and their total value. Drag a card
 * to another column to move it (moving to the lost stage asks why); click it for the client's details, where the
 * stage can also be changed without dragging.
 */
export function Board({ height }: { /** cap the board's height (the home page); columns scroll inside */ height?: number }) {
  const { data, now, currency, moveTo } = useCrm()
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [lost, setLost] = useState<{ id: string; stage: CrmStage } | null>(null)
  const [reason, setReason] = useState(LOST_REASONS[0])
  if (!data) return <div className="h-80 animate-pulse rounded-lg bg-subtle" />

  const since = now.getTime() - CLOSED_WINDOW_DAYS * 86400000
  const inColumn = (s: CrmStage) =>
    data.enquiries
      .filter((e) => e.stageId === s.id && (s.kind === "open" || !e.closedAt || new Date(e.closedAt).getTime() >= since))
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))

  const drop = (s: CrmStage) => {
    const id = dragId
    setDragId(null)
    setOver(null)
    if (!id) return
    const e = data.enquiries.find((x) => x.id === id)
    if (!e || e.stageId === s.id) return
    if (s.kind === "lost") {
      setReason(LOST_REASONS[0])
      setLost({ id, stage: s })
    } else moveTo(id, s.id)
  }

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <ol className="flex gap-3" style={height ? { height } : undefined}>
          {data.settings.stages.map((s) => {
            const cards = inColumn(s)
            const total = cards.reduce((n, e) => n + (e.value ?? 0), 0)
            return (
              <li
                key={s.id}
                onDragOver={(ev) => {
                  if (!dragId) return
                  ev.preventDefault()
                  setOver(s.id)
                }}
                onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
                onDrop={(ev) => {
                  ev.preventDefault()
                  drop(s)
                }}
                className={cn(
                  "flex w-[272px] shrink-0 flex-col rounded-lg border bg-subtle transition-colors duration-150",
                  over === s.id ? "border-blue-400 bg-accent-blue-subtle" : "border-transparent",
                  !height && "min-h-[420px]",
                )}
              >
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", stageTone(data, s.id))} />
                  <h3 className="min-w-0 flex-1 truncate type-label-md text-fg-primary">{s.name}</h3>
                  <span className="type-label-sm text-fg-tertiary tabular-nums">{cards.length}</span>
                </div>
                <p className="px-3 pb-2 type-caption text-fg-tertiary tabular-nums">
                  {total ? formatMoney(total, currency) : "No value yet"}
                  {s.kind !== "open" && ` · last ${CLOSED_WINDOW_DAYS} days`}
                </p>
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {cards.map((e) => (
                    <Card
                      key={e.id}
                      e={e}
                      dragging={dragId === e.id}
                      onDragStart={(ev, id) => {
                        ev.dataTransfer.effectAllowed = "move"
                        ev.dataTransfer.setData("text/plain", id)
                        setDragId(id)
                      }}
                    />
                  ))}
                  {!cards.length && <p className="rounded-md border border-dashed border-line-strong px-3 py-6 text-center type-body-sm text-fg-tertiary">Drop an enquiry here</p>}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <Dialog open={!!lost} onOpenChange={(o) => !o && setLost(null)}>
        {lost && (
          <DialogContent
            title={`Why isn't ${data.clients.find((c) => c.id === data.enquiries.find((e) => e.id === lost.id)?.clientId)?.name ?? "this client"} going ahead?`}
            description="One tap is enough. It helps you see why enquiries don't turn into clients."
            footer={
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button variant="secondary" onClick={() => setLost(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    moveTo(lost.id, lost.stage.id, reason)
                    setLost(null)
                  }}
                >
                  Move to {lost.stage.name}
                </Button>
              </div>
            }
          >
            <div role="radiogroup" aria-label="Reason" className="flex flex-wrap gap-2">
              {LOST_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={reason === r}
                  onClick={() => setReason(r)}
                  className={cn(
                    "h-10 rounded-full border px-4 type-label-md transition-colors duration-150 focus-visible:outline-none focus-visible:focus-ring",
                    reason === r ? "border-blue-500 bg-accent-blue-subtle text-fg-link" : "border-line-default text-fg-primary hover:border-line-strong",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
