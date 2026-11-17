"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, FlaskConical, Inbox, Plus, Trash2 } from "lucide-react"
import { Alert, Badge, Button } from "@/components/ui"
import { PanelHeader, PanelSection } from "@/components/account/panel"
import { cn } from "@/lib/cn"
import { DENTIST } from "@/lib/playbooks/dentist"
import { bringsWith, coreModules, moduleById } from "@/lib/playbooks/engine"
import type { Decision } from "@/lib/playbooks/engine"
import type { ModulesApi } from "@/components/generate/editor-site"
import { MODULE_ICON } from "./recommended-tools"
import { priceLabel } from "./module-card"

/** where a module's own app opens (a separate environment; the prototype has a stand-in page) */
export const moduleAppUrl = (siteId: string, module: string) => `/sites/${siteId}/apps/${module}`

/** tools the owner may already use, by what they replace or feed (logos in public/integrations) */
export const THIRD_PARTY_TOOLS = [
  { id: "google-calendar", name: "Google Calendar", kind: "Appointments" },
  { id: "hubspot", name: "HubSpot", kind: "CRM" },
  { id: "zoho", name: "Zoho CRM", kind: "CRM" },
  { id: "salesforce", name: "Salesforce", kind: "CRM" },
  { id: "whatsapp", name: "WhatsApp Business", kind: "Messages" },
  { id: "stripe", name: "Stripe", kind: "Payments" },
  { id: "airtable", name: "Airtable", kind: "Records" },
  { id: "mailchimp", name: "Mailchimp", kind: "Email" },
  { id: "zapier", name: "Zapier", kind: "Automations" },
]

/** one module in a two-column grid: icon on the left, name and status, a short line, then actions */
function AppCard({ icon, title, status, price, children, actions, tone = "default" }: { icon: ReactNode; title: string; status?: ReactNode; price?: string; children?: ReactNode; actions?: ReactNode; tone?: "default" | "muted" }) {
  return (
    <div className={cn("flex gap-4 rounded-lg border border-line-default p-4", tone === "muted" ? "bg-canvas" : "bg-surface shadow-[0_2px_0_0_var(--color-shadow-block)]")}>
      <span className="grid size-10 shrink-0 place-items-center text-fg-primary [&_svg]:size-8 [&_img]:size-7" aria-hidden>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="type-label-lg text-fg-primary">{title}</span>
            {status}
            {price && <span className="ml-auto type-label-md text-fg-tertiary tabular-nums">{price}</span>}
          </p>
          {children && <div className="type-body-sm text-fg-secondary">{children}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

function ManageLink({ siteId, module, name }: { siteId: string; module: string; name: string }) {
  return (
    <Button asChild size="sm" variant="secondary">
      <Link href={moduleAppUrl(siteId, module)} target="_blank" rel="noreferrer" aria-label={`Manage ${name} (opens in a new tab)`}>
        Manage <ArrowUpRight />
      </Link>
    </Button>
  )
}

/**
 * The editor's Modules page: the site's modules (Enquiries first — every site has it), each opening its own app
 * with Manage; modules to add, in two columns; and third-party tools the owner already uses. For a playbook site
 * every add-on has its own monthly price, billed with this website.
 */
export function ModulesPanel({ siteId, siteName, api, billed, goals, unread }: { siteId: string; siteName: string; api: ModulesApi | null; billed: boolean; goals: string[]; unread: number }) {
  const [note, setNote] = useState<string | null>(null)
  const [connected, setConnected] = useState<string[]>([])
  const list = api?.list ?? []
  const ids = new Set(list.map((m) => m.id))
  const added = list.map((m) => ({ def: moduleById(m.id), status: m.status }))
  const addable = api ? DENTIST.modules.filter((m) => !m.core && !ids.has(m.id)) : []
  const total = added.reduce((n, m) => n + m.def.price, 0)
  const decisions = Object.fromEntries(list.map((m) => [m.id, "added" as Decision]))
  const goalFor = (id: string) => goals.find((g) => DENTIST.goals.find((x) => x.id === g)?.modules.includes(id))
  const Icon = (id: string) => {
    const I = MODULE_ICON[id] ?? Check
    return <I strokeWidth={1.25} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Modules"
        description={
          <>
            The tools on <strong className="font-semibold text-fg-primary">{siteName}</strong>. Each one opens in its own app with Manage.
            {api && ` Add-ons have their own monthly price, billed with this website${billed ? "" : " from when you publish"}.`}
          </>
        }
        actions={api && <span className="type-label-lg text-fg-primary tabular-nums">{total ? `$${total}/month` : "No add-ons"}</span>}
      />

      {note && (
        <Alert tone="success" size="sm" onDismiss={() => setNote(null)}>
          {note}
        </Alert>
      )}

      <PanelSection title={`Your modules (${added.length + 1})`}>
        <div className="grid gap-3 lg:grid-cols-2">
          <AppCard
            icon={<Inbox strokeWidth={1.25} />}
            title="Enquiries"
            status={
              <>
                <Badge tone="success">Live</Badge>
                {unread > 0 && (
                  <Badge tone="brand" dot={false}>
                    {unread} new
                  </Badge>
                )}
              </>
            }
            price="Free"
            actions={<ManageLink siteId={siteId} module="enquiries" name="Enquiries" />}
          >
            Messages and requests from your site&apos;s forms, in one inbox.
          </AppCard>
          {added.map(({ def, status }) => (
            <AppCard
              key={def.id}
              icon={Icon(def.id)}
              title={def.name}
              status={status === "live" ? <Badge tone="success">Live</Badge> : <Badge tone="warning">Test mode</Badge>}
              price={priceLabel(def)}
              actions={
                <>
                  <ManageLink siteId={siteId} module={def.id} name={def.name} />
                  {status === "test" && def.needsAccount && (
                    <Button size="sm" onClick={() => (api!.activate(def.id), setNote(`${def.name} is live — ${def.needsAccount!.label} connected.`))}>
                      {def.needsAccount.connect}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Trash2 />}
                    onClick={() => (api!.remove(def.id), setNote(`${def.name} removed.${billed && def.price ? " It stays on until the end of the period you've paid for." : ""}`))}
                  >
                    Remove
                  </Button>
                </>
              }
            >
              {(goalFor(def.id) && def.benefit[goalFor(def.id)!]) || def.included[0]}
              {status === "test" && def.needsAccount && (
                <span className="mt-1 flex items-start gap-1.5 type-caption text-status-warning-text">
                  <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
                  {def.needsAccount.testMode}
                </span>
              )}
            </AppCard>
          ))}
        </div>
        {api && (
          <p className="type-body-sm text-fg-tertiary">
            Always included free: {coreModules().filter((m) => m.id !== "inbox").map((m) => m.name).join(" · ")}
          </p>
        )}
      </PanelSection>

      {api ? (
        addable.length > 0 && (
          <PanelSection title="Add modules">
            <div className="grid gap-3 lg:grid-cols-2">
              {addable.map((m) => {
                const dep = bringsWith(m.id, decisions, goals)
                return (
                  <AppCard
                    key={m.id}
                    tone="muted"
                    icon={Icon(m.id)}
                    title={m.name}
                    price={priceLabel(m)}
                    actions={
                      <Button
                        size="sm"
                        variant="secondary"
                        leadingIcon={<Plus />}
                        onClick={() => (api.add(m.id), setNote(`${m.name} added${dep ? ` with ${dep.name}` : ""}${m.needsAccount ? ` — it runs in test mode until you connect ${m.needsAccount.label}` : ""}. Ask the agent to build ${m.pages ? "its page" : "it into your pages"}.`))}
                      >
                        {m.id === "gallery" ? "I have patient consent — add" : "Add"}
                      </Button>
                    }
                  >
                    {m.included[0]}
                    {dep && <span className="mt-1 block type-caption text-fg-tertiary">Comes with {dep.name} ({priceLabel(dep)})</span>}
                  </AppCard>
                )
              })}
            </div>
          </PanelSection>
        )
      ) : (
        <p className="type-body-sm text-fg-tertiary">Need bookings, payments or a catalog? Ask the agent and it adds them to your site.</p>
      )}

      <PanelSection title="Connect a tool you already use">
        <p className="-mt-2 type-body-sm text-fg-secondary">Keep using your CRM, calendar or payment provider — your site sends bookings, enquiries and payments to it.</p>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {THIRD_PARTY_TOOLS.map((t) => {
            const on = connected.includes(t.id)
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line-default bg-surface p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/integrations/${t.id}.svg`} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate type-label-md text-fg-primary">{t.name}</span>
                  <span className="type-caption text-fg-tertiary">{t.kind}</span>
                </span>
                {on ? (
                  <Button size="sm" variant="ghost" leadingIcon={<Check />} onClick={() => setConnected((c) => c.filter((x) => x !== t.id))} aria-label={`Disconnect ${t.name}`}>
                    Connected
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => (setConnected((c) => [...c, t.id]), setNote(`${t.name} connected — new ${t.kind === "Appointments" ? "bookings" : t.kind === "Payments" ? "payments" : "enquiries"} from ${siteName} now go there too.`))}>
                    Connect
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </PanelSection>
    </div>
  )
}
