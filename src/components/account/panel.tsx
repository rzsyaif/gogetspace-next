import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

/** Page/panel title row used across the dashboard pages and the editor's Analytics, Enquiries and Plan tabs. */
export function PanelHeader({ title, description, actions, className }: { title: string; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="type-h3 text-fg-primary">{title}</h1>
        {description && <p className="type-body-md text-fg-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Bordered block with a small heading. */
export function PanelSection({ title, actions, children, className }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-lg border border-line-default bg-surface p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="type-h6 text-fg-primary">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Empty state: icon, title, one line of help, optional action. */
export function PanelEmpty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-subtle text-fg-secondary [&_svg]:size-6">{icon}</span>
      <p className="type-h6 text-fg-primary">{title}</p>
      <p className="max-w-sm type-body-sm text-fg-secondary">{text}</p>
      {action}
    </div>
  )
}

/** Padded, centred page body for dashboard pages and editor panels. */
export function PanelPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-6 sm:px-8 lg:py-10", className)}>{children}</div>
}
