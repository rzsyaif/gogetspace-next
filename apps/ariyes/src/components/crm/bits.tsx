"use client"

import { formatMoney, crmStats, followUps, stageOf, type CrmData, type CrmEnquiry } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"
import { useCrm } from "./crm-store"

/** a stage's colour: open stages in blue, won in green, lost in grey */
export function stageTone(d: CrmData, stageId: string) {
  const kind = stageOf(d, stageId)?.kind
  return kind === "won" ? "bg-status-success-solid" : kind === "lost" ? "bg-neutral-400" : "bg-blue-500"
}

export function StageLabel({ d, stageId, className }: { d: CrmData; stageId: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 type-body-sm text-fg-secondary", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", stageTone(d, stageId))} />
      {stageOf(d, stageId)?.name ?? "—"}
    </span>
  )
}

export function Value({ e, className }: { e: Pick<CrmEnquiry, "value">; className?: string }) {
  const { currency } = useCrm()
  if (e.value == null) return <span className={cn("text-fg-tertiary", className)}>No value</span>
  return <span className={cn("tabular-nums", className)}>{formatMoney(e.value, currency)}</span>
}

/** the few numbers worth watching, in one line */
export function StatsStrip({ className }: { className?: string }) {
  const { data, now, currency } = useCrm()
  if (!data) return null
  const s = crmStats(data, now)
  const due = followUps(data, now).length
  const items = [
    { label: "Open", value: formatMoney(s.openValue, currency), sub: `${s.open} enquiries` },
    { label: "Won this month", value: formatMoney(s.wonValue, currency), sub: `${s.won} ${s.won === 1 ? "client" : "clients"}` },
    { label: "Conversion", value: s.conversion == null ? "—" : `${Math.round(s.conversion * 100)}%`, sub: "last 90 days" },
    { label: "To follow up", value: String(due), sub: due === 1 ? "person" : "people" },
  ]
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 flex-col">
          <dt className="type-caption text-fg-tertiary">{it.label}</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className="type-label-lg text-fg-primary tabular-nums">{it.value}</span>
            <span className="type-caption text-fg-tertiary">{it.sub}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** a section on a page: heading, an optional link or action on the right, then the content */
export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-h6 text-fg-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
