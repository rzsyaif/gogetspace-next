"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Badge, Button, SegmentedControl } from "@/components/ui"
import { PanelEmpty, PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { type AbuseReport, type ReportStatus } from "@/lib/admin/data"
import { adminActions, showToast, useAdmin } from "@/lib/admin/store"
import { ReasonDialog, SiteStatusBadge } from "./common"

const hoursLabel = (h: number) => (h < 1 ? "Just now" : h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} days ago`)

export function ModerationPage() {
  const { reports } = useAdmin()
  const [status, setStatus] = useState<ReportStatus>("open")
  const list = reports.filter((r) => r.status === status).sort((a, b) => a.hoursAgo - b.hoursAgo)
  const count = (s: ReportStatus) => reports.filter((r) => r.status === s).length

  return (
    <PanelPage>
      <PanelHeader
        title="Moderation"
        description="Reports from visitors and the safety scan that checks every page before it's published. Clients are clinics and law firms, so health claims and impersonation matter most."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <SegmentedControl
            label="Report status"
            size="sm"
            value={status}
            onChange={setStatus}
            options={[
              { value: "open", label: `Open · ${count("open")}` },
              { value: "actioned", label: `Actioned · ${count("actioned")}` },
              { value: "dismissed", label: `Dismissed · ${count("dismissed")}` },
            ]}
            className="self-start"
          />
          {list.length === 0 ? (
            <PanelEmpty icon={<ShieldCheck />} title={status === "open" ? "Nothing to review" : "Nothing here yet"} text="New reports and scan findings show up here as soon as they come in." />
          ) : (
            list.map((r) => <ReportCard key={r.id} report={r} />)
          )}
        </div>
        <PanelSection title="What we take down" className="self-start">
          <ul className="flex flex-col gap-3 type-body-sm text-fg-secondary">
            <li>
              <span className="type-label-md text-fg-primary">Phishing</span> — any form asking for passwords, bank logins or card numbers. Unpublish straight away.
            </li>
            <li>
              <span className="type-label-md text-fg-primary">Impersonation</span> — fake doctors, lawyers or registration numbers. Suspend the account.
            </li>
            <li>
              <span className="type-label-md text-fg-primary">Health claims</span> — cures, guarantees, before/after promises. Ask the client to change it; unpublish if they don&apos;t within 3 days.
            </li>
            <li>
              <span className="type-label-md text-fg-primary">Copyright and spam</span> — check with the client first; most are honest mistakes.
            </li>
          </ul>
        </PanelSection>
      </div>
    </PanelPage>
  )
}

function ReportCard({ report: r }: { report: AbuseReport }) {
  const { sites, clients } = useAdmin()
  const [dialog, setDialog] = useState<null | "dismiss" | "unpublish" | "suspend">(null)
  const site = sites.find((s) => s.id === r.siteId)
  const client = clients.find((c) => c.id === site?.clientId)
  const severe = r.reason === "Phishing" || r.reason === "Impersonation"
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line-default p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={severe ? "error" : "warning"}>{r.reason}</Badge>
        <span className="type-caption text-fg-tertiary">
          {r.source}
          {r.reporter && ` · ${r.reporter}`} · {hoursLabel(r.hoursAgo)} · {r.id}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate type-label-lg text-fg-primary">{site?.name}</span>
        {site && <SiteStatusBadge status={site.status} />}
      </div>
      {client && (
        <p className="type-body-sm text-fg-secondary">
          Owned by{" "}
          <Link href={`/admin/clients/${client.id}`} className="text-fg-link hover:underline">
            {client.name}
          </Link>{" "}
          · {site?.domain?.name ?? site?.freeDomain}
        </p>
      )}
      <p className="type-body-md text-fg-primary">{r.detail}</p>
      <blockquote className="rounded-md border-l-4 border-line-strong bg-subtle px-4 py-3 type-body-sm text-fg-secondary">“{r.excerpt}”</blockquote>
      <div className="flex flex-wrap gap-2">
        {r.status === "open" ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => setDialog("dismiss")}>
              Dismiss
            </Button>
            {site && site.status !== "suspended" && (
              <Button size="sm" variant="destructive" onClick={() => setDialog("unpublish")}>
                {site.status === "live" ? "Unpublish website" : "Block publishing"}
              </Button>
            )}
            {client && client.status === "active" && (
              <Button size="sm" variant="secondary" onClick={() => setDialog("suspend")}>
                Suspend client
              </Button>
            )}
          </>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              adminActions.setReportStatus(r.id, "open")
              showToast("Report reopened")
            }}
          >
            Reopen
          </Button>
        )}
      </div>

      <ReasonDialog
        open={dialog === "dismiss"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Dismiss this report?"
        description="Nothing changes on the website. The reporter isn't notified."
        confirmLabel="Dismiss"
        optionalReason
        onConfirm={(note) => {
          adminActions.setReportStatus(r.id, "dismissed", note)
          showToast("Report dismissed")
        }}
      />
      <ReasonDialog
        open={dialog === "unpublish"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Unpublish ${site?.name}?`}
        description="Visitors see “This site is unavailable”. The client gets an email with the reason and how to fix it."
        reasonLabel="Message to the client"
        reasonPlaceholder="e.g. Your page asks visitors for their bank login, which we don't allow."
        confirmLabel="Unpublish"
        destructive
        onConfirm={(reason) => {
          if (site) adminActions.setSiteStatus(site.id, "suspended", reason)
          adminActions.setReportStatus(r.id, "actioned", `Unpublished · ${r.reason}`)
          showToast(`${site?.name} is unpublished`)
        }}
      />
      <ReasonDialog
        open={dialog === "suspend"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Suspend ${client?.name}?`}
        description="They can't log in and every live website they own goes offline."
        confirmLabel="Suspend"
        destructive
        onConfirm={(reason) => {
          if (client) adminActions.setClientStatus(client.id, "suspended", reason)
          adminActions.setReportStatus(r.id, "actioned", `Suspended client · ${r.reason}`)
          showToast(`${client?.name} is suspended`)
        }}
      />
    </section>
  )
}
