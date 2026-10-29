"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClock, Check, CreditCard } from "lucide-react"
import { Alert, Badge, Button, Dialog, ProgressBar } from "@/components/ui"
import { cn } from "@/lib/cn"
import { PLANS, PLAN_RANK, planInfo, type Plan } from "@/lib/plans"
import { PlanChangeDialog } from "./plan-change"
import { PanelHeader, PanelSection } from "./panel"

export interface PlanUsage {
  pagesBuilt: number
  pagesPlanned: number
  creditsUsed: number
  customDomain: boolean
  /** the domain connected to this website, if any */
  domain?: { name: string; status: "connected" | "pending" } | null
  freeDomain: string
  renews?: string
}

/**
 * The website's plan — every site has its own. Current plan with usage, the three plans side by side, and a
 * confirmation that names the site and the charge before anything changes.
 */
export function PlanPanel({
  siteName,
  plan,
  usage,
  billing,
  onChange,
  onManageDomain,
}: {
  siteName: string
  plan: Plan
  usage: PlanUsage
  billing: { billed: boolean; scheduled?: { plan: Plan; on: string }; schedule: (p: Plan) => void; cancelScheduled: () => void }
  /** switch now; `charge` is what the upgrade cost today */
  onChange: (p: Plan, charge?: number) => void
  /** open the editor's Domain tab */
  onManageDomain: () => void
}) {
  const [pick, setPick] = useState<Plan | null>(null)
  const [done, setDone] = useState<{ plan: Plan; text: string } | null>(null)
  const current = planInfo(plan)
  const pageLimit = current.pages === Infinity ? usage.pagesPlanned : Math.min(current.pages, usage.pagesPlanned)
  const scheduled = billing.scheduled

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

      {done && done.plan === plan && (
        <Alert tone="success" size="sm" title={done.text} onDismiss={() => setDone(null)}>
          {PLAN_RANK[done.plan] > 0
              ? "New pages and features are ready to use — ask the agent to build the pages that were waiting."
              : "Your website is on Free now."}
        </Alert>
      )}

      {scheduled && (
        <Alert
          tone="warning"
          size="sm"
          icon={<CalendarClock />}
          title={`Moves to ${planInfo(scheduled.plan).name} on ${scheduled.on}`}
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                billing.cancelScheduled()
                setDone(null)
              }}
            >
              Keep {current.name}
            </Button>
          }
        >
          {siteName} keeps {current.name} until then{planInfo(scheduled.plan).price ? `, then it's ${planInfo(scheduled.plan).priceLabel} a month` : " and isn't charged after that"}.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <PanelSection title="Current plan" actions={<Badge tone="brand" dot={false}>{current.name}</Badge>} className="lg:col-span-8">
          <p className="type-body-md text-fg-secondary">
            {current.price ? `${current.priceLabel} per month` : "Free forever"}
            {usage.renews && current.price ? ` · renews ${usage.renews}` : ""}
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Usage
              label="Pages built"
              value={`${usage.pagesBuilt} of ${current.pages === Infinity ? "unlimited" : current.pages}`}
              ratio={current.pages === Infinity ? usage.pagesBuilt / Math.max(1, usage.pagesPlanned) : usage.pagesBuilt / current.pages}
              note={usage.pagesPlanned > pageLimit ? `${usage.pagesPlanned - pageLimit} planned pages wait for an upgrade` : undefined}
            />
            <Usage label="Agent credits this month" value={`${usage.creditsUsed}% of ${current.credits}`} ratio={usage.creditsUsed / 100} />
          </div>
        </PanelSection>

        <PanelSection
          title="Custom domain"
          className="lg:col-span-4"
          actions={<Badge tone={current.customDomain ? "success" : "neutral"} dot={false}>{current.customDomain ? "Included" : "Not included"}</Badge>}
        >
          {!current.customDomain ? (
            <>
              <p className="type-body-sm text-fg-secondary">
                Free websites use <span className="text-fg-primary">{usage.freeDomain}</span>. Starter and Business can use your own domain.
              </p>
              <Button className="self-start" onClick={() => setPick("starter")}>Upgrade to Starter</Button>
            </>
          ) : usage.domain ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="truncate type-label-lg text-fg-primary">{usage.domain.name}</span>
                <span className={usage.domain.status === "connected" ? "type-body-sm text-status-success-text" : "type-body-sm text-status-warning-text"}>
                  {usage.domain.status === "connected" ? "Connected" : "Waiting for DNS"}
                </span>
              </div>
              <Button variant="secondary" className="self-start" onClick={onManageDomain}>Manage domain</Button>
            </>
          ) : (
            <>
              <p className="type-body-sm text-fg-secondary">
                Not connected yet — the site uses <span className="text-fg-primary">{usage.freeDomain}</span>.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={onManageDomain}>Connect a domain</Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/dashboard/domains?buy=1">Buy one</Link>
                </Button>
              </div>
            </>
          )}
        </PanelSection>
      </div>

      <ul className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === plan
          return (
            <li key={p.id} className={cn("flex flex-col gap-5 rounded-xl border bg-surface p-6", isCurrent ? "border-2 border-line-focus" : "border-line-default")}>
              <div className="flex items-center gap-2">
                <h3 className="flex-1 type-h5 text-fg-primary">{p.name}</h3>
                {isCurrent && <Badge tone="brand">Current</Badge>}
                {scheduled?.plan === p.id && <Badge tone="warning">From {scheduled.on.replace(/ \d{4}$/, "")}</Badge>}
              </div>
              <p className="-mt-3 type-body-sm text-fg-secondary">{p.desc}</p>
              <p className="flex items-end gap-2">
                <span className="type-h3 text-fg-primary">{p.priceLabel}</span>
                <span className="pb-1 type-body-sm text-fg-secondary">{p.period}</span>
              </p>
              <Button variant={isCurrent ? "secondary" : PLAN_RANK[p.id] > PLAN_RANK[plan] ? "primary" : "secondary"} disabled={isCurrent || scheduled?.plan === p.id} onClick={() => setPick(p.id)}>
                {isCurrent ? "Current plan" : scheduled?.plan === p.id ? "Scheduled" : PLAN_RANK[p.id] > PLAN_RANK[plan] ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
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
        {pick && (
          <PlanChangeDialog
            siteName={siteName}
            from={plan}
            to={pick}
            usage={usage}
            billed={billing.billed}
            onCancel={() => setPick(null)}
            onConfirm={(q) => {
              const name = planInfo(pick).name
              if (q.startsNow) {
                onChange(pick, q.dueToday)
                setDone({ plan: pick, text: `${siteName} is now on ${name}` })
              } else {
                billing.schedule(pick)
                setDone(null)
              }
              setPick(null)
            }}
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
