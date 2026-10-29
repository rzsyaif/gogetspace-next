"use client"

import Link from "next/link"
import { CreditCard, Globe2, ShieldAlert, ShieldX, Sparkles, Timer, Zap } from "lucide-react"
import { Button, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui"
import { AreaChart, BarList, StatTile } from "@/components/account/charts"
import { PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { PLANS, planInfo } from "@/lib/plans"
import { AI_DAILY, SERVICES, clientGrowth, costPerGeneration, generationsIn, mrrHistory, mrrOf, relDays, usd } from "@/lib/admin/data"
import { useAdmin } from "@/lib/admin/store"
import { AttentionRow, ClientCell, ClientStatusBadge, PlanBadge } from "./common"

/** The first screen: revenue, growth, AI cost, and what needs someone today. */
export function AdminOverview() {
  const { clients, sites, subscriptions, payments, domains, reports, routing } = useAdmin()
  const mrr = mrrOf(subscriptions)
  const history = mrrHistory(subscriptions)
  const lastMonth = history[history.length - 2].value
  const paying = subscriptions.filter((s) => s.status !== "canceled").length
  const signups30 = clients.filter((c) => c.joinedAgo < 30).length
  const signupsPrev = clients.filter((c) => c.joinedAgo >= 30 && c.joinedAgo < 60).length
  const perGen = costPerGeneration(routing)
  const aiCost = generationsIn(30) * perGen
  const aiPrev = generationsIn(30, 30) * perGen
  const recentGen = AI_DAILY.slice(-7)
  const success = 1 - recentGen.reduce((n, d) => n + d.failed, 0) / recentGen.reduce((n, d) => n + d.generations, 0)

  const failed = payments.filter((p) => p.status === "failed")
  const dnsStuck = domains.filter((d) => d.health === "pending_dns" && (d.waitingHours ?? 0) >= 48)
  const ssl = domains.filter((d) => d.health === "ssl_error")
  const expiring = domains.filter((d) => d.health === "expiring" && !d.autoRenew)
  const openReports = reports.filter((r) => r.status === "open")
  const overAllowance = sites.filter((s) => s.credits > planInfo(s.plan).credits + s.bonusCredits)
  const degraded = SERVICES.filter((s) => s.status !== "operational")
  const clientOf = (id: string) => clients.find((c) => c.id === id)!

  const newest = [...clients].sort((a, b) => a.joinedAgo - b.joinedAgo).slice(0, 6)

  return (
    <PanelPage>
      <PanelHeader title="Overview" description={`Thursday, 29 October · ${clients.length} clients · ${sites.length} websites`} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Monthly recurring revenue" value={usd(mrr)} delta={lastMonth ? mrr / lastMonth - 1 : null} />
        <StatTile label="Paying websites" value={String(paying)} delta={null} />
        <StatTile label="New clients · 30 days" value={String(signups30)} delta={signupsPrev ? signups30 / signupsPrev - 1 : null} />
        <StatTile label="AI cost · 30 days" value={usd(aiCost)} delta={aiCost / aiPrev - 1} upIsGood={false} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSection title="Needs attention" className="xl:col-span-2">
          <ul className="flex flex-col divide-y divide-line-default">
            {failed.length > 0 && (
              <AttentionRow
                tone="error"
                icon={<CreditCard />}
                title={`${failed.length} failed ${failed.length === 1 ? "payment" : "payments"}`}
                text={failed.map((p) => `${clientOf(p.clientId).name} · ${usd(p.amount)} · ${p.failure}`).join("  ·  ")}
                href="/admin/billing?tab=failed"
                action="Review"
              />
            )}
            {openReports.length > 0 && (
              <AttentionRow tone="error" icon={<ShieldAlert />} title={`${openReports.length} open abuse ${openReports.length === 1 ? "report" : "reports"}`} text={openReports.map((r) => r.reason).join(" · ")} href="/admin/moderation" action="Review" />
            )}
            {dnsStuck.length > 0 && (
              <AttentionRow icon={<Timer />} title={`${dnsStuck.length} domains waiting for DNS over 2 days`} text={dnsStuck.map((d) => `${d.name} · ${d.waitingHours} h`).join(" · ")} href="/admin/domains?filter=pending_dns" action="Help" />
            )}
            {ssl.length + expiring.length > 0 && (
              <AttentionRow
                icon={<ShieldX />}
                title={[ssl.length && `${ssl.length} SSL error`, expiring.length && `${expiring.length} expiring without auto-renew`].filter(Boolean).join(" · ")}
                text={[...ssl, ...expiring].map((d) => d.name).join(" · ")}
                href="/admin/domains?filter=issues"
                action="Fix"
              />
            )}
            {overAllowance.length > 0 && (
              <AttentionRow
                icon={<Zap />}
                title={`${overAllowance.length} websites over their credit allowance`}
                text={overAllowance.map((s) => `${s.name} · ${s.credits}/${planInfo(s.plan).credits}`).join(" · ")}
                href="/admin/ai#top-spenders"
                action="Check"
              />
            )}
            {degraded.map((s) => (
              <AttentionRow key={s.name} tone="neutral" icon={<Sparkles />} title={`${s.name} is degraded`} text={s.note ?? s.role} href="/admin/system" action="Status" />
            ))}
          </ul>
        </PanelSection>

        <PanelSection title="Platform">
          <dl className="grid grid-cols-2 gap-4">
            <Metric label="Generation success · 7 days" value={`${(success * 100).toFixed(1)}%`} />
            <Metric label="Cost per generation" value={usd(perGen, true)} />
            <Metric label="AI cost vs revenue" value={`${Math.round((aiCost / Math.max(1, mrr)) * 100)}%`} />
            <Metric label="Live websites" value={String(sites.filter((s) => s.status === "live").length)} />
          </dl>
          <Button asChild variant="link" className="self-start">
            <Link href="/admin/ai">Open AI usage</Link>
          </Button>
        </PanelSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelSection title="MRR · last 12 months">
          <AreaChart points={history} label="Monthly recurring revenue" unit="USD" height={220} />
        </PanelSection>
        <PanelSection title="Clients · last 26 weeks">
          <AreaChart points={clientGrowth(clients)} label="Total clients" unit="clients" height={220} />
        </PanelSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSection title="Websites by plan">
          <BarList rows={PLANS.map((p) => ({ label: p.name, sub: p.price ? `${usd(p.price)}/mo` : undefined, value: sites.filter((s) => s.plan === p.id).length }))} />
          <p className="type-caption text-fg-tertiary">
            {Math.round((paying / sites.length) * 100)}% of websites are on a paid plan. Plans are per website, so one client can pay for several.
          </p>
        </PanelSection>
        <PanelSection title="Newest clients" className="xl:col-span-2" actions={<Button asChild size="sm" variant="secondary"><Link href="/admin/clients">All clients</Link></Button>}>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Joined</TableHeaderCell>
                <TableHeaderCell>Websites</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {newest.map((c) => {
                const own = sites.filter((s) => s.clientId === c.id)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <ClientCell client={c} sub={`${c.city}, ${c.country}`} />
                    </TableCell>
                    <TableCell className="text-fg-secondary">{relDays(c.joinedAgo)}</TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {own.map((s) => (
                          <PlanBadge key={s.id} plan={s.plan} />
                        ))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge client={c} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </PanelSection>
      </div>
      <p className="flex items-center gap-2 type-caption text-fg-tertiary">
        <Globe2 className="size-4" /> Sample data for the prototype. Actions you take here are saved for this tab only and show up in the audit log.
      </p>
    </PanelPage>
  )
}

export function Metric({ label, value, tone }: { label: string; value: string; tone?: "error" | "warning" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="type-caption text-fg-tertiary">{label}</dt>
      <dd className={tone === "error" ? "type-h5 text-status-error-text tabular-nums" : tone === "warning" ? "type-h5 text-status-warning-text tabular-nums" : "type-h5 text-fg-primary tabular-nums"}>{value}</dd>
    </div>
  )
}
