import type { ReactNode } from "react"
import { AlertTriangle, Check, Loader, X } from "lucide-react"
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
