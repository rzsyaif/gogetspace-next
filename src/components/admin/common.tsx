"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Avatar, Badge, Button, Dialog, DialogContent, Field, Input, Textarea } from "@/components/ui"
import { cn } from "@/lib/cn"
import { planInfo, type Plan } from "@/lib/plans"
import type { AdminSite, Client, PaymentStatus, SubStatus } from "@/lib/admin/data"

/* ---------------- cells ---------------- */

export function ClientCell({ client, sub }: { client: Client; sub?: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={client.name} size="sm" />
      <span className="flex min-w-0 flex-col">
        <Link href={`/admin/clients/${client.id}`} className="truncate type-label-md text-fg-primary hover:underline focus-visible:outline-none focus-visible:focus-ring rounded-sm">
          {client.name}
        </Link>
        <span className="truncate type-caption text-fg-tertiary">{sub ?? client.email}</span>
      </span>
    </span>
  )
}

/** square initial standing in for a site's thumbnail */
export function SiteGlyph({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-[6px] bg-muted type-label-sm text-fg-secondary", className)}>
      {name[0]}
    </span>
  )
}

export function SiteCell({ site, href }: { site: AdminSite; href?: string }) {
  const url = site.domain?.status === "connected" ? site.domain.name : site.freeDomain
  const name = <span className="truncate type-label-md text-fg-primary">{site.name}</span>
  return (
    <span className="flex min-w-0 items-center gap-3">
      <SiteGlyph name={site.name} />
      <span className="flex min-w-0 max-w-[280px] flex-col">
        {href ? (
          <Link href={href} className="truncate rounded-sm hover:underline focus-visible:outline-none focus-visible:focus-ring">
            {name}
          </Link>
        ) : (
          name
        )}
        <span className="truncate type-caption text-fg-tertiary">{url}</span>
      </span>
    </span>
  )
}

/* ---------------- badges ---------------- */

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <Badge tone={plan === "free" ? "neutral" : "brand"} dot={false}>
      {planInfo(plan).name}
    </Badge>
  )
}

export function SiteStatusBadge({ status }: { status: AdminSite["status"] }) {
  return status === "live" ? <Badge tone="success">Live</Badge> : status === "suspended" ? <Badge tone="error">Unpublished</Badge> : <Badge>Draft</Badge>
}

export function ClientStatusBadge({ client }: { client: Client }) {
  if (client.status === "suspended") return <Badge tone="error">Suspended</Badge>
  if (client.status === "deletion") return <Badge tone="warning">Deletion requested</Badge>
  if (!client.verified) return <Badge tone="warning">Unverified</Badge>
  return <Badge tone="success">Active</Badge>
}

export function SubStatusBadge({ status }: { status: SubStatus }) {
  return status === "active" ? <Badge tone="success">Active</Badge> : status === "past_due" ? <Badge tone="error">Past due</Badge> : <Badge>Canceled</Badge>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return status === "paid" ? <Badge tone="success">Paid</Badge> : status === "failed" ? <Badge tone="error">Failed</Badge> : <Badge>Refunded</Badge>
}

/* ---------------- layout bits ---------------- */

/** Row of filters above a table: search on the left, choices on the right; wraps on phones. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center", className)}>{children}</div>
}

/** One line in a "needs attention" list. */
export function AttentionRow({ icon, title, text, href, action, tone = "warning" }: { icon: ReactNode; title: ReactNode; text: ReactNode; href: string; action: string; tone?: "warning" | "error" | "neutral" }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full [&_svg]:size-4",
          tone === "error" ? "bg-status-error-bg text-status-error-text" : tone === "warning" ? "bg-status-warning-bg text-status-warning-text" : "bg-subtle text-fg-secondary",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-label-md text-fg-primary">{title}</span>
        <span className="truncate type-caption text-fg-tertiary">{text}</span>
      </span>
      <Button asChild size="sm" variant="secondary">
        <Link href={href}>{action}</Link>
      </Button>
    </li>
  )
}

/* ---------------- confirm with a reason ---------------- */

/**
 * Confirmation for anything that changes a client's account. A reason is required (it goes to the audit log);
 * `confirmText` makes the person type a word first for actions that can't be undone.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  reasonLabel = "Reason",
  reasonPlaceholder = "e.g. ticket #2240, asked by the client",
  optionalReason,
  confirmText,
  children,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  destructive?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  optionalReason?: boolean
  confirmText?: string
  children?: ReactNode
  onConfirm: (reason: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ReasonBody
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          destructive={destructive}
          reasonLabel={reasonLabel}
          reasonPlaceholder={reasonPlaceholder}
          optionalReason={optionalReason}
          confirmText={confirmText}
          onCancel={() => onOpenChange(false)}
          onConfirm={(r) => {
            onConfirm(r)
            onOpenChange(false)
          }}
        >
          {children}
        </ReasonBody>
      )}
    </Dialog>
  )
}

function ReasonBody({
  title,
  description,
  confirmLabel,
  destructive,
  reasonLabel,
  reasonPlaceholder,
  optionalReason,
  confirmText,
  children,
  onCancel,
  onConfirm,
}: {
  title: string
  description?: ReactNode
  confirmLabel: string
  destructive?: boolean
  reasonLabel: string
  reasonPlaceholder: string
  optionalReason?: boolean
  confirmText?: string
  children?: ReactNode
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const [typed, setTyped] = useState("")
  const ok = (optionalReason || reason.trim().length >= 3) && (!confirmText || typed.trim() === confirmText)
  return (
    <DialogContent
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={destructive ? "destructive" : "primary"} disabled={!ok} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      <Field label={reasonLabel} helper={optionalReason ? "Optional · saved to the audit log" : "Saved to the audit log"}>
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={reasonPlaceholder} />
      </Field>
      {confirmText && (
        <Field label={`Type ${confirmText} to confirm`}>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </Field>
      )}
    </DialogContent>
  )
}
