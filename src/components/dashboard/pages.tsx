"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, CreditCard, Download, ExternalLink, Globe, Link2, Plus, ShoppingCart } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Alert, Badge, Button, Checkbox, Dialog, DialogContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Field, Input, Select, Switch } from "@/components/ui"
import { BuyDomainDialog } from "@/components/account/buy-domain"
import { cn } from "@/lib/cn"
import { planInfo } from "@/lib/plans"
import { ACCOUNT, ENQUIRIES, dailyStats, siteUrl, type Site } from "@/lib/account/data"
import { accountActions, useAccountState } from "@/lib/account/store"
import { EnquiriesPanel } from "@/components/account/enquiries"
import { PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { NEW_SITE_HREF, SiteMark, StatusBadge } from "./shell"

const visitors7 = (id: string) => dailyStats(id).slice(-7).reduce((n, d) => n + d.visitors, 0)

/* ---------------- Websites ---------------- */

export function WebsitesPage() {
  const { sites, enquiryStatus } = useAccountState()
  const newFor = (id: string) => ENQUIRIES.filter((e) => e.siteId === id && enquiryStatus[e.id] === "new").length
  return (
    <PanelPage>
      <PanelHeader
        title="Websites"
        description="All your websites side by side. Each one has its own plan."
        actions={
          <Button asChild leadingIcon={<Plus />}>
            <Link href={NEW_SITE_HREF}>New website</Link>
          </Button>
        }
      />
      <div className="hidden overflow-hidden rounded-lg border border-line-default md:block">
        <table className="w-full text-left">
          <thead className="bg-subtle type-label-sm text-fg-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 text-right font-medium">Visitors · 7 days</th>
              <th className="px-4 py-3 text-right font-medium">New enquiries</th>
              <th className="px-4 py-3 font-medium">Last edited</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-default type-body-sm">
            {sites.map((s) => (
              <tr key={s.id} className="hover:bg-subtle/50">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <SiteMark site={s} className="size-8" />
                    <span className="flex min-w-0 flex-col">
                      <Link href={`/sites/${s.id}`} className="truncate type-label-md text-fg-primary hover:underline">
                        {s.name}
                      </Link>
                      <span className="truncate text-fg-tertiary">{siteUrl(s)}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge site={s} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/sites/${s.id}?tab=plan`} className="text-fg-primary hover:underline">
                    {planInfo(s.plan).name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{s.status === "live" ? visitors7(s.id).toLocaleString("en") : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{s.status === "live" ? newFor(s.id) : "—"}</td>
                <td className="px-4 py-3 text-fg-secondary">{s.lastEdited}</td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/sites/${s.id}`}>{s.built ? "Edit" : "Continue"}</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {sites.map((s) => (
          <li key={s.id}>
            <Link href={`/sites/${s.id}`} className="flex flex-col gap-3 rounded-lg border border-line-default p-4 hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
              <span className="flex items-center gap-3">
                <SiteMark site={s} className="size-8" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate type-label-md text-fg-primary">{s.name}</span>
                  <span className="truncate type-body-sm text-fg-tertiary">{siteUrl(s)}</span>
                </span>
                <StatusBadge site={s} />
              </span>
              <span className="flex flex-wrap gap-x-4 gap-y-1 type-body-sm text-fg-secondary">
                <span>{planInfo(s.plan).name} plan</span>
                {s.status === "live" && <span>{visitors7(s.id).toLocaleString("en")} visitors this week</span>}
                {s.status === "live" && newFor(s.id) > 0 && <span className="text-fg-link">{newFor(s.id)} new enquiries</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PanelPage>
  )
}

/* ---------------- Domains ---------------- */

export function DomainsPage() {
  const { sites, domains } = useAccountState()
  const params = useSearchParams()
  const [connect, setConnect] = useState(false)
  const [buy, setBuy] = useState(params.get("buy") === "1")
  const forSite = params.get("site") ?? undefined
  const usable = sites.filter((s) => planInfo(s.plan).customDomain)
  return (
    <PanelPage>
      <PanelHeader
        title="Domains"
        description="Every website gets a free .get.space address. Starter and Business plans can also use a domain you own."
        actions={
          <>
            <Button variant="secondary" leadingIcon={<Link2 />} onClick={() => setConnect(true)}>
              Connect one from elsewhere
            </Button>
            <Button leadingIcon={<ShoppingCart />} onClick={() => setBuy(true)}>
              Buy a domain
            </Button>
          </>
        }
      />

      <PanelSection title="Domains you own" actions={<span className="type-body-sm text-fg-tertiary">Bought through GoGetSpace</span>}>
        {domains.length === 0 ? (
          <p className="type-body-sm text-fg-secondary">None yet. Buy one and it connects to your website without any DNS steps.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line-default">
            {domains.map((d) => {
              const site = sites.find((x) => x.id === d.siteId)
              return (
                <li key={d.name} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate type-label-lg text-fg-primary">{d.name}</span>
                    <span className="type-body-sm text-fg-tertiary">
                      {d.autoRenew ? "Renews" : "Expires"} {d.expires}
                    </span>
                  </span>
                  {site ? (
                    <Badge tone="success" className="max-w-[260px] truncate">
                      In use · {site.name}
                    </Badge>
                  ) : (
                    <Badge dot={false}>Unused</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="secondary" trailingIcon={<ChevronDown />}>
                        {site ? "Manage" : "Use on a website"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      {usable.length > 0 && <DropdownMenuLabel>Point it at</DropdownMenuLabel>}
                      {usable
                        .filter((x) => x.id !== d.siteId)
                        .map((x) => (
                          <DropdownMenuItem key={x.id} onSelect={() => accountActions.assignDomain(x.id, d.name)}>
                            <span className="truncate">{x.name}</span>
                          </DropdownMenuItem>
                        ))}
                      {usable.length === 0 && <DropdownMenuLabel>Upgrade a website to Starter to use it</DropdownMenuLabel>}
                      {site && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem tone="danger" onSelect={() => accountActions.disconnectDomain(site.id)}>
                            Disconnect from {site.name}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              )
            })}
          </ul>
        )}
      </PanelSection>

      <h2 className="type-h6 text-fg-primary">Addresses by website</h2>
      <ul className="flex flex-col gap-3">
        {sites.flatMap((s) => [
          <DomainRow key={`${s.id}-free`} site={s} name={s.freeDomain} kind="Free address" status={s.status === "live" ? "Live" : "Ready when you publish"} ok={s.status === "live"} />,
          ...(s.domain
            ? [
                <DomainRow
                  key={`${s.id}-own`}
                  site={s}
                  name={s.domain.name}
                  kind="Your domain"
                  status={s.domain.status === "connected" ? "Connected" : "Waiting for DNS"}
                  ok={s.domain.status === "connected"}
                  pending={s.domain.status === "pending"}
                />,
              ]
            : []),
        ])}
      </ul>
      <ConnectDomainDialog open={connect} onOpenChange={setConnect} sites={sites} />
      <BuyDomainDialog open={buy} onOpenChange={setBuy} siteId={forSite} />
    </PanelPage>
  )
}

function DomainRow({ site, name, kind, status, ok, pending }: { site: Site; name: string; kind: string; status: string; ok: boolean; pending?: boolean }) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line-default p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Globe className="hidden size-6 shrink-0 text-fg-tertiary sm:block" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate type-label-lg text-fg-primary">{name}</span>
          <span className="truncate type-body-sm text-fg-secondary">
            {kind} · {site.name}
          </span>
        </div>
        <Badge tone={ok ? "success" : pending ? "warning" : "neutral"}>{status}</Badge>
        {ok && (
          <Button asChild size="sm" variant="secondary" trailingIcon={<ExternalLink />}>
            <a href={`/preview/${site.themeId}`} target="_blank" rel="noreferrer">
              Visit
            </a>
          </Button>
        )}
      </div>
      {pending && (
        <div className="rounded-md bg-subtle p-3 type-body-sm text-fg-secondary">
          Add these two records where you bought the domain. It usually connects within an hour.
          <dl className="mt-2 grid grid-cols-[64px_1fr] gap-x-3 gap-y-1 font-mono text-[13px] text-fg-primary sm:grid-cols-[64px_120px_1fr]">
            <dt className="text-fg-tertiary">A</dt>
            <dd className="max-sm:hidden">@</dd>
            <dd>76.76.21.21</dd>
            <dt className="text-fg-tertiary">CNAME</dt>
            <dd className="max-sm:hidden">www</dd>
            <dd>cname.get.space</dd>
          </dl>
        </div>
      )}
    </li>
  )
}

function ConnectDomainDialog({ open, onOpenChange, sites }: { open: boolean; onOpenChange: (o: boolean) => void; sites: Site[] }) {
  const eligible = sites.filter((s) => planInfo(s.plan).customDomain && !s.domain)
  const [siteId, setSiteId] = useState("")
  const [name, setName] = useState("")
  const chosen = siteId || eligible[0]?.id || ""
  const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(name.trim())
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Connect a domain you own"
        description="Pick the website, then type the domain. We'll show the records to add at your registrar."
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              disabled={!chosen || !valid}
              onClick={() => {
                accountActions.connectDomain(chosen, name.trim().toLowerCase())
                setName("")
                onOpenChange(false)
              }}
            >
              Connect
            </Button>
          </>
        }
      >
        {eligible.length === 0 ? (
          <Alert tone="info" size="sm" title="Custom domains come with Starter and Business">
            Your paid websites already have a domain. Upgrade another website to connect one to it.
          </Alert>
        ) : (
          <>
            <Field label="Website">
              <Select value={chosen} onValueChange={setSiteId} options={eligible.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Domain" helper={name && !valid ? "That doesn't look like a domain yet — e.g. rahmadental.com" : "Without https:// or www"}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="yourpractice.com" leadingIcon={<Globe />} />
            </Field>
          </>
        )}
        {sites.some((s) => !planInfo(s.plan).customDomain) && (
          <p className="type-body-sm text-fg-tertiary">
            Not listed: {sites.filter((s) => !planInfo(s.plan).customDomain).map((s) => s.name).join(", ")} (Free plan).
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- Billing ---------------- */

export function BillingPage() {
  const { sites, invoices } = useAccountState()
  const paid = sites.filter((s) => planInfo(s.plan).price > 0)
  const total = paid.reduce((n, s) => n + planInfo(s.plan).price, 0)
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id
  return (
    <PanelPage>
      <PanelHeader title="Billings" description="One payment method for the account. Each website is billed for its own plan." />

      <PanelSection title="Payment method" actions={<Button size="sm" variant="secondary">Update</Button>}>
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-14 place-items-center rounded-sm border border-line-default bg-subtle text-fg-secondary">
            <CreditCard className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="type-label-md text-fg-primary">
              {ACCOUNT.card.brand} ending in {ACCOUNT.card.last4}
            </span>
            <span className="type-body-sm text-fg-tertiary">Expires {ACCOUNT.card.expires}</span>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Plans by website" actions={<span className="type-label-md text-fg-primary tabular-nums">${total} / month</span>}>
        <ul className="flex flex-col divide-y divide-line-default">
          {sites.map((s) => {
            const p = planInfo(s.plan)
            return (
              <li key={s.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <SiteMark site={s} className="size-8" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate type-label-md text-fg-primary">{s.name}</span>
                    <span className="type-body-sm text-fg-tertiary">{p.price ? `Renews ${s.renews ?? "next month"}` : "No charge"}</span>
                  </span>
                </span>
                <span className="flex items-center justify-between gap-4 pl-11 sm:w-[300px] sm:justify-end sm:pl-0">
                  <Badge tone={p.price ? "brand" : "neutral"} dot={false}>
                    {p.name}
                  </Badge>
                  <span className="w-20 text-right type-body-sm text-fg-primary tabular-nums">{p.price ? `$${p.price}/mo` : "Free"}</span>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/sites/${s.id}?tab=plan`}>Change</Link>
                  </Button>
                </span>
              </li>
            )
          })}
        </ul>
      </PanelSection>

      <PanelSection title="Invoices">
        {invoices.length === 0 ? (
          <p className="type-body-sm text-fg-secondary">No invoices yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line-default">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="type-label-md text-fg-primary">{inv.description}</span>
                  <span className="truncate type-body-sm text-fg-tertiary">
                    {inv.date} · {inv.siteId ? siteName(inv.siteId) : "Domain"} · {inv.id}
                  </span>
                </span>
                <Badge tone="success">Paid</Badge>
                <span className="w-14 text-right type-body-sm text-fg-primary tabular-nums">${inv.amount.toFixed(2)}</span>
                <Button size="icon-sm" variant="secondary" aria-label={`Download ${inv.id}`}>
                  <Download />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </PanelPage>
  )
}

/* ---------------- Settings ---------------- */

export function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [remove, setRemove] = useState(false)
  const [sure, setSure] = useState(false)
  return (
    <PanelPage className="max-w-[760px]">
      <PanelHeader title="Settings" description="Your profile and how GoGetSpace keeps in touch." />
      {saved && (
        <Alert tone="success" size="sm" title="Saved" onDismiss={() => setSaved(false)}>
          Your profile is up to date.
        </Alert>
      )}
      <PanelSection title="Profile">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setSaved(true)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input defaultValue={ACCOUNT.name} autoComplete="name" />
            </Field>
            <Field label="Email">
              <Input type="email" defaultValue={ACCOUNT.email} autoComplete="email" />
            </Field>
          </div>
          <Field label="Language" className="sm:max-w-[240px]">
            <Select
              defaultValue="en"
              options={[
                { value: "en", label: "English" },
                { value: "ms", label: "Bahasa Malaysia" },
                { value: "id", label: "Bahasa Indonesia" },
              ]}
            />
          </Field>
          <Button type="submit" className="self-start">
            Save changes
          </Button>
        </form>
      </PanelSection>
      <PanelSection title="Notifications">
        <div className="flex flex-col gap-4">
          <Switch label="Email me when a new enquiry arrives" defaultChecked />
          <Switch label="Weekly summary of visitors and enquiries" defaultChecked />
          <Switch label="Tips and product news" />
        </div>
      </PanelSection>
      <PanelSection title="Delete account" className="border-status-error-border">
        <p className="type-body-sm text-fg-secondary">This takes every website offline and cancels their plans. It can&apos;t be undone.</p>
        <Button variant="destructive" className="self-start" onClick={() => setRemove(true)}>
          Delete account
        </Button>
      </PanelSection>
      <Dialog
        open={remove}
        onOpenChange={(o) => {
          setRemove(o)
          if (!o) setSure(false)
        }}
      >
        <DialogContent
          title="Delete your account?"
          description="All websites go offline, their plans are cancelled and their content is deleted after 30 days."
          footer={
            <>
              <Button variant="secondary" onClick={() => setRemove(false)}>Keep my account</Button>
              <Button variant="destructive" disabled={!sure} onClick={() => setRemove(false)}>
                Delete account
              </Button>
            </>
          }
        >
          <Checkbox label="I understand my websites will go offline" checked={sure} onCheckedChange={(c) => setSure(c === true)} />
        </DialogContent>
      </Dialog>
    </PanelPage>
  )
}

/* ---------------- Inbox ---------------- */

export function InboxPage() {
  return (
    <PanelPage className={cn("max-w-[1200px]")}>
      <EnquiriesPanel />
    </PanelPage>
  )
}
