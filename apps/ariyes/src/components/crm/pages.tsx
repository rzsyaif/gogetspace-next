"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Avatar, Button, Chip, Drawer, DrawerContent, Input, Table, TableBody, TableCell, TableEmpty, TableHead, TableHeaderCell, TableRow, buttonVariants } from "@gogetspace/baseplate"
import { SOURCES, ago, followUps, formatMoney, isOpen, type CrmClient, type CrmData } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"
import { useCrm } from "./crm-store"
import { CrmBody, CrmHeader } from "./crm-shell"
import { FollowUps } from "./follow-ups"
import { Board } from "./board"
import { Section, StageLabel, StatsStrip, Value } from "./bits"

/** a client's most recent activity time */
const lastActivity = (d: CrmData, id: string) => d.activity.filter((a) => a.clientId === id).reduce((m, a) => (a.at > m ? a.at : m), "")
/** a client's main enquiry: the open one if any, else the latest */
const mainEnquiry = (d: CrmData, id: string) => {
  const es = d.enquiries.filter((e) => e.clientId === id)
  return es.find((e) => isOpen(d, e)) ?? es.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]
}

function SeeDetails({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button size="sm" variant="secondary" onClick={onClick} aria-label={label}>
      See details
    </Button>
  )
}

/** CRM home: who to follow up first, then the pipeline, then recent clients and companies */
export function CrmHome() {
  const { project, data, now, currency, setOpenClient, setOpenCompany } = useCrm()
  const base = `/${project.id}/crm`
  const due = data ? followUps(data, now).length : 0
  const recent = data ? [...data.clients].sort((a, b) => (lastActivity(data, a.id) < lastActivity(data, b.id) ? 1 : -1)).slice(0, 5) : []
  const companies = data?.settings.companies ? data.companies.slice(0, 5) : []
  return (
    <>
      <CrmHeader title="CRM" />
      <CrmBody>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 py-6 sm:px-6 sm:py-8">
          <Section title={due ? `Follow up today · ${due}` : "Follow up today"}>
            <FollowUps />
          </Section>

          <Section
            title="Pipeline"
            action={
              <Link href={`${base}/pipeline`} className="flex items-center gap-1 rounded-sm type-label-md text-fg-link hover:underline focus-visible:outline-none focus-visible:focus-ring">
                See full pipeline <ArrowRight aria-hidden className="size-4" />
              </Link>
            }
          >
            <StatsStrip className="mb-1" />
            <Board height={380} />
          </Section>

          <div className={cn("grid gap-10", companies.length && "lg:grid-cols-2")}>
            <Section
              title="Recent clients"
              action={
                <Link href={`${base}/clients`} className="rounded-sm type-label-md text-fg-link hover:underline focus-visible:outline-none focus-visible:focus-ring">
                  All clients
                </Link>
              }
            >
              <ul className="divide-y divide-line-default overflow-hidden rounded-lg border border-line-default bg-surface">
                {data &&
                  recent.map((c) => {
                    const e = mainEnquiry(data, c.id)
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={c.name} size="sm" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate type-label-md text-fg-primary">{c.name}</span>
                          <span className="flex min-w-0 flex-wrap items-center gap-x-2 type-body-sm text-fg-tertiary">
                            {e && <StageLabel d={data} stageId={e.stageId} />}
                            <span>· {ago(lastActivity(data, c.id), now)}</span>
                          </span>
                        </div>
                        <SeeDetails onClick={() => setOpenClient(c.id)} label={`See details for ${c.name}`} />
                      </li>
                    )
                  })}
                {data && !recent.length && <li className="px-4 py-6 text-center type-body-sm text-fg-tertiary">No clients yet. They appear here when someone enquires.</li>}
              </ul>
            </Section>

            {companies.length > 0 && data && (
              <Section
                title="Recent companies"
                action={
                  <Link href={`${base}/companies`} className="rounded-sm type-label-md text-fg-link hover:underline focus-visible:outline-none focus-visible:focus-ring">
                    All companies
                  </Link>
                }
              >
                <ul className="divide-y divide-line-default overflow-hidden rounded-lg border border-line-default bg-surface">
                  {companies.map((co) => {
                    const people = data.clients.filter((c) => c.companyId === co.id)
                    const open = data.enquiries.filter((e) => people.some((p) => p.id === e.clientId) && isOpen(data, e))
                    return (
                      <li key={co.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={co.name} size="sm" className="rounded-md bg-subtle text-fg-secondary" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate type-label-md text-fg-primary">{co.name}</span>
                          <span className="truncate type-body-sm text-fg-tertiary">
                            {people.length} {people.length === 1 ? "person" : "people"} · {open.length ? `${formatMoney(open.reduce((n, e) => n + (e.value ?? 0), 0), currency)} open` : "nothing open"}
                          </span>
                        </div>
                        <SeeDetails onClick={() => setOpenCompany(co.id)} label={`See details for ${co.name}`} />
                      </li>
                    )
                  })}
                </ul>
              </Section>
            )}
          </div>
        </div>
      </CrmBody>
      <CompanyPanel />
    </>
  )
}

/** the whole pipeline */
export function PipelinePage() {
  const { setAddOpen } = useCrm()
  return (
    <>
      <CrmHeader
        title="Pipeline"
        actions={
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)} className="max-md:hidden">
            Add new lead
          </Button>
        }
      />
      <CrmBody>
        <div className="flex flex-col gap-5 px-4 py-6 sm:px-6">
          <StatsStrip />
          <Board />
          <p className="type-body-sm text-fg-tertiary">Drag a card to another stage, or open it to change its stage.</p>
        </div>
      </CrmBody>
    </>
  )
}

type Filter = "all" | "follow" | "open" | "won" | "lost"

/** every client, searchable, with the ones to follow up a tap away */
export function ClientsPage() {
  const { data, now, setOpenClient } = useCrm()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const needs = new Set(data ? followUps(data, now).map((f) => f.client.id) : [])
  const company = (c: CrmClient) => data?.companies.find((x) => x.id === c.companyId)?.name
  const rows = data
    ? data.clients
        .filter((c) => {
          const s = q.trim().toLowerCase()
          if (s && ![c.name, c.email, c.phone, company(c), ...data.enquiries.filter((e) => e.clientId === c.id).map((e) => e.title)].some((v) => v?.toLowerCase().includes(s))) return false
          const e = mainEnquiry(data, c.id)
          const kind = e ? data.settings.stages.find((st) => st.id === e.stageId)?.kind : undefined
          return filter === "all" || (filter === "follow" ? needs.has(c.id) : kind === filter)
        })
        .sort((a, b) => (lastActivity(data, a.id) < lastActivity(data, b.id) ? 1 : -1))
    : []
  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "follow", label: `To follow up${needs.size ? ` · ${needs.size}` : ""}` },
    { id: "open", label: "In progress" },
    { id: "won", label: data?.settings.stages.find((s) => s.kind === "won")?.name ?? "Won" },
    { id: "lost", label: data?.settings.stages.find((s) => s.kind === "lost")?.name ?? "Lost" },
  ]
  return (
    <>
      <CrmHeader title="Clients" />
      <CrmBody>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:max-w-[380px]">
              <Input aria-label="Search clients" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email or enquiry" leadingIcon={<Search />} className="h-11" />
            </div>
            <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Chip key={f.id} selected={filter === f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </div>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell className="max-lg:hidden">What they&apos;re after</TableHeaderCell>
                <TableHeaderCell>Stage</TableHeaderCell>
                <TableHeaderCell align="right">Value</TableHeaderCell>
                <TableHeaderCell>Last contact</TableHeaderCell>
                <TableHeaderCell className="max-xl:hidden">Found you via</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">Details</span>
                </TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {data &&
                rows.map((c) => {
                  const e = mainEnquiry(data, c.id)
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenClient(c.id)}>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" />
                          <span className="flex flex-col">
                            <span className="flex items-center gap-2">
                              <span className="type-label-md">{c.name}</span>
                              {needs.has(c.id) && <span className="rounded-full bg-status-warning-bg px-2 py-0.5 type-label-sm text-status-warning-text">Follow up</span>}
                            </span>
                            {company(c) && <span className="type-caption text-fg-tertiary">{company(c)}</span>}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-fg-secondary max-lg:hidden">{e?.title ?? "—"}</TableCell>
                      <TableCell>{e ? <StageLabel d={data} stageId={e.stageId} /> : "—"}</TableCell>
                      <TableCell align="right">{e ? <Value e={e} /> : "—"}</TableCell>
                      <TableCell className="text-fg-secondary">{ago(lastActivity(data, c.id), now)}</TableCell>
                      <TableCell className="text-fg-secondary max-xl:hidden">{SOURCES.find((s) => s.id === c.source)?.label}</TableCell>
                      <TableCell align="right">
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            setOpenClient(c.id)
                          }}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          See details
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              {data && !rows.length && <TableEmpty colSpan={7}>{q ? `Nobody matches "${q}".` : "Nobody here yet."}</TableEmpty>}
            </TableBody>
          </Table>
        </div>
      </CrmBody>
    </>
  )
}

/** a company's people and what's open with them */
function CompanyPanel() {
  const { data, now, currency, openCompany, setOpenCompany, setOpenClient } = useCrm()
  const co = data && openCompany ? data.companies.find((c) => c.id === openCompany) : null
  const people = co ? data!.clients.filter((c) => c.companyId === co.id) : []
  return (
    <Drawer open={!!co} onOpenChange={(o) => !o && setOpenCompany(null)}>
      {co && (
        <DrawerContent title={co.name} className="w-[min(420px,calc(100vw-24px))]">
          <div className="flex flex-col gap-4 px-1 pb-6">
            {co.industry && <p className="type-body-sm text-fg-secondary">{co.industry}</p>}
            <h3 className="type-label-lg text-fg-primary">People</h3>
            <ul className="divide-y divide-line-default overflow-hidden rounded-lg border border-line-default bg-surface">
              {people.map((p) => {
                const e = mainEnquiry(data!, p.id)
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={p.name} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate type-label-md text-fg-primary">{p.name}</span>
                      {e && (
                        <span className="truncate type-body-sm text-fg-tertiary">
                          {e.title} · {e.value != null ? formatMoney(e.value, currency) : "no value"} · {ago(e.updatedAt, now)}
                        </span>
                      )}
                    </div>
                    <SeeDetails
                      onClick={() => {
                        setOpenCompany(null)
                        setOpenClient(p.id)
                      }}
                      label={`See details for ${p.name}`}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </DrawerContent>
      )}
    </Drawer>
  )
}

/** the companies clients work for (when Companies is on in Settings) */
export function CompaniesPage() {
  const { project, data, currency, setOpenCompany } = useCrm()
  return (
    <>
      <CrmHeader title="Companies" />
      <CrmBody>
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-6 sm:px-6">
          {data && !data.settings.companies ? (
            <p className="type-body-md text-fg-secondary">
              Companies is off. Turn it on in{" "}
              <Link href={`/${project.id}/crm/settings`} className="text-fg-link underline">
                Settings
              </Link>{" "}
              if some of your clients come through their employer.
            </p>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>People</TableHeaderCell>
                  <TableHeaderCell align="right">Open</TableHeaderCell>
                  <TableHeaderCell>
                    <span className="sr-only">Details</span>
                  </TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {data?.companies.map((co) => {
                  const people = data.clients.filter((c) => c.companyId === co.id)
                  const open = data.enquiries.filter((e) => people.some((p) => p.id === e.clientId) && isOpen(data, e))
                  return (
                    <TableRow key={co.id} className="cursor-pointer" onClick={() => setOpenCompany(co.id)}>
                      <TableCell>
                        <span className="flex flex-col">
                          <span className="type-label-md">{co.name}</span>
                          {co.industry && <span className="type-caption text-fg-tertiary">{co.industry}</span>}
                        </span>
                      </TableCell>
                      <TableCell className="text-fg-secondary">{people.map((p) => p.name).join(", ")}</TableCell>
                      <TableCell align="right">{formatMoney(open.reduce((n, e) => n + (e.value ?? 0), 0), currency)}</TableCell>
                      <TableCell align="right">
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            setOpenCompany(co.id)
                          }}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          See details
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {data && !data.companies.length && <TableEmpty colSpan={4}>No companies yet. Pick one when you add a lead.</TableEmpty>}
              </TableBody>
            </Table>
          )}
        </div>
      </CrmBody>
      <CompanyPanel />
    </>
  )
}
