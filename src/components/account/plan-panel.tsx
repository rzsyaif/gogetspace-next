"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, CreditCard } from "lucide-react"
import { Alert, Badge, Button, Dialog, DialogContent, ProgressBar } from "@/components/ui"
import { cn } from "@/lib/cn"
import { PLANS, PLAN_RANK, planInfo, type Plan } from "@/lib/plans"
import { ACCOUNT } from "@/lib/account/data"
import { PanelHeader, PanelSection } from "./panel"

export interface PlanUsage {
  pagesBuilt: number
  pagesPlanned: number
  creditsUsed: number
  customDomain: boolean
  renews?: string
}

/**
 * The website's plan — every site has its own. Current plan with usage, the three plans side by side, and a
 * confirmation that names the site and the charge before anything changes.
 */
export function PlanPanel({ siteName, plan, usage, onChange }: { siteName: string; plan: Plan; usage: PlanUsage; onChange: (p: Plan) => void }) {
  const [pick, setPick] = useState<Plan | null>(null)
  const [done, setDone] = useState<Plan | null>(null)
  const current = planInfo(plan)
  const pageLimit = current.pages === Infinity ? usage.pagesPlanned : Math.min(current.pages, usage.pagesPlanned)
  const target = pick ? planInfo(pick) : null
  const upgrade = pick ? PLAN_RANK[pick] > PLAN_RANK[plan] : false

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Plan"
        description={
          <>
            Each website has its own plan. This one is for <strong className="font-semibold text-fg-primary">{siteName}</strong>.
          </>
        }
        actions={
          <Button asChild variant="secondary" size="sm" leadingIcon={<CreditCard />}>
            <Link href="/dashboard/billing">Payment & invoices</Link>
          </Button>
        }
      />

      {done && (
        <Alert tone="success" size="sm" title={`${siteName} is now on ${planInfo(done).name}`} onDismiss={() => setDone(null)}>
          {PLAN_RANK[done] > 0 ? "New pages and features are ready to use — ask the agent to build the pages that were waiting." : "The change applies at the end of the current billing period."}
        </Alert>
      )}

      <PanelSection title="Current plan" actions={<Badge tone="brand" dot={false}>{current.name}</Badge>}>
        <p className="type-body-md text-fg-secondary">
          {current.price ? `${current.priceLabel} per month` : "Free forever"}
          {usage.renews && current.price ? ` · renews ${usage.renews}` : ""}
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <Usage
            label="Pages built"
            value={`${usage.pagesBuilt} of ${current.pages === Infinity ? "unlimited" : current.pages}`}
            ratio={current.pages === Infinity ? usage.pagesBuilt / Math.max(1, usage.pagesPlanned) : usage.pagesBuilt / current.pages}
            note={usage.pagesPlanned > pageLimit ? `${usage.pagesPlanned - pageLimit} planned pages wait for an upgrade` : undefined}
          />
          <Usage label="Agent credits this month" value={`${usage.creditsUsed}% of ${current.credits}`} ratio={usage.creditsUsed / 100} />
          <div className="flex flex-col gap-2">
            <span className="type-body-sm text-fg-secondary">Custom domain</span>
            <span className="type-label-lg text-fg-primary">{current.customDomain ? (usage.customDomain ? "Connected" : "Included") : "Not included"}</span>
          </div>
        </div>
      </PanelSection>

      <ul className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === plan
          return (
            <li key={p.id} className={cn("flex flex-col gap-5 rounded-xl border bg-surface p-6", isCurrent ? "border-2 border-blue-500" : "border-line-default")}>
              <div className="flex items-center gap-2">
                <h3 className="flex-1 type-h5 text-fg-primary">{p.name}</h3>
                {isCurrent && <Badge tone="brand">Current</Badge>}
              </div>
              <p className="-mt-3 type-body-sm text-fg-secondary">{p.desc}</p>
              <p className="flex items-end gap-2">
                <span className="type-h3 text-fg-primary">{p.priceLabel}</span>
                <span className="pb-1 type-body-sm text-fg-secondary">{p.period}</span>
              </p>
              <Button variant={isCurrent ? "secondary" : PLAN_RANK[p.id] > PLAN_RANK[plan] ? "primary" : "secondary"} disabled={isCurrent} onClick={() => setPick(p.id)}>
                {isCurrent ? "Current plan" : PLAN_RANK[p.id] > PLAN_RANK[plan] ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
              </Button>
              <ul className="flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 type-body-sm text-fg-primary">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-blue-subtle text-fg-link">
                      <Check className="size-3" strokeWidth={2.5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>

      <Dialog open={pick !== null} onOpenChange={(o) => !o && setPick(null)}>
        {target && (
          <DialogContent
            title={upgrade ? `Upgrade ${siteName} to ${target.name}?` : `Switch ${siteName} to ${target.name}?`}
            description={
              upgrade
                ? `${target.priceLabel} a month, charged to ${ACCOUNT.card.brand} •••• ${ACCOUNT.card.last4}. It starts today; this month you only pay the difference. Your other websites keep their own plans.`
                : `${siteName} keeps ${current.name} until the end of this billing period, then moves to ${target.name}.${target.pages < usage.pagesBuilt ? ` Only ${target.pages === 1 ? "the homepage stays" : `${target.pages} pages stay`} published.` : ""}`
            }
            footer={
              <>
                <Button variant="secondary" onClick={() => setPick(null)}>Cancel</Button>
                <Button
                  onClick={() => {
                    onChange(target.id)
                    setDone(target.id)
                    setPick(null)
                  }}
                >
                  {upgrade ? `Upgrade for ${target.priceLabel}/mo` : `Switch to ${target.name}`}
                </Button>
              </>
            }
          />
        )}
      </Dialog>
    </div>
  )
}

function Usage({ label, value, ratio, note }: { label: string; value: string; ratio: number; note?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-2">
        <span className="type-body-sm text-fg-secondary">{label}</span>
        <span className="type-label-md text-fg-primary tabular-nums">{value}</span>
      </span>
      <ProgressBar value={Math.min(100, Math.round(ratio * 100))} ariaLabel={label} />
      {note && <span className="type-caption text-fg-tertiary">{note}</span>}
    </div>
  )
}
