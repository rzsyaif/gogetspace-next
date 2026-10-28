"use client"

import { useState } from "react"
import { BarChart3, Lock } from "lucide-react"
import { Alert, Button, SegmentedControl } from "@/components/ui"
import { planInfo, type Plan } from "@/lib/plans"
import { KEY_ACTIONS, SOURCES, TOP_PAGES, dailyStats, type DayStat, type Site } from "@/lib/account/data"
import { AreaChart, BarList, StatTile } from "./charts"
import { PanelEmpty, PanelHeader, PanelSection } from "./panel"

const PERIODS = [
  { days: 7, label: "7 days", needs: "free" as Plan },
  { days: 30, label: "30 days", needs: "starter" as Plan },
  { days: 365, label: "12 months", needs: "business" as Plan },
]

// the prototype's "today", so labels stay stable between renders
const TODAY = new Date(2026, 9, 28)
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" })
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short" })
const dateAgo = (ago: number) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - ago)
const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const sum = (d: DayStat[], k: "visitors" | "enquiries") => d.reduce((n, x) => n + x[k], 0)

/** Per-site analytics in plain terms: visitors, enquiries, where people come from and what they click. */
export function AnalyticsPanel({ site, plan, onUpgrade }: { site: Site; plan: Plan; onUpgrade: () => void }) {
  const [days, setDays] = useState(7)
  const [locked, setLocked] = useState<(typeof PERIODS)[number] | null>(null)
  const allowed = planInfo(plan).analyticsDays

  const all = dailyStats(site.id)
  if (site.status !== "live" || all.length === 0)
    return (
      <div className="flex flex-col gap-6">
        <PanelHeader title="Analytics" description={site.name} />
        <PanelEmpty
          icon={<BarChart3 />}
          title={site.status === "live" ? "Counting your first visitors" : "Analytics start when your site is live"}
          text={
            site.status === "live"
              ? "Your site was just published. The first numbers show up within a day."
              : "Once you publish, you'll see how many people visit, which pages they read, and how many get in touch."
          }
        />
      </div>
    )

  const period = all.slice(-days)
  const before = all.slice(-days * 2, -days)
  const visitors = sum(period, "visitors")
  const enquiries = sum(period, "enquiries")
  const change = (now: number, prev: number) => (before.length === days && prev ? now / prev - 1 : null)
  const conv = enquiries / Math.max(1, visitors)
  const prevConv = sum(before, "enquiries") / Math.max(1, sum(before, "visitors"))
  const whatsapp = Math.round(visitors * KEY_ACTIONS[1].rate)

  // a year reads better by week
  const points =
    days === 365
      ? Array.from({ length: Math.floor(period.length / 7) }, (_, i) => {
          const wk = period.slice(i * 7, i * 7 + 7)
          const d = dateAgo(wk[0].ago)
          return { label: d.getDate() <= 7 ? MONTH.format(d) : DAY.format(d), value: sum(wk, "visitors") }
        })
      : period.map((d) => ({ label: DAY.format(dateAgo(d.ago)), value: d.visitors }))

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Analytics"
        description={`${site.name} · ${planInfo(plan).name} plan shows the last ${allowed === 365 ? "12 months" : `${allowed} days`}`}
        actions={
          <SegmentedControl
            label="Period"
            size="sm"
            value={days}
            onChange={(v) => {
              const p = PERIODS.find((x) => x.days === v)!
              if (p.days > allowed) setLocked(p)
              else {
                setLocked(null)
                setDays(v)
              }
            }}
            options={PERIODS.map((p) => ({ value: p.days, label: p.label, icon: p.days > allowed ? <Lock /> : undefined, tooltip: p.days > allowed ? `${planInfo(p.needs).name} plan` : undefined }))}
          />
        }
      />

      {locked && (
        <Alert
          tone="info"
          size="sm"
          title={`${locked.label} of history comes with ${planInfo(locked.needs).name}`}
          actions={
            <>
              <Button size="sm" onClick={onUpgrade}>See plans</Button>
              <Button size="sm" variant="secondary" onClick={() => setLocked(null)}>Not now</Button>
            </>
          }
          onDismiss={() => setLocked(null)}
        >
          Upgrading {site.name} keeps the numbers you already have — older history appears straight away.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Visitors" value={visitors.toLocaleString("en")} delta={change(visitors, sum(before, "visitors"))} />
        <StatTile label="Enquiries" value={enquiries.toLocaleString("en")} delta={change(enquiries, sum(before, "enquiries"))} />
        <StatTile label="Visitors who got in touch" value={pct(conv)} delta={before.length === days ? conv / prevConv - 1 : null} />
        <StatTile label="WhatsApp clicks" value={whatsapp.toLocaleString("en")} delta={change(visitors, sum(before, "visitors"))} />
      </div>

      <PanelSection title={days === 365 ? "Visitors per week" : "Visitors per day"}>
        <AreaChart points={points} label={days === 365 ? "Visitors per week" : "Visitors per day"} unit="visitors" />
      </PanelSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSection title="Most-read pages">
          <BarList rows={TOP_PAGES.map((p) => ({ label: p.page, value: Math.round(visitors * p.share * 1.6) }))} />
        </PanelSection>
        <PanelSection title="Where visitors come from">
          <BarList rows={SOURCES.map((s) => ({ label: s.source, value: Math.round(visitors * s.share) }))} />
        </PanelSection>
        <PanelSection title="What visitors click">
          <BarList rows={KEY_ACTIONS.map((a) => ({ label: a.action, sub: pct(a.rate), value: Math.round(visitors * a.rate) }))} />
        </PanelSection>
      </div>
    </div>
  )
}
