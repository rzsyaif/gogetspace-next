"use client"

import { useState } from "react"
import { Archive, ArrowLeft, Check, Inbox, Mail, MessageCircle, Phone } from "lucide-react"
import { Badge, Button, IconButton, SegmentedControl, Select } from "@/components/ui"
import { cn } from "@/lib/cn"
import { ENQUIRIES, type Enquiry, type EnquiryStatus } from "@/lib/account/data"
import { accountActions, useAccountState } from "@/lib/account/store"
import { PanelEmpty, PanelHeader } from "./panel"

type Filter = "new" | "all" | "archived"

/**
 * Enquiries from the site's forms (bookings, contact, quotes). With no `siteId` it's the account-wide inbox
 * with a site filter. List + reading pane on wide screens; list → message on phones.
 */
export function EnquiriesPanel({ siteId, live = true }: { siteId?: string; live?: boolean }) {
  const { sites, enquiryStatus } = useAccountState()
  const [filter, setFilter] = useState<Filter>("all")
  const [site, setSite] = useState<string>(siteId ?? "all")
  const [openId, setOpenId] = useState<string | null>(null)

  const status = (e: Enquiry): EnquiryStatus => enquiryStatus[e.id] ?? e.status
  const scoped = ENQUIRIES.filter((e) => site === "all" || e.siteId === site)
  const shown = scoped.filter((e) => (filter === "archived" ? status(e) === "archived" : status(e) !== "archived" && (filter === "all" || status(e) === "new")))
  const unread = scoped.filter((e) => status(e) === "new").length
  // wide screens always show a message; phones only after a tap
  const current = shown.find((e) => e.id === openId) ?? null
  const reading = current ?? shown[0] ?? null
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? id

  const header = (
    <PanelHeader
      title={siteId ? "Enquiries" : "Inbox"}
      description={siteId ? `Messages sent through ${siteName(siteId)}` : "Every enquiry from all your websites, in one place"}
      actions={
        !siteId && (
          <div className="w-full sm:w-[280px]">
            <Select
              value={site}
              onValueChange={(v) => {
                setSite(v)
                setOpenId(null)
              }}
              options={[{ value: "all", label: "All websites" }, ...sites.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </div>
        )
      }
    />
  )

  if (siteId && !live)
    return (
      <div className="flex flex-col gap-6">
        {header}
        <PanelEmpty icon={<Inbox />} title="No enquiries yet" text="Booking requests and messages from your contact forms will arrive here once the site is live." />
      </div>
    )

  return (
    <div className="flex flex-col gap-6">
      {header}
      <SegmentedControl
        label="Show"
        size="sm"
        className="self-start"
        value={filter}
        onChange={(f) => {
          setFilter(f)
          setOpenId(null)
        }}
        options={[
          { value: "all", label: "All" },
          { value: "new", label: unread ? `New · ${unread}` : "New" },
          { value: "archived", label: "Archived" },
        ]}
      />

      {shown.length === 0 ? (
        <PanelEmpty
          icon={<Inbox />}
          title={filter === "new" ? "You're all caught up" : filter === "archived" ? "Nothing archived" : "No enquiries yet"}
          text={filter === "new" ? "New booking requests and messages will appear here." : "Messages from your websites' forms will appear here."}
        />
      ) : (
        <div className="grid min-h-[480px] overflow-hidden rounded-lg border border-line-default lg:grid-cols-[minmax(280px,380px)_1fr]">
          <ul className={cn("flex flex-col divide-y divide-line-default overflow-y-auto lg:border-r lg:border-line-default", current && "max-lg:hidden")}>
            {shown.map((e) => {
              const st = status(e)
              const active = reading?.id === e.id
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(e.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn("flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring", active && "lg:bg-accent-blue-subtle/50")}
                  >
                    <span className="flex items-center gap-2">
                      {st === "new" && <span className="size-2 shrink-0 rounded-full bg-action-primary" aria-label="New" />}
                      <span className={cn("min-w-0 flex-1 truncate type-body-md", st === "new" ? "font-semibold text-fg-primary" : "text-fg-primary")}>{e.name}</span>
                      <span className="shrink-0 type-caption text-fg-tertiary">{e.received}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge dot={false} tone={e.kind === "Booking request" ? "brand" : "neutral"}>{e.kind}</Badge>
                      {!siteId && <span className="truncate type-caption text-fg-tertiary">{siteName(e.siteId)}</span>}
                    </span>
                    <span className="line-clamp-1 type-body-sm text-fg-secondary">{e.message}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {reading && <Message e={reading} status={status(reading)} siteName={siteId ? null : siteName(reading.siteId)} onBack={() => setOpenId(null)} className={cn(!current && "max-lg:hidden")} />}
        </div>
      )}
    </div>
  )
}

function Message({ e, status, siteName, onBack, className }: { e: Enquiry; status: EnquiryStatus; siteName: string | null; onBack: () => void; className?: string }) {
  const digits = e.phone?.replace(/\D/g, "")
  return (
    <article className={cn("flex flex-col gap-5 p-4 sm:p-6", className)}>
      <div className="flex items-start gap-3">
        <IconButton aria-label="Back to the list" onClick={onBack} className="lg:hidden">
          <ArrowLeft />
        </IconButton>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="type-h5 text-fg-primary">{e.name}</h2>
          <p className="type-body-sm text-fg-secondary">
            {e.kind} · from {e.page}
            {siteName && ` · ${siteName}`} · {e.received}
          </p>
        </div>
        {status === "replied" && <Badge tone="success">Replied</Badge>}
        {status === "new" && <Badge tone="brand">New</Badge>}
      </div>
      <p className="rounded-md bg-subtle p-4 type-body-md whitespace-pre-line text-fg-primary">{e.message}</p>
      <dl className="grid gap-2 type-body-sm sm:grid-cols-[120px_1fr]">
        {e.email && (
          <>
            <dt className="text-fg-tertiary">Email</dt>
            <dd className="text-fg-primary">{e.email}</dd>
          </>
        )}
        {e.phone && (
          <>
            <dt className="text-fg-tertiary">Phone</dt>
            <dd className="text-fg-primary">{e.phone}</dd>
          </>
        )}
      </dl>
      <div className="flex flex-wrap gap-2">
        {e.email && (
          <Button asChild leadingIcon={<Mail />}>
            <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: your ${e.kind.toLowerCase()}`)}`} onClick={() => accountActions.setEnquiryStatus(e.id, "replied")}>
              Reply by email
            </a>
          </Button>
        )}
        {digits && (
          <>
            <Button asChild leadingIcon={<MessageCircle />}>
              <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" onClick={() => accountActions.setEnquiryStatus(e.id, "replied")}>
                Reply on WhatsApp
              </a>
            </Button>
            <Button asChild variant="secondary" leadingIcon={<Phone />}>
              <a href={`tel:${e.phone}`}>Call</a>
            </Button>
          </>
        )}
        {status !== "replied" && status !== "archived" && (
          <Button variant="secondary" leadingIcon={<Check />} onClick={() => accountActions.setEnquiryStatus(e.id, "replied")}>
            Mark as replied
          </Button>
        )}
        {status !== "archived" ? (
          <Button variant="ghost" leadingIcon={<Archive />} onClick={() => accountActions.setEnquiryStatus(e.id, "archived")}>
            Archive
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => accountActions.setEnquiryStatus(e.id, "replied")}>
            Move back to inbox
          </Button>
        )}
      </div>
    </article>
  )
}
