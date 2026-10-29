"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, LogIn, Mail, MoreHorizontal, Search } from "lucide-react"
import {
  Avatar,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  ProgressBar,
  SegmentedControl,
  Select,
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
  Textarea,
} from "@/components/ui"
import { DetailCard, PanelEmpty, PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { planInfo } from "@/lib/plans"
import { DOMAIN_HEALTH, EMAILS, ME, fmtDate, minutesLabel, relDays, usd, type Client } from "@/lib/admin/data"
import { adminActions, minutesSince, showToast, useAdmin } from "@/lib/admin/store"
import { ClientCell, ClientStatusBadge, FilterBar, PaymentBadge, PlanBadge, ReasonDialog, SiteCell, SiteStatusBadge, SubStatusBadge } from "./common"
import { PaymentActions } from "./billing"
import { SiteActions } from "./sites"

type Filter = "all" | "paying" | "free" | "attention"
type Sort = "newest" | "mrr" | "active"

/* ---------------- list ---------------- */

export function ClientsPage() {
  const { clients, sites, subscriptions } = useAdmin()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<Sort>("newest")
  const mrrFor = (id: string) => subscriptions.filter((s) => s.clientId === id && s.status !== "canceled").reduce((n, s) => n + planInfo(s.plan).price, 0)
  const pastDue = (id: string) => subscriptions.some((s) => s.clientId === id && s.status === "past_due")

  const term = q.trim().toLowerCase()
  const rows = clients
      .filter((c) => {
        if (term && ![c.name, c.email, c.phone, c.city, ...sites.filter((s) => s.clientId === c.id).map((s) => s.name)].some((x) => x.toLowerCase().includes(term))) return false
        if (filter === "paying") return mrrFor(c.id) > 0
        if (filter === "free") return mrrFor(c.id) === 0
        if (filter === "attention") return c.status !== "active" || !c.verified || pastDue(c.id)
        return true
      })
    .sort((a, b) => (sort === "mrr" ? mrrFor(b.id) - mrrFor(a.id) : sort === "active" ? a.lastActiveAgo - b.lastActiveAgo : a.joinedAgo - b.joinedAgo))

  return (
    <PanelPage>
      <PanelHeader title="Clients" description={`${clients.length} accounts. One client can own several websites, each with its own plan.`} />
      <FilterBar>
        <div className="md:w-[320px]">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone or website" aria-label="Search clients" leadingIcon={<Search />} className="h-11" />
        </div>
        <SegmentedControl
          label="Show"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "paying", label: "Paying" },
            { value: "free", label: "Free only" },
            { value: "attention", label: "Needs attention" },
          ]}
          className="max-w-full overflow-x-auto"
        />
        <div className="md:ml-auto md:w-[200px]">
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as Sort)}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "mrr", label: "Highest MRR" },
              { value: "active", label: "Recently active" },
            ]}
            className="h-11"
          />
        </div>
      </FilterBar>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Client</TableHeaderCell>
            <TableHeaderCell>Location</TableHeaderCell>
            <TableHeaderCell>Websites</TableHeaderCell>
            <TableHeaderCell align="right">MRR</TableHeaderCell>
            <TableHeaderCell>Joined</TableHeaderCell>
            <TableHeaderCell>Last active</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {rows.length === 0 && <TableEmpty colSpan={7}>No clients match.</TableEmpty>}
          {rows.map((c) => {
            const own = sites.filter((s) => s.clientId === c.id)
            const mrr = mrrFor(c.id)
            return (
              <TableRow key={c.id}>
                <TableCell>
                  <ClientCell client={c} />
                </TableCell>
                <TableCell className="text-fg-secondary">
                  {c.city}, {c.country}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{own.length}</span>
                    <span className="flex flex-wrap gap-1">
                      {own.map((s) => (
                        <PlanBadge key={s.id} plan={s.plan} />
                      ))}
                    </span>
                  </span>
                </TableCell>
                <TableCell align="right">{mrr ? usd(mrr) : "—"}</TableCell>
                <TableCell className="text-fg-secondary">{fmtDate(c.joinedAgo)}</TableCell>
                <TableCell className="text-fg-secondary">{relDays(c.lastActiveAgo)}</TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    <ClientStatusBadge client={c} />
                    {pastDue(c.id) && <Badge tone="error">Past due</Badge>}
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </PanelPage>
  )
}

/* ---------------- one client ---------------- */

const TABS = ["sites", "billing", "domains", "activity", "notes"] as const
type Tab = (typeof TABS)[number]

export function ClientDetail({ id }: { id: string }) {
  const s = useAdmin()
  const params = useSearchParams()
  const router = useRouter()
  const initial = params.get("tab") as Tab | null
  const [tab, setTab] = useState<Tab>(initial && TABS.includes(initial) ? initial : "sites")
  const [dialog, setDialog] = useState<null | "impersonate" | "suspend" | "reactivate" | "delete">(null)
  const client = s.clients.find((c) => c.id === id)

  if (!client)
    return (
      <PanelPage>
        <PanelEmpty icon={<Search />} title="No client with that ID" text="They may have been deleted, or the link is wrong." action={<Button asChild variant="secondary"><Link href="/admin/clients">All clients</Link></Button>} />
      </PanelPage>
    )

  const sites = s.sites.filter((x) => x.clientId === id)
  const subs = s.subscriptions.filter((x) => x.clientId === id)
  const payments = s.payments.filter((x) => x.clientId === id)
  const domains = s.domains.filter((x) => x.clientId === id)
  const mrr = subs.filter((x) => x.status !== "canceled").reduce((n, x) => n + planInfo(x.plan).price, 0)
  const lifetime = payments.filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0)
  const names = new Set([client.name, ...sites.map((x) => x.name), ...domains.map((d) => d.name)])
  const activity = s.audit.filter((a) => names.has(a.target))
  const emails = EMAILS.filter((e) => e.clientId === id)
  const notes = s.notes[id] ?? []

  return (
    <PanelPage>
      <Button asChild variant="link" className="self-start">
        <Link href="/admin/clients">
          <ArrowLeft className="size-4" /> All clients
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={client.name} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="type-h3 text-fg-primary">{client.name}</h1>
            <ClientStatusBadge client={client} />
          </div>
          <p className="type-body-sm text-fg-secondary">
            {client.email} · {client.phone} · {client.city}, {client.country}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leadingIcon={<LogIn />} onClick={() => setDialog("impersonate")} disabled={client.status === "deletion"}>
            Log in as {client.name.split(" ")[0]}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon-md" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem
                onSelect={() => {
                  adminActions.sendPasswordReset(id)
                  showToast(`Password reset sent to ${client.email}`)
                }}
              >
                <Mail className="size-4" /> Send password reset
              </DropdownMenuItem>
              {!client.verified && (
                <DropdownMenuItem
                  onSelect={() => {
                    adminActions.verifyEmail(id)
                    showToast("Email marked as verified")
                  }}
                >
                  Mark email as verified
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {client.status === "suspended" ? (
                <DropdownMenuItem onSelect={() => setDialog("reactivate")}>Reactivate account</DropdownMenuItem>
              ) : (
                <DropdownMenuItem tone="danger" onSelect={() => setDialog("suspend")}>
                  Suspend account
                </DropdownMenuItem>
              )}
              {client.status !== "deletion" && (
                <DropdownMenuItem tone="danger" onSelect={() => setDialog("delete")}>
                  Delete account and data
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DetailCard label="MRR" value={mrr ? usd(mrr) : "Free only"} meta={`${subs.filter((x) => x.status !== "canceled").length} paid of ${sites.length} websites`} />
        <DetailCard label="Lifetime paid" value={usd(lifetime)} meta={client.card ? `${client.card.brand} •••• ${client.card.last4}` : "No card saved"} />
        <DetailCard label="Joined" value={fmtDate(client.joinedAgo)} meta={`Signed up with ${client.signup}`} />
        <DetailCard label="Last active" value={relDays(client.lastActiveAgo)} meta={client.verified ? "Email verified" : "Email not verified"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col gap-4">
        <TabsList className="max-w-full overflow-x-auto [&>*]:shrink-0">
          <TabsTrigger value="sites">Websites · {sites.length}</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="domains">Domains · {domains.length}</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notes">Notes · {notes.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="flex flex-col gap-4">
          {sites.map((site) => {
            const allowance = planInfo(site.plan).credits + site.bonusCredits
            return (
              <section key={site.id} className="flex flex-col gap-4 rounded-lg border border-line-default p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                    <SiteCell site={site} />
                  </div>
                  <SiteStatusBadge status={site.status} />
                  <PlanBadge plan={site.plan} />
                  <SiteActions site={site} trigger="button" />
                </div>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Pages built" value={String(site.pages)} />
                  <Stat label="Visitors · 30 days" value={site.status === "live" ? site.visitors30.toLocaleString("en") : "—"} />
                  <Stat label="Enquiries · 30 days" value={site.status === "live" ? String(site.enquiries30) : "—"} />
                  <Stat label="Generations" value={`${site.generations}${site.failedGenerations ? ` · ${site.failedGenerations} failed` : ""}`} warn={site.failedGenerations > 0} />
                </dl>
                <ProgressBar
                  value={(site.credits / allowance) * 100}
                  ariaLabel="Credits used this month"
                  label={
                    <span>
                      Credits this month · {site.credits} of {allowance}
                      {site.bonusCredits > 0 && <span className="text-fg-tertiary"> (incl. {site.bonusCredits} granted)</span>}
                      {site.credits > allowance && <span className="text-status-error-text"> · over allowance</span>}
                    </span>
                  }
                />
              </section>
            )
          })}
        </TabsContent>

        <TabsContent value="billing" className="flex flex-col gap-6">
          <PanelSection title="Subscriptions">
            {subs.length === 0 ? (
              <p className="type-body-sm text-fg-secondary">Every website is on Free.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line-default">
                {subs.map((sub) => (
                  <li key={sub.siteId} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate type-label-md text-fg-primary">{s.sites.find((x) => x.id === sub.siteId)?.name}</span>
                      <span className="type-caption text-fg-tertiary">
                        {planInfo(sub.plan).name} · {usd(planInfo(sub.plan).price)}/mo · since {fmtDate(sub.startedAgo)} ·{" "}
                        {sub.status === "canceled" ? `ends in ${sub.renewsIn} days` : sub.renewsIn < 0 ? `overdue ${-sub.renewsIn} days` : `renews in ${sub.renewsIn} days`}
                      </span>
                    </span>
                    <SubStatusBadge status={sub.status} />
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Payment</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell align="right">Amount</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Actions</span>
                </TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {payments.length === 0 && <TableEmpty colSpan={5}>No payments yet.</TableEmpty>}
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="flex flex-col">
                      <span>{p.description}</span>
                      <span className="type-caption text-fg-tertiary">
                        {p.id}
                        {p.failure && ` · ${p.failure}`}
                      </span>
                    </span>
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
        </TabsContent>

        <TabsContent value="domains">
          {domains.length === 0 ? (
            <PanelEmpty icon={<Search />} title="No domains" text="This client only uses free .get.space addresses." />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {domains.map((d) => (
                <li key={d.name}>
                  <DetailCard
                    label={d.source === "GoGetSpace" ? "Bought through GoGetSpace" : "Connected from elsewhere"}
                    value={d.name}
                    trailing={<Badge tone={DOMAIN_HEALTH[d.health].tone}>{DOMAIN_HEALTH[d.health].label}</Badge>}
                    meta={`${d.siteId ? `On ${s.sites.find((x) => x.id === d.siteId)?.name}` : "Not used on a website"} · ${d.source === "GoGetSpace" ? `${d.autoRenew ? "renews" : "expires"} in ${d.expiresIn} days` : "registrar elsewhere"}`}
                  >
                    <Button asChild size="sm" variant="link" className="mt-1 self-start">
                      <Link href={`/admin/domains?q=${encodeURIComponent(d.name)}`}>Manage in Domains</Link>
                    </Button>
                  </DetailCard>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="activity" className="grid gap-6 lg:grid-cols-2">
          <PanelSection title="Admin actions">
            {activity.length === 0 ? (
              <p className="type-body-sm text-fg-secondary">Nobody on the team has changed this account.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex flex-col">
                    <span className="type-label-md text-fg-primary">
                      {a.action} · {a.target}
                    </span>
                    <span className="type-caption text-fg-tertiary">
                      {a.actor} · {minutesLabel(minutesSince(a))}
                      {a.detail && ` · ${a.detail}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
          <PanelSection title="Emails sent">
            {emails.length === 0 ? (
              <p className="type-body-sm text-fg-secondary">No emails in the last 30 days.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {emails.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate type-label-md text-fg-primary">{e.template}</span>
                      <span className="type-caption text-fg-tertiary">
                        {e.to} · {minutesLabel(e.minutesAgo)}
                      </span>
                    </span>
                    <Badge tone={e.status === "bounced" ? "error" : e.status === "opened" ? "success" : "neutral"}>{e.status === "bounced" ? "Bounced" : e.status === "opened" ? "Opened" : "Delivered"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </TabsContent>

        <TabsContent value="notes">
          <Notes clientId={id} notes={notes} />
        </TabsContent>
      </Tabs>

      <ReasonDialog
        open={dialog === "impersonate"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Log in as ${client.name}?`}
        description="You'll see their dashboard exactly as they do. Anything you change is saved to their account, and the session is recorded."
        reasonLabel="Why do you need access?"
        reasonPlaceholder="e.g. ticket #2240 — can't find the Publish button"
        confirmLabel="Start session"
        onConfirm={(r) => {
          adminActions.impersonate(id, r)
          if (client.id === "frank-tan") router.push("/dashboard")
          else showToast(`Support session started for ${client.name} (the prototype only has Frank Tan's dashboard)`, "info")
        }}
      />
      <ReasonDialog
        open={dialog === "suspend"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Suspend ${client.name}?`}
        description={`They can't log in, and their ${sites.filter((x) => x.status === "live").length} live websites are unpublished. Subscriptions keep running until you cancel them.`}
        confirmLabel="Suspend"
        destructive
        onConfirm={(r) => {
          adminActions.setClientStatus(id, "suspended", r)
          showToast(`${client.name} is suspended`)
        }}
      />
      <ReasonDialog
        open={dialog === "reactivate"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Reactivate ${client.name}?`}
        description="They can log in again. Their websites stay unpublished until you or they republish them."
        confirmLabel="Reactivate"
        onConfirm={(r) => {
          adminActions.setClientStatus(id, "active", r)
          showToast(`${client.name} is active again`)
        }}
      />
      <ReasonDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Delete ${client.name}'s account?`}
        description="Websites, enquiries (including the personal data their visitors sent) and analytics are deleted after a 30-day grace period. Invoices are kept for 7 years for tax."
        confirmLabel="Schedule deletion"
        destructive
        confirmText="DELETE"
        onConfirm={(r) => {
          adminActions.setClientStatus(id, "deletion", r)
          showToast("Deletion scheduled in 30 days")
        }}
      />
    </PanelPage>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="type-caption text-fg-tertiary">{label}</dt>
      <dd className={warn ? "type-label-lg text-status-warning-text tabular-nums" : "type-label-lg text-fg-primary tabular-nums"}>{value}</dd>
    </div>
  )
}

function Notes({ clientId, notes }: { clientId: Client["id"]; notes: { text: string; by: string; at: number }[] }) {
  const [text, setText] = useState("")
  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          adminActions.addNote(clientId, text.trim())
          setText("")
        }}
      >
        <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Only the team sees notes. Don't paste card numbers or medical details." aria-label="New note" />
        <Button type="submit" size="sm" className="self-end" disabled={!text.trim()}>
          Add note
        </Button>
      </form>
      <ul className="flex flex-col gap-3">
        {notes.map((n, i) => (
          <li key={i} className="flex flex-col gap-1 rounded-md bg-subtle p-4">
            <p className="type-body-sm text-fg-primary">{n.text}</p>
            <p className="type-caption text-fg-tertiary">
              {n.by === ME.name ? "You" : n.by} · {n.at ? minutesLabel(minutesSince({ at: n.at })) : "Last week"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
