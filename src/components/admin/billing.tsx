"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MoreHorizontal, RotateCcw, Search } from "lucide-react"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui"
import { BarList, StatTile } from "@/components/account/charts"
import { PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { PLANS, planInfo } from "@/lib/plans"
import { fmtDate, mrrOf, usd, type Payment } from "@/lib/admin/data"
import { adminActions, showToast, useAdmin } from "@/lib/admin/store"
import { FilterBar, PaymentBadge, PlanBadge, ReasonDialog, SubStatusBadge } from "./common"

type Tab = "subscriptions" | "payments" | "failed"

export function BillingPage() {
  const { subscriptions, payments, sites, clients } = useAdmin()
  const params = useSearchParams()
  const initial = params.get("tab") as Tab | null
  const [tab, setTab] = useState<Tab>(initial ?? "subscriptions")
  const [q, setQ] = useState("")
  const mrr = mrrOf(subscriptions)
  const month = payments.filter((p) => p.daysAgo < 30)
  const revenue30 = month.filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0)
  const refunds30 = month.filter((p) => p.status === "refunded").reduce((n, p) => n + p.amount, 0)
  const failed = payments.filter((p) => p.status === "failed")
  const pastDue = failed.reduce((n, p) => n + p.amount, 0)
  const site = (id: string | null) => sites.find((s) => s.id === id)
  const client = (id: string) => clients.find((c) => c.id === id)!
  const term = q.trim().toLowerCase()
  const match = (...xs: (string | undefined)[]) => !term || xs.some((x) => x?.toLowerCase().includes(term))
  const domainRevenue = payments.filter((p) => p.status === "paid" && p.description.includes("year")).reduce((n, p) => n + p.amount, 0)

  return (
    <PanelPage>
      <PanelHeader title="Billing" description="Plans are billed per website, monthly. Domains are billed yearly, separately from plans." />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="MRR" value={usd(mrr)} />
        <StatTile label="ARR (MRR × 12)" value={usd(mrr * 12)} />
        <StatTile label="Collected · 30 days" value={usd(revenue30)} />
        <StatTile label="Past due" value={usd(pastDue)} className={pastDue ? "border-status-error-border" : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSection title="MRR by plan">
          <BarList
            format={(v) => usd(v)}
            rows={PLANS.filter((p) => p.price > 0).map((p) => ({
              label: p.name,
              sub: `${subscriptions.filter((s) => s.plan === p.id && s.status !== "canceled").length} websites`,
              value: subscriptions.filter((s) => s.plan === p.id && s.status !== "canceled").length * p.price,
            }))}
          />
        </PanelSection>
        <PanelSection title="Other revenue">
          <dl className="flex flex-col gap-3 type-body-sm">
            <Row label="Domain sales · all time" value={usd(domainRevenue)} />
            <Row label="Refunds · 30 days" value={usd(refunds30)} />
            <Row label="Canceled this month" value={String(subscriptions.filter((s) => s.status === "canceled").length)} />
          </dl>
        </PanelSection>
        <PanelSection title="Payment provider">
          <p className="type-body-sm text-fg-secondary">Cards, invoices and payouts live with the payment provider. This console reads from it and sends refunds and retries back to it.</p>
          <p className="type-caption text-fg-tertiary">Payouts every 2 days · USD · next payout {usd(Math.round(revenue30 / 15))}</p>
        </PanelSection>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col gap-4">
        <FilterBar>
          <TabsList className="max-w-full overflow-x-auto [&>*]:shrink-0">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="failed">Failed · {failed.length}</TabsTrigger>
          </TabsList>
          <div className="md:ml-auto md:w-[300px]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client, website or payment ID" aria-label="Search billing" leadingIcon={<Search />} className="h-11" />
          </div>
        </FilterBar>

        <TabsContent value="subscriptions">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Website</TableHeaderCell>
                <TableHeaderCell>Client</TableHeaderCell>
                <TableHeaderCell>Plan</TableHeaderCell>
                <TableHeaderCell align="right">Price</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Started</TableHeaderCell>
                <TableHeaderCell>Next</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {subscriptions
                .filter((s) => match(site(s.siteId)?.name, client(s.clientId).name))
                .map((s) => (
                  <TableRow key={s.siteId}>
                    <TableCell>
                      <span className="block max-w-[260px] truncate type-label-md">{site(s.siteId)?.name}</span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/clients/${s.clientId}?tab=billing`} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:focus-ring">
                        {client(s.clientId).name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={s.plan} />
                    </TableCell>
                    <TableCell align="right">{usd(planInfo(s.plan).price)}/mo</TableCell>
                    <TableCell>
                      <SubStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-fg-secondary">{fmtDate(s.startedAgo)}</TableCell>
                    <TableCell className={s.renewsIn < 0 ? "text-status-error-text" : "text-fg-secondary"}>
                      {s.status === "canceled" ? `Ends ${fmtDate(-s.renewsIn)}` : s.renewsIn < 0 ? `Overdue ${-s.renewsIn} d` : `Renews ${fmtDate(-s.renewsIn)}`}
                    </TableCell>
                    <TableCell align="right">{s.status !== "canceled" && <CancelSub siteId={s.siteId} name={site(s.siteId)?.name ?? s.siteId} />}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTable rows={payments.filter((p) => match(p.id, p.description, client(p.clientId).name))} clientName={(id) => client(id).name} />
        </TabsContent>

        <TabsContent value="failed" className="flex flex-col gap-3">
          {failed.filter((p) => match(p.id, p.description, client(p.clientId).name)).length === 0 && <p className="type-body-sm text-fg-secondary">No failed payments. 🎉</p>}
          {failed
            .filter((p) => match(p.id, p.description, client(p.clientId).name))
            .map((p) => (
              <section key={p.id} className="flex flex-col gap-3 rounded-lg border border-status-error-border bg-status-error-bg/40 p-4 sm:flex-row sm:items-center">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-label-md text-fg-primary">
                    {client(p.clientId).name} · {usd(p.amount, true)}
                  </span>
                  <span className="type-body-sm text-fg-secondary">{p.description}</span>
                  <span className="type-caption text-status-error-text">
                    {p.failure} · {fmtDate(p.daysAgo)} · retried automatically 2 times
                  </span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      adminActions.resendEmail(client(p.clientId).email, "Payment failed — update your card")
                      showToast(`Card update email sent to ${client(p.clientId).email}`)
                    }}
                  >
                    Email client
                  </Button>
                  <Button
                    size="sm"
                    leadingIcon={<RotateCcw />}
                    onClick={() => {
                      adminActions.retryPayment(p.id)
                      showToast(`${usd(p.amount, true)} collected from ${client(p.clientId).name}`)
                    }}
                  >
                    Retry now
                  </Button>
                </div>
              </section>
            ))}
        </TabsContent>
      </Tabs>
    </PanelPage>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-fg-secondary">{label}</dt>
      <dd className="type-label-md text-fg-primary tabular-nums">{value}</dd>
    </div>
  )
}

function PaymentsTable({ rows, clientName }: { rows: Payment[]; clientName: (id: string) => string }) {
  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>Payment</TableHeaderCell>
          <TableHeaderCell>Client</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell align="right">Amount</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>
            <span className="sr-only">Actions</span>
          </TableHeaderCell>
        </tr>
      </TableHead>
      <TableBody>
        {rows.length === 0 && <TableEmpty colSpan={6}>No payments match.</TableEmpty>}
        {rows.slice(0, 40).map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <span className="flex max-w-[320px] flex-col">
                <span className="truncate">{p.description}</span>
                <span className="type-caption text-fg-tertiary">{p.id}</span>
              </span>
            </TableCell>
            <TableCell>
              <Link href={`/admin/clients/${p.clientId}?tab=billing`} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:focus-ring">
                {clientName(p.clientId)}
              </Link>
            </TableCell>
            <TableCell className="text-fg-secondary">{fmtDate(p.daysAgo)}</TableCell>
            <TableCell align="right">{usd(p.amount, true)}</TableCell>
            <TableCell>
              <PaymentBadge status={p.status} />
            </TableCell>
            <TableCell align="right">
              <PaymentActions payment={p} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Refund a paid payment or retry a failed one. */
export function PaymentActions({ payment }: { payment: Payment }) {
  const [refund, setRefund] = useState(false)
  if (payment.status === "refunded") return null
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton aria-label={`Actions for ${payment.id}`}>
            <MoreHorizontal />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {payment.status === "failed" && (
            <DropdownMenuItem
              onSelect={() => {
                adminActions.retryPayment(payment.id)
                showToast(`${usd(payment.amount, true)} collected`)
              }}
            >
              Retry payment
            </DropdownMenuItem>
          )}
          {payment.status === "paid" && (
            <DropdownMenuItem tone="danger" onSelect={() => setRefund(true)}>
              Refund {usd(payment.amount, true)}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ReasonDialog
        open={refund}
        onOpenChange={setRefund}
        title={`Refund ${usd(payment.amount, true)}?`}
        description={`${payment.description} · ${payment.id}. The money goes back to the card in 5–10 days. The plan itself isn't changed.`}
        confirmLabel="Refund"
        destructive
        onConfirm={(r) => {
          adminActions.refund(payment.id, r)
          showToast(`Refunded ${usd(payment.amount, true)}`)
        }}
      />
    </>
  )
}

function CancelSub({ siteId, name }: { siteId: string; name: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Cancel
      </Button>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title={`Cancel ${name}'s plan?`}
        description="It keeps the plan until the end of the period it's paid for, then moves to Free. Nothing is refunded automatically."
        confirmLabel="Cancel subscription"
        destructive
        onConfirm={() => {
          adminActions.cancelSubscription(siteId)
          showToast(`${name} will move to Free at the end of the period`)
        }}
        optionalReason
      />
    </>
  )
}
