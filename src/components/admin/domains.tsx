"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { MoreHorizontal, Search } from "lucide-react"
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui"
import { StatTile } from "@/components/account/charts"
import { PanelHeader, PanelPage } from "@/components/account/panel"
import { DOMAIN_HEALTH, fmtDate, type AdminDomain } from "@/lib/admin/data"
import { adminActions, showToast, useAdmin } from "@/lib/admin/store"
import { FilterBar } from "./common"

type Filter = "all" | "pending_dns" | "issues" | "unused"

export function DomainsAdminPage() {
  const { domains, sites, clients } = useAdmin()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const f = params.get("filter") as Filter | null
  const [filter, setFilter] = useState<Filter>(f ?? "all")
  const term = q.trim().toLowerCase()
  const rows = domains.filter((d) => {
    const c = clients.find((x) => x.id === d.clientId)
    if (term && ![d.name, c?.name].some((x) => x?.toLowerCase().includes(term))) return false
    if (filter === "pending_dns") return d.health === "pending_dns"
    if (filter === "issues") return d.health === "ssl_error" || d.health === "expiring"
    if (filter === "unused") return d.siteId === null
    return true
  })

  return (
    <PanelPage>
      <PanelHeader title="Domains" description="Domains bought through GoGetSpace connect on their own. Ones bought elsewhere need DNS records — that's where most support questions come from." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Domains" value={String(domains.length)} />
        <StatTile label="Bought through GoGetSpace" value={String(domains.filter((d) => d.source === "GoGetSpace").length)} />
        <StatTile label="Waiting for DNS" value={String(domains.filter((d) => d.health === "pending_dns").length)} />
        <StatTile label="SSL or renewal issues" value={String(domains.filter((d) => d.health === "ssl_error" || d.health === "expiring").length)} />
      </div>

      <FilterBar>
        <div className="md:w-[300px]">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Domain or client" aria-label="Search domains" leadingIcon={<Search />} className="h-11" />
        </div>
        <SegmentedControl
          label="Show"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "pending_dns", label: "Waiting for DNS" },
            { value: "issues", label: "SSL & renewals" },
            { value: "unused", label: "Unused" },
          ]}
          className="max-w-full overflow-x-auto"
        />
      </FilterBar>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Domain</TableHeaderCell>
            <TableHeaderCell>Client · website</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Source</TableHeaderCell>
            <TableHeaderCell>Expires</TableHeaderCell>
            <TableHeaderCell>Last DNS check</TableHeaderCell>
            <TableHeaderCell>
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {rows.length === 0 && <TableEmpty colSpan={7}>No domains match.</TableEmpty>}
          {rows.map((d) => {
            const c = clients.find((x) => x.id === d.clientId)!
            const site = sites.find((x) => x.id === d.siteId)
            return (
              <TableRow key={d.name}>
                <TableCell className="type-label-md">{d.name}</TableCell>
                <TableCell>
                  <span className="flex max-w-[260px] flex-col">
                    <Link href={`/admin/clients/${c.id}?tab=domains`} className="truncate rounded-sm hover:underline focus-visible:outline-none focus-visible:focus-ring">
                      {c.name}
                    </Link>
                    <span className="truncate type-caption text-fg-tertiary">{site?.name ?? "Not used on a website"}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex flex-col items-start gap-0.5">
                    <Badge tone={DOMAIN_HEALTH[d.health].tone}>{DOMAIN_HEALTH[d.health].label}</Badge>
                    {d.waitingHours != null && d.health === "pending_dns" && <span className={d.waitingHours >= 48 ? "type-caption text-status-error-text" : "type-caption text-fg-tertiary"}>for {d.waitingHours} h</span>}
                  </span>
                </TableCell>
                <TableCell className="text-fg-secondary">{d.source === "GoGetSpace" ? "GoGetSpace" : "Elsewhere"}</TableCell>
                <TableCell className={d.expiresIn < 30 && !d.autoRenew ? "text-status-warning-text" : "text-fg-secondary"}>
                  {d.source === "GoGetSpace" ? (
                    <span className="flex flex-col">
                      <span>{fmtDate(-d.expiresIn)}</span>
                      <span className="type-caption text-fg-tertiary">{d.autoRenew ? "Auto-renews" : "Won't renew"}</span>
                    </span>
                  ) : (
                    "Registrar elsewhere"
                  )}
                </TableCell>
                <TableCell className="text-fg-secondary">{d.checkedHoursAgo === 0 ? "Just now" : `${d.checkedHoursAgo} h ago`}</TableCell>
                <TableCell align="right">
                  <DomainActions domain={d} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </PanelPage>
  )
}

function DomainActions({ domain: d }: { domain: AdminDomain }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton aria-label={`Actions for ${d.name}`}>
          <MoreHorizontal />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={() => {
            adminActions.recheckDns(d.name)
            showToast(d.health === "pending_dns" ? `${d.name}: records still not found` : `${d.name}: DNS looks right`, d.health === "pending_dns" ? "info" : "success")
          }}
        >
          Re-check DNS now
        </DropdownMenuItem>
        {d.health === "pending_dns" && (
          <DropdownMenuItem
            onSelect={() => {
              adminActions.sendDnsReminder(d.name)
              showToast(`Sent the DNS steps for ${d.name} to the client`)
            }}
          >
            Email the DNS steps
          </DropdownMenuItem>
        )}
        {d.health === "ssl_error" && (
          <DropdownMenuItem
            onSelect={() => {
              adminActions.reissueSsl(d.name)
              showToast(`New certificate issued for ${d.name}`)
            }}
          >
            Re-issue SSL certificate
          </DropdownMenuItem>
        )}
        {d.source === "GoGetSpace" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                adminActions.renewDomain(d.name)
                showToast(`${d.name} renewed for a year`)
              }}
            >
              Renew 1 year now
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                adminActions.setAutoRenew(d.name, !d.autoRenew)
                showToast(d.autoRenew ? "Auto-renew turned off" : "Auto-renew turned on")
              }}
            >
              Turn {d.autoRenew ? "off" : "on"} auto-renew
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
