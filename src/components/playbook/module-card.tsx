"use client"

import { Check, FlaskConical, Info, Plus } from "lucide-react"
import { Badge, Button } from "@/components/ui"
import { cn } from "@/lib/cn"
import type { Decision } from "@/lib/playbooks/engine"
import type { ModuleDef } from "@/lib/playbooks/types"

export const priceLabel = (m: ModuleDef) => (m.price > 0 ? `$${m.price}/mo` : "Free")

/**
 * One add-on module: what it does for the owner's goal, what's included, its own monthly price for this website,
 * and the Add / Not now choice. Used on the plan card, the patch card and the editor's Modules tab.
 */
export function ModuleCard({
  m,
  goal,
  decision,
  onDecide,
  note,
  status,
  compact,
  actions,
}: {
  m: ModuleDef
  /** the goal it's offered for (picks the benefit line) */
  goal?: string
  decision?: Decision
  onDecide?: (d: Decision) => void
  /** dependency or consent note under the card */
  note?: string
  /** shown instead of the Add buttons (e.g. in the editor) */
  status?: "live" | "test"
  compact?: boolean
  actions?: React.ReactNode
}) {
  const benefit = (goal && m.benefit[goal]) || Object.values(m.benefit)[0]
  const on = decision === "added"
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border bg-surface p-3 transition-colors sm:p-4",
        on ? "border-blue-300 ring-2 ring-blue-100" : "border-line-default",
        decision === "later" && "bg-subtle",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex flex-wrap items-center gap-2">
            <span className="type-label-md text-fg-primary">{m.name}</span>
            {status === "live" && <Badge tone="success">Live</Badge>}
            {status === "test" && <Badge tone="warning">Test mode</Badge>}
          </p>
          {benefit && <p className="type-body-sm text-fg-secondary">{benefit}</p>}
        </div>
        <span className="shrink-0 type-label-md text-fg-primary tabular-nums">{priceLabel(m)}</span>
      </div>
      {!compact && (
        <ul className="flex flex-col gap-1">
          {m.included.map((x) => (
            <li key={x} className="flex items-start gap-2 type-body-sm text-fg-secondary">
              <Check className="mt-0.5 size-3.5 shrink-0 text-fg-tertiary" />
              {x}
            </li>
          ))}
        </ul>
      )}
      {m.needsAccount && !status && (
        <p className="flex items-start gap-2 type-caption text-fg-tertiary">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
          {m.needsAccount.testMode}
        </p>
      )}
      {m.sensitive && !compact && (
        <p className="flex items-start gap-2 type-caption text-fg-tertiary">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {m.sensitive}
        </p>
      )}
      {note && <p className="type-caption text-status-warning-text">{note}</p>}
      {onDecide && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={on ? "primary" : "secondary"} leadingIcon={on ? <Check /> : <Plus />} aria-pressed={on} onClick={() => onDecide("added")}>
            {on ? "Added" : "Add"}
          </Button>
          <Button size="sm" variant="ghost" aria-pressed={decision === "later"} onClick={() => onDecide("later")} className={cn(decision === "later" && "bg-muted")}>
            Not now
          </Button>
        </div>
      )}
      {actions}
    </div>
  )
}
