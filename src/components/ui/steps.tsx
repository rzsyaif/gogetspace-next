import type { ReactNode } from "react"
import { AlertTriangle, Check, CircleAlert, Loader, X } from "lucide-react"
import { cn } from "@/lib/cn"

export type StepStatus = "done" | "running" | "failed" | "warning" | "pending"

/** Round status marker for a step: done, running, failed, warning or pending. */
export function StepIndicator({ status }: { status: StepStatus }) {
  const base = "relative z-[1] grid size-6 shrink-0 place-items-center rounded-full [&_svg]:size-3.5"
  if (status === "done")
    return (
      <span className={cn(base, "bg-accent-blue-subtle text-blue-600")}>
        <Check strokeWidth={2.5} aria-label="Done" />
      </span>
    )
  if (status === "running")
    return (
      <span className={cn(base, "border border-dashed border-blue-500 bg-canvas text-blue-500")}>
        <Loader className="animate-[spin_2.4s_linear_infinite]" aria-label="In progress" />
      </span>
    )
  if (status === "failed")
    return (
      <span className={cn(base, "bg-status-error-bg text-status-error-text")}>
        <X strokeWidth={2.5} aria-label="Failed" />
      </span>
    )
  if (status === "warning")
    return (
      <span className={cn(base, "bg-status-warning-bg text-status-warning-text")}>
        <AlertTriangle aria-label="Done with a warning" />
      </span>
    )
  return <span className={cn(base, "border border-line-strong bg-surface")} aria-label="Not started" />
}

/** Vertical list of steps; each marker is joined to the next by a line that runs the full height of the step. */
export function StepList({ children, className }: { children: ReactNode; className?: string }) {
  return <ol className={cn("flex flex-col", className)}>{children}</ol>
}

/**
 * One step. `connector` draws the line down to the next marker: "active" (reached) or "idle" (still to come);
 * leave it out on the last step.
 */
export function Step({
  status,
  indicator,
  connector,
  current,
  children,
}: {
  status?: StepStatus
  /** custom marker (e.g. a number); defaults to the status indicator */
  indicator?: ReactNode
  connector?: "active" | "idle"
  current?: boolean
  children: ReactNode
}) {
  return (
    <li className="flex gap-3" aria-current={current ? "step" : undefined}>
      <div className="flex w-6 shrink-0 flex-col items-center">
        {indicator ?? <StepIndicator status={status ?? "pending"} />}
        {connector && <span aria-hidden className={cn("w-px flex-1", connector === "active" ? "bg-blue-300" : "bg-line-default")} />}
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", connector && "pb-4")}>{children}</div>
    </li>
  )
}

export interface StepperStep {
  title: string
  /** small line under the title ("Confirmed", "Awaiting confirmation"…) */
  caption?: string
  /** done shows a check; warning a caution mark; current is highlighted */
  state: "done" | "current" | "upcoming" | "warning"
  /** colour of the caption (and the check/caution mark) regardless of position, e.g. a confirmed current step */
  tone?: "success" | "warning"
}

/**
 * Horizontal stepper (the review sheet's footer, the domain purchase): a progress line above each step that turns
 * blue once reached, title + caption below. Pass `onSelect` to make reached steps clickable.
 */
export function Stepper({ steps, label, onSelect, className }: { steps: StepperStep[]; label: string; onSelect?: (index: number) => void; className?: string }) {
  const current = steps.findIndex((s) => s.state === "current")
  return (
    <ol aria-label={label} className={cn("flex w-full items-start", className)}>
      {steps.map((st, i) => {
        const reached = i <= current || st.state === "done" || st.state === "warning"
        const tone = st.tone ?? (st.state === "done" ? "success" : st.state === "warning" ? "warning" : undefined)
        const inner = (
          <>
            <span
              className={cn(
                "flex items-center gap-1.5 type-label-md [&_svg]:size-4",
                st.state === "current" ? "text-fg-brand" : st.state === "upcoming" ? "text-fg-tertiary" : "text-fg-primary",
              )}
            >
              {tone === "success" && <Check className="text-status-success-text" />}
              {tone === "warning" && <CircleAlert className="text-status-warning-text" />}
              {st.title}
            </span>
            {st.caption && (
              <span className={cn("type-caption", tone === "success" ? "text-status-success-text" : tone === "warning" ? "text-status-warning-text" : "text-fg-tertiary")}>
                {st.caption}
              </span>
            )}
          </>
        )
        const box = cn("flex flex-1 flex-col items-start border-t py-3 text-left", reached ? "border-action-primary" : "border-line-default")
        return (
          <li key={st.title} className="flex flex-1 items-start" aria-current={st.state === "current" ? "step" : undefined}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(i)} className={cn(box, "focus-visible:outline-none focus-visible:focus-ring")}>
                {inner}
              </button>
            ) : (
              <div className={box}>{inner}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
