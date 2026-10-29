"use client"

import { useState } from "react"
import { ArrowRight, Check, Minus, Plus, X } from "lucide-react"
import { Badge, Button, Checkbox, DialogContent, Step, StepList } from "@/components/ui"
import { cn } from "@/lib/cn"
import { PLAN_RANK, PLAN_ROWS, planInfo, type Plan, type PlanInfo } from "@/lib/plans"
import { ACCOUNT } from "@/lib/account/data"
import type { PlanUsage } from "./plan-panel"

/** the prototype's "today" */
const TODAY = new Date(2026, 9, 29)
const DAY = 86_400_000
const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })
const fmtShort = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" })
const money = (n: number) => `$${n.toFixed(2)}`
const addMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())

/**
 * How a plan change is billed. Upgrades start today and charge the difference for the days left in the period
 * (unused time on the old plan is credited). Downgrades wait until the period that's paid for ends, so nothing is
 * refunded and nothing is lost early. A site still being created pays nothing until it's published.
 */
export function planChangeQuote({ from, to, renews, billed }: { from: PlanInfo; to: PlanInfo; renews?: string; billed: boolean }) {
  const upgrade = PLAN_RANK[to.id] > PLAN_RANK[from.id]
  if (!billed) return { upgrade, startsNow: true, effective: TODAY, dueToday: 0, lines: [] as { label: string; amount: number }[], nextBill: null as Date | null }
  if (!renews) {
    // a free website: the new plan starts today and the first month is charged now
    const next = addMonth(TODAY)
    return { upgrade, startsNow: true, effective: TODAY, dueToday: to.price, lines: [{ label: `${to.name}, ${fmtShort.format(TODAY)} – ${fmtShort.format(next)}`, amount: to.price }], nextBill: next }
  }
  const end = new Date(renews)
  const start = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate())
  const periodDays = Math.round((end.getTime() - start.getTime()) / DAY)
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - TODAY.getTime()) / DAY))
  if (upgrade) {
    const charge = (to.price * daysLeft) / periodDays
    const credit = (from.price * daysLeft) / periodDays
    return {
      upgrade,
      startsNow: true,
      effective: TODAY,
      dueToday: Math.max(0, charge - credit),
      lines: [
        { label: `${to.name}, ${daysLeft} of ${periodDays} days left (${fmtShort.format(TODAY)} – ${fmtShort.format(end)})`, amount: charge },
        ...(credit > 0 ? [{ label: `Unused ${from.name} time, credited`, amount: -credit }] : []),
      ],
      nextBill: end as Date | null,
    }
  }
  return { upgrade, startsNow: false, effective: end, dueToday: 0, lines: [] as { label: string; amount: number }[], nextBill: to.price ? end : null }
}

/** What this website gains or loses, in its own terms (its pages, its domain, its credits). */
function siteImpact(from: PlanInfo, to: PlanInfo, usage: PlanUsage) {
  const out: { text: string; good: boolean }[] = []
  const limit = (p: PlanInfo) => (p.pages === Infinity ? usage.pagesPlanned : Math.min(p.pages, usage.pagesPlanned))
  const pageDiff = limit(to) - limit(from)
  if (pageDiff > 0) out.push({ good: true, text: `${pageDiff} planned ${pageDiff === 1 ? "page" : "pages"} waiting for an upgrade can be built — ask the agent once you've switched.` })
  if (to.pages !== Infinity && usage.pagesBuilt > to.pages) {
    const n = usage.pagesBuilt - to.pages
    out.push({ good: false, text: `${n} of your ${usage.pagesBuilt} published pages ${n === 1 ? "is" : "are"} taken offline${to.pages === 1 ? " — only the homepage stays" : ""}. They're kept as drafts and come back if you upgrade again.` })
  }
  if (to.customDomain && !from.customDomain) out.push({ good: true, text: `Use your own domain instead of ${usage.freeDomain}.` })
  if (!to.customDomain && from.customDomain) {
    out.push({
      good: false,
      text: usage.domain ? `${usage.domain.name} stops showing this website; visitors are sent to ${usage.freeDomain}. You still own the domain.` : `You can't connect your own domain; the site stays on ${usage.freeDomain}.`,
    })
  }
  const creditDiff = to.credits - from.credits
  if (creditDiff > 0) out.push({ good: true, text: `${creditDiff} more agent credits a month (${to.credits} in total), available straight away.` })
  if (creditDiff < 0) {
    const used = Math.round((usage.creditsUsed / 100) * from.credits)
    out.push({ good: false, text: `Agent credits go from ${from.credits} to ${to.credits} a month.${used > to.credits ? ` You've used ${used} this month, more than the new allowance.` : ""}` })
  }
  if (to.analyticsDays > from.analyticsDays) out.push({ good: true, text: `Analytics go back ${to.analyticsDays >= 365 ? "12 months" : `${to.analyticsDays} days`} — the older numbers are already there.` })
  if (to.analyticsDays < from.analyticsDays) out.push({ good: false, text: `Analytics show only the last ${to.analyticsDays} days. Older numbers are kept and come back if you upgrade.` })
  if (to.contactForm && !from.contactForm) out.push({ good: true, text: "Visitors can send enquiries through a contact form." })
  if (!to.contactForm && from.contactForm) out.push({ good: false, text: "The contact form is removed, so new enquiries stop. Past enquiries stay in your inbox." })
  if (to.booking && !from.booking) out.push({ good: true, text: "Patients can book appointments online." })
  if (!to.booking && from.booking) out.push({ good: false, text: "Online booking is turned off. Existing bookings are kept." })
  if (to.prioritySupport && !from.prioritySupport) out.push({ good: true, text: "Priority support — answers within a few hours." })
  if (!to.prioritySupport && from.prioritySupport) out.push({ good: false, text: "Support moves from priority to standard (within 2 working days)." })
  return out
}

export function PlanChangeDialog({
  siteName,
  from,
  to,
  usage,
  billed,
  onCancel,
  onConfirm,
}: {
  siteName: string
  from: Plan
  to: Plan
  usage: PlanUsage
  /** false while the site is still being created: nothing is billed until it's published */
  billed: boolean
  onCancel: () => void
  onConfirm: (q: ReturnType<typeof planChangeQuote>) => void
}) {
  const a = planInfo(from)
  const b = planInfo(to)
  const flow = !billed
  const q = planChangeQuote({ from: a, to: b, renews: usage.renews, billed })
  const impact = siteImpact(a, b, usage)
  const losses = impact.filter((i) => !i.good)
  const [agreed, setAgreed] = useState(false)
  const needsAgree = !q.upgrade && losses.length > 0
  const when = fmt.format(q.effective)

  return (
    <DialogContent
      title={q.upgrade ? `Upgrade to ${b.name}` : `Switch to ${b.name}`}
      description={
        <>
          For <span className="text-fg-primary">{siteName}</span> only — your other websites keep their own plans.
        </>
      }
      className="max-w-[760px]"
      footer={
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          <span className="basis-full type-caption text-fg-secondary sm:flex-1 sm:basis-auto sm:type-body-sm">
            {flow
              ? "Nothing to pay until you publish."
              : q.upgrade
                ? `${money(q.dueToday)} today to ${ACCOUNT.card.brand} •••• ${ACCOUNT.card.last4}`
                : `Nothing to pay · changes on ${when}`}
          </span>
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onCancel}>
            {q.upgrade ? "Cancel" : `Keep ${a.name}`}
          </Button>
          <Button variant={q.upgrade ? "primary" : "destructive"} className="flex-1 sm:flex-none" disabled={needsAgree && !agreed} onClick={() => onConfirm(q)}>
            {flow ? `Switch to ${b.name}` : q.upgrade ? (q.dueToday > 0 ? `Upgrade and pay ${money(q.dueToday)}` : `Upgrade to ${b.name}`) : `Switch on ${fmtShort.format(q.effective)}`}
          </Button>
        </div>
      }
    >
      {/* side-by-side plans */}
      <div className="overflow-hidden rounded-lg border border-line-default">
        <div className="grid grid-cols-[1.3fr_1fr_1fr] bg-subtle type-label-sm text-fg-secondary">
          <span className="px-4 py-3">What&apos;s included</span>
          <span className="px-4 py-3">
            {a.name} <span className="text-fg-tertiary">· now</span>
          </span>
          <span className="flex items-center gap-1 px-4 py-3 text-fg-primary">
            <ArrowRight className="size-3.5" /> {b.name}
          </span>
        </div>
        <ul className="divide-y divide-line-default">
          {PLAN_ROWS.map((r) => {
            const va = r.value(a)
            const vb = r.value(b)
            const diff = r.rank(b) - r.rank(a)
            const changed = va !== vb
            return (
              <li key={r.key} className={cn("grid-cols-[1.3fr_1fr_1fr] items-center type-body-sm", changed ? "grid" : "hidden text-fg-tertiary sm:grid")}>
                <span className={cn("px-4 py-2.5", changed && "text-fg-primary")}>{r.label}</span>
                <span className="px-4 py-2.5">
                  <Cell v={va} muted={changed} />
                </span>
                <span className={cn("flex items-center gap-2 px-4 py-2.5", changed && (r.key === "price" ? "type-label-md text-fg-primary" : diff > 0 ? "type-label-md text-status-success-text" : "type-label-md text-status-error-text"))}>
                  <Cell v={vb} />
                  {changed && r.key !== "price" && (
                    <Badge tone={diff > 0 ? "success" : "error"} dot={false} className="hidden sm:inline-flex">
                      {diff > 0 ? "Gain" : "Lose"}
                    </Badge>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* what changes for this site */}
        <section className="flex flex-col gap-3">
          <h3 className="type-label-lg text-fg-primary">{q.upgrade ? "What this website gets" : "What changes for this website"}</h3>
          <ul className="flex flex-col gap-2.5">
            {impact.map((i) => (
              <li key={i.text} className="flex gap-2.5 type-body-sm text-fg-primary">
                <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", i.good ? "bg-status-success-bg text-status-success-text" : "bg-status-error-bg text-status-error-text")}>
                  {i.good ? <Plus className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
                </span>
                {i.text}
              </li>
            ))}
          </ul>
        </section>

        {/* price and timing */}
        <section className="flex flex-col gap-3">
          <h3 className="type-label-lg text-fg-primary">Price and timing</h3>
          {flow ? (
            <p className="type-body-sm text-fg-secondary">
              This website isn&apos;t published yet, so nothing is charged now. When you publish, {b.price ? `${b.name} is ${money(b.price)} a month, starting that day.` : "it stays free."}
            </p>
          ) : (
            <dl className="flex flex-col gap-2 rounded-md bg-subtle p-4 type-body-sm">
              {q.lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-3">
                  <dt className="text-fg-secondary">{l.label}</dt>
                  <dd className="text-fg-primary tabular-nums">{l.amount < 0 ? `−${money(-l.amount)}` : money(l.amount)}</dd>
                </div>
              ))}
              {!q.upgrade && (
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-secondary">
                    {a.name} stays until {fmtShort.format(q.effective)} — already paid
                  </dt>
                  <dd className="text-fg-primary tabular-nums">{money(0)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-line-default pt-2">
                <dt className="type-label-md text-fg-primary">Due today</dt>
                <dd className="type-label-md text-fg-primary tabular-nums">{money(q.dueToday)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-secondary">From {q.nextBill ? fmt.format(q.nextBill) : fmt.format(q.effective)}</dt>
                <dd className="text-fg-primary tabular-nums">
                  {b.price ? `${money(b.price)} / month` : "Free"}
                  {a.price !== b.price && a.price > 0 && <span className="text-fg-tertiary"> (was {money(a.price)})</span>}
                </dd>
              </div>
            </dl>
          )}
          <StepList>
            {q.startsNow ? (
              <>
                <Step status="done" connector="active">
                  <span className="type-label-md text-fg-primary">Today, {fmtShort.format(TODAY)}</span>
                  <span className="type-body-sm text-fg-secondary">{b.name} starts straight away{flow ? "" : q.dueToday ? `; ${money(q.dueToday)} charged` : ""}.</span>
                </Step>
                {!flow && q.nextBill && (
                  <Step status="pending">
                    <span className="type-label-md text-fg-primary">{fmt.format(q.nextBill)}</span>
                    <span className="type-body-sm text-fg-secondary">
                      {q.lines.length > 1 || q.dueToday < b.price ? `First full month at ${money(b.price)}` : `Next payment of ${money(b.price)}`}, then monthly. Cancel anytime.
                    </span>
                  </Step>
                )}
              </>
            ) : (
              <>
                <Step status="done" connector="idle">
                  <span className="type-label-md text-fg-primary">Today until {fmtShort.format(q.effective)}</span>
                  <span className="type-body-sm text-fg-secondary">Nothing changes — you keep everything in {a.name}. You can undo this until then.</span>
                </Step>
                <Step status="pending">
                  <span className="type-label-md text-fg-primary">{when}</span>
                  <span className="type-body-sm text-fg-secondary">
                    Moves to {b.name}
                    {b.price ? ` and ${money(b.price)} is charged, then monthly` : "; no more charges"}.
                  </span>
                </Step>
              </>
            )}
          </StepList>
        </section>
      </div>

      {needsAgree && (
        <Checkbox
          label={`I understand ${losses.length === 1 ? "this change" : `these ${losses.length} changes`} happen on ${when}`}
          description="Your content isn't deleted; upgrading again brings it back."
          checked={agreed}
          onCheckedChange={(c) => setAgreed(c === true)}
        />
      )}
    </DialogContent>
  )
}

function Cell({ v, muted }: { v: string | boolean; muted?: boolean }) {
  if (v === true) return <Check aria-label="Included" className={cn("size-4", muted ? "text-fg-tertiary" : "text-current")} strokeWidth={2.5} />
  if (v === false) return <X aria-label="Not included" className="size-4 text-fg-disabled" strokeWidth={2.5} />
  return <span className={cn("tabular-nums", muted && "text-fg-secondary")}>{v}</span>
}
