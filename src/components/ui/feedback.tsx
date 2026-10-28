import type { ReactNode } from "react"
import { AlertTriangle, Check, CircleAlert, CircleCheck, Info, Loader2, X } from "lucide-react"
import { cn } from "@/lib/cn"

type Tone = "neutral" | "info" | "success" | "warning" | "error"

const ALERT: Record<Tone, { box: string; title: string; Icon: typeof Info }> = {
  neutral: { box: "bg-surface border-line-default", title: "text-fg-primary", Icon: Info },
  info: { box: "bg-status-info-bg border-status-info-border", title: "text-status-info-text", Icon: Info },
  success: { box: "bg-status-success-bg border-status-success-border", title: "text-status-success-text", Icon: CircleCheck },
  warning: { box: "bg-status-warning-bg border-status-warning-border", title: "text-status-warning-text", Icon: AlertTriangle },
  error: { box: "bg-status-error-bg border-status-error-border", title: "text-status-error-text", Icon: CircleAlert },
}

/**
 * Inline message box. `title` is optional for one-line notices; `actions` sit beside the text (below it on phones);
 * `icon` replaces the tone icon, or `false` hides it; `size="sm"` is the compact version for chat and step headers.
 */
export function Alert({
  tone = "info",
  title,
  children,
  actions,
  icon,
  size = "md",
  onDismiss,
  className,
}: {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  icon?: ReactNode | false
  size?: "sm" | "md"
  onDismiss?: () => void
  className?: string
}) {
  const t = ALERT[tone]
  const text = (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {title && <p className={cn(size === "sm" ? "type-label-md" : "type-label-lg", t.title)}>{title}</p>}
      {children && <div className={cn("type-body-sm", title || tone === "neutral" ? (tone === "neutral" ? "text-fg-secondary" : "text-fg-primary") : t.title)}>{children}</div>}
    </div>
  )
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 border", size === "sm" ? "rounded-md p-3" : "rounded-lg p-4", t.box, className)}>
      {icon !== false && <span className={cn("mt-0.5 shrink-0 [&_svg]:size-5", t.title)}>{icon ?? <t.Icon aria-hidden />}</span>}
      {actions ? (
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {text}
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        </div>
      ) : (
        text
      )}
      {onDismiss && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className="grid size-6 place-items-center rounded-sm text-fg-secondary hover:bg-black/5 focus-visible:outline-none focus-visible:focus-ring">
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
}

const TOAST: Record<"success" | "error" | "info" | "processing", { badge: string; Icon: typeof Info; spin?: boolean }> = {
  success: { badge: "bg-status-success-solid", Icon: Check },
  error: { badge: "bg-status-error-solid", Icon: X },
  info: { badge: "bg-status-info-solid", Icon: Info },
  processing: { badge: "bg-inverse", Icon: Loader2, spin: true },
}

/** Presentational toast (dark pill). Pair with your own stacking/timing logic. */
export function Toast({
  tone = "success",
  message,
  action,
  className,
}: {
  tone?: keyof typeof TOAST
  message: ReactNode
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  const t = TOAST[tone]
  return (
    <div role="status" className={cn("inline-flex items-center gap-3 rounded-lg bg-inverse px-4 py-3 shadow-soft-md", className)}>
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-fg-on-action", t.badge)}>
        <t.Icon aria-hidden className={cn("size-4", t.spin && "animate-spin")} />
      </span>
      <span className="type-label-md text-fg-inverse">{message}</span>
      {action && (
        <button type="button" onClick={action.onClick} className="type-label-md text-accent-yellow hover:underline focus-visible:outline-none focus-visible:focus-ring rounded-sm">
          {action.label}
        </button>
      )}
    </div>
  )
}

export function ProgressBar({ value, label, className }: { value: number; label?: ReactNode; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <span className="flex-1 type-label-md text-fg-primary">{label}</span>
          <span className="type-label-md tabular-nums text-fg-secondary">{v}%</span>
        </div>
      )}
      <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-action-primary transition-[width] duration-500 ease-out" style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}
