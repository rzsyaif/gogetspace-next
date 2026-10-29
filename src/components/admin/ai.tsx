"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge, Button, SegmentedControl, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui"
import { AreaChart, BarList, StatTile } from "@/components/account/charts"
import { PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { PLANS, planInfo } from "@/lib/plans"
import { AI_DAILY, AI_MODELS, AI_STEPS, GENERATIONS, PRICES_CHECKED, costPerGeneration, firstBuildCost, fmtDay, mrrOf, minutesLabel, stepBreakdown, stepCost, usd, type AIStep } from "@/lib/admin/data"
import { adminActions, showToast, useAdmin } from "@/lib/admin/store"
import { PlanBadge } from "./common"
import { SiteActions } from "./sites"

/** what one agent credit costs us on average, for turning credits into dollars */
const CREDIT_COST = 0.012

export function AIUsagePage() {
  const { routing, sites, subscriptions } = useAdmin()
  const [days, setDays] = useState(30)
  const perGen = costPerGeneration(routing)
  const period = AI_DAILY.slice(-days)
  const before = AI_DAILY.slice(-days * 2, -days)
  const gens = period.reduce((n, d) => n + d.generations, 0)
  const prevGens = before.reduce((n, d) => n + d.generations, 0)
  const failed = period.reduce((n, d) => n + d.failed, 0)
  const cost = gens * perGen
  const monthlyRevenue = mrrOf(subscriptions) * (days / 30)
  const modelName = (id: string) => AI_MODELS.find((m) => m.id === id)?.name ?? id

  const byStep = AI_STEPS.map((s) => ({ label: s.label, sub: modelName(routing[s.id]), value: gens * s.share * stepCost(s, routing[s.id]) })).sort((a, b) => b.value - a.value)
  const byModel = AI_MODELS.map((m) => ({
    label: m.name,
    value: AI_STEPS.filter((s) => routing[s.id] === m.id).reduce((n, s) => n + gens * s.share * stepCost(s, m.id), 0),
  })).filter((m) => m.value > 0)

  const spenders = [...sites].sort((a, b) => b.credits / (planInfo(b.plan).credits + b.bonusCredits) - a.credits / (planInfo(a.plan).credits + a.bonusCredits)).slice(0, 8)

  return (
    <PanelPage>
      <PanelHeader
        title="AI usage"
        description="What the agent costs to run, which model each step uses, and which websites use the most."
        actions={<SegmentedControl label="Period" size="sm" value={days} onChange={setDays} options={[{ value: 7, label: "7 days" }, { value: 30, label: "30 days" }]} />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Generations" value={gens.toLocaleString("en")} delta={gens / prevGens - 1} />
        <StatTile label="Success rate" value={`${((1 - failed / gens) * 100).toFixed(1)}%`} />
        <StatTile label="AI cost" value={usd(cost)} delta={gens / prevGens - 1} upIsGood={false} />
        <StatTile label="AI cost vs plan revenue" value={`${Math.round((cost / Math.max(1, monthlyRevenue)) * 100)}%`} />
      </div>

      <PanelSection title="Generations per day">
        <AreaChart points={period.map((d) => ({ label: fmtDay(d.ago), value: d.generations }))} label="Generations per day" unit="generations" height={220} />
      </PanelSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelSection title="Cost by step">
          <BarList rows={byStep} format={(v) => usd(v)} />
        </PanelSection>
        <PanelSection title="Cost by model">
          <BarList rows={byModel} format={(v) => usd(v)} />
          <p className="type-caption text-fg-tertiary">Anthropic list prices, no caching or batch discount. Images use a placeholder price.</p>
        </PanelSection>
      </div>

      <CostPerRun routing={routing} modelName={modelName} />

      <section id="top-spenders" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="type-h6 text-fg-primary">Highest credit use this month</h2>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Website</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell align="right">Credits used</TableHeaderCell>
              <TableHeaderCell align="right">Of allowance</TableHeaderCell>
              <TableHeaderCell align="right">Est. cost to us</TableHeaderCell>
              <TableHeaderCell align="right">Plan revenue</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {spenders.map((s) => {
              const allowance = planInfo(s.plan).credits + s.bonusCredits
              const pct = s.credits / allowance
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/admin/clients/${s.clientId}?tab=sites`} className="block max-w-[260px] truncate rounded-sm type-label-md hover:underline focus-visible:outline-none focus-visible:focus-ring">
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={s.plan} />
                  </TableCell>
                  <TableCell align="right">
                    {s.credits} / {allowance}
                  </TableCell>
                  <TableCell align="right">
                    <Badge tone={pct > 1 ? "error" : pct > 0.8 ? "warning" : "neutral"} dot={false}>
                      {Math.round(pct * 100)}%
                    </Badge>
                  </TableCell>
                  <TableCell align="right">{usd(s.credits * CREDIT_COST, true)}</TableCell>
                  <TableCell align="right">{planInfo(s.plan).price ? usd(planInfo(s.plan).price) : "—"}</TableCell>
                  <TableCell align="right">
                    <SiteActions site={s} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <p className="type-caption text-fg-tertiary">Free websites above 100% usually mean someone regenerating over and over — check their feedback and failed builds before granting more.</p>
      </section>

      <PanelSection title="Recent generations">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Website</TableHeaderCell>
              <TableHeaderCell>Step · model</TableHeaderCell>
              <TableHeaderCell align="right">Tokens</TableHeaderCell>
              <TableHeaderCell align="right">Cost</TableHeaderCell>
              <TableHeaderCell align="right">Time</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {GENERATIONS.map((g) => {
              const site = sites.find((s) => s.id === g.siteId)
              return (
                <TableRow key={g.id}>
                  <TableCell>
                    <span className="flex flex-col">
                      <span className="font-mono text-[13px]">{g.id}</span>
                      <span className="type-caption text-fg-tertiary">{minutesLabel(g.minutesAgo)}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[220px] truncate">{site?.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col">
                      <span>{AI_STEPS.find((s) => s.id === g.step)?.label}</span>
                      <span className="type-caption text-fg-tertiary">{modelName(g.model)}</span>
                    </span>
                  </TableCell>
                  <TableCell align="right">{g.tokens ? g.tokens.toLocaleString("en") : "3 images"}</TableCell>
                  <TableCell align="right">{usd(g.cost, true)}</TableCell>
                  <TableCell align="right">{g.seconds} s</TableCell>
                  <TableCell>
                    <span className="flex max-w-[240px] flex-col items-start gap-0.5 whitespace-normal">
                      <Badge tone={g.status === "ok" ? "success" : g.status === "retried" ? "warning" : "error"}>{g.status === "ok" ? "Done" : g.status === "retried" ? "Retried" : "Failed"}</Badge>
                      {g.error && <span className="type-caption text-fg-tertiary">{g.error}</span>}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    {g.status === "failed" && (
                      <Button size="sm" variant="secondary" onClick={() => showToast(`${g.id} queued again`, "info")}>
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </PanelSection>
    </PanelPage>
  )
}

/** per-run amounts are fractions of a cent, so show enough digits to compare models */
const exact = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(3)}`)
const price = (n: number) => (n < 1 ? `$${n.toFixed(2)}` : `$${n}`)
const tokens = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("en", { maximumFractionDigits: 1 })}K` : String(n))
/** pages built the first time on each plan (Business: the 11-page Bakti Analisa sitemap) */
const BUILD_PAGES: Record<string, number> = { free: 1, starter: 5, business: 11 }

/**
 * Model routing with the cost of one run of each step: tokens in × input price + tokens out × output price.
 * Below it, what a whole first build costs on each plan, so the price of a model switch is visible.
 */
function CostPerRun({ routing, modelName }: { routing: Record<AIStep, string>; modelName: (id: string) => string }) {
  return (
    <>
      <PanelSection title="Model routing and cost per run" actions={<span className="type-caption text-fg-tertiary">Changes apply to new runs</span>}>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Step</TableHeaderCell>
              <TableHeaderCell className="w-[260px]">Model</TableHeaderCell>
              <TableHeaderCell align="right">Tokens in</TableHeaderCell>
              <TableHeaderCell align="right">Tokens out</TableHeaderCell>
              <TableHeaderCell align="right">Input cost</TableHeaderCell>
              <TableHeaderCell align="right">Output cost</TableHeaderCell>
              <TableHeaderCell align="right">Per run</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {AI_STEPS.map((s) => {
              const b = stepBreakdown(s, routing[s.id])
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="flex flex-col">
                      <span className="type-label-md">{s.label}</span>
                      <span className="type-caption text-fg-tertiary">{s.help}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={routing[s.id]}
                      onValueChange={(v) => {
                        adminActions.setRouting(s.id, v, { step: s.label, from: modelName(routing[s.id]), to: modelName(v) })
                        showToast(`${s.label} now uses ${modelName(v)} · ${exact(stepCost(s, v))} per run`)
                      }}
                      options={AI_MODELS.filter((m) => m.kind === s.kind).map((m) => ({ value: m.id, label: `${m.name} · ${exact(stepCost(s, m.id))}` }))}
                      className="h-10"
                    />
                  </TableCell>
                  {s.kind === "image" ? (
                    <>
                      <TableCell align="right" className="text-fg-tertiary">
                        {s.images} images
                      </TableCell>
                      <TableCell align="right" className="text-fg-tertiary">
                        —
                      </TableCell>
                      <TableCell align="right" className="text-fg-tertiary">
                        —
                      </TableCell>
                      <TableCell align="right" className="text-fg-secondary">
                        {s.images} × {exact(b.total / (s.images ?? 1))}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="right">{tokens(s.avgIn)}</TableCell>
                      <TableCell align="right">{tokens(s.avgOut)}</TableCell>
                      <TableCell align="right" className="text-fg-secondary">
                        {exact(b.input)}
                      </TableCell>
                      <TableCell align="right" className="text-fg-secondary">
                        {exact(b.output)}
                      </TableCell>
                    </>
                  )}
                  <TableCell align="right" className="type-label-md">
                    {exact(b.total)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <p className="type-caption text-fg-tertiary">
          Per run = tokens in × input price + tokens out × output price (prices per million tokens). Token counts are averages per run. List prices without prompt
          caching or the Batch API — caching the system prompt and brief would bring input costs down.
        </p>
      </PanelSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSection title="Cost of a first build" className="xl:col-span-2">
          <ul className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((p) => {
              const pages = BUILD_PAGES[p.id]
              const cost = firstBuildCost(routing, pages)
              return (
                <li key={p.id} className="flex flex-col gap-1 rounded-md border border-line-default p-4">
                  <span className="flex items-center gap-2">
                    <PlanBadge plan={p.id} />
                    <span className="type-caption text-fg-tertiary">
                      {pages} {pages === 1 ? "page" : "pages"}
                    </span>
                  </span>
                  <span className="type-h4 text-fg-primary tabular-nums">{exact(cost)}</span>
                  <span className="type-caption text-fg-tertiary">{p.price ? `${Math.round((cost / p.price) * 100)}% of the first month (${usd(p.price)})` : "Not paid back — Free plan"}</span>
                </li>
              )
            })}
          </ul>
          <p className="type-caption text-fg-tertiary">
            Brief, style and sitemap once; then a page build, images and a safety scan for every page. Editor changes come on top: {exact(stepCost(AI_STEPS.find((x) => x.id === "edit")!, routing.edit))} each.
          </p>
        </PanelSection>
        <PanelSection title="Model prices" actions={<span className="type-caption text-fg-tertiary">Checked {PRICES_CHECKED}</span>}>
          <dl className="flex flex-col gap-3">
            {AI_MODELS.map((m) => (
              <div key={m.id} className="flex flex-col">
                <span className="flex items-baseline justify-between gap-3">
                  <dt className="type-label-md text-fg-primary">{m.name}</dt>
                  <dd className="type-body-sm text-fg-primary tabular-nums">{m.kind === "image" ? `${exact(m.perImage ?? 0)} / image` : `${price(m.input)} in · ${price(m.output)} out`}</dd>
                </span>
                <span className="type-caption text-fg-tertiary">{m.kind === "image" ? m.source : "per million tokens · prompts up to 100K tokens"}</span>
              </div>
            ))}
          </dl>
        </PanelSection>
      </div>
    </>
  )
}
