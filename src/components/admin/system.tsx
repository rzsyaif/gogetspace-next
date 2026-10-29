"use client"

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui"
import { StatTile } from "@/components/account/charts"
import { PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { cn } from "@/lib/cn"
import { AI_STEPS, EMAILS, GENERATIONS, QUEUE, SERVICES, minutesLabel } from "@/lib/admin/data"
import { adminActions, showToast, useAdmin } from "@/lib/admin/store"

const DOT = { operational: "bg-status-success-solid", degraded: "bg-status-warning-solid", down: "bg-status-error-solid" }
const LABEL = { operational: "Operational", degraded: "Degraded", down: "Down" }

export function SystemPage() {
  const { sites } = useAdmin()
  const errors = GENERATIONS.filter((g) => g.status !== "ok")
  const degraded = SERVICES.filter((s) => s.status !== "operational")
  return (
    <PanelPage>
      <PanelHeader title="System" description="The services GoGetSpace depends on, the generation queue, and the emails we send." />

      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border p-4",
          degraded.length ? "border-status-warning-border bg-status-warning-bg" : "border-status-success-border bg-status-success-bg",
        )}
        role="status"
      >
        <span className={cn("size-2.5 shrink-0 rounded-full", degraded.length ? DOT.degraded : DOT.operational)} />
        <span className="type-label-md text-fg-primary">{degraded.length ? `${degraded.map((d) => d.name).join(", ")} degraded — everything else is operational` : "All systems operational"}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatTile label="Waiting in queue" value={String(QUEUE.waiting)} />
        <StatTile label="Running now" value={String(QUEUE.running)} />
        <StatTile label="Failed · last hour" value={String(QUEUE.failedLastHour)} />
        <StatTile label="Page build p50" value={`${QUEUE.p50} s`} />
        <StatTile label="Page build p95" value={`${QUEUE.p95} s`} />
      </div>

      <PanelSection title="Services">
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.name} className="flex flex-col gap-1 rounded-md border border-line-default p-4">
              <span className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", DOT[s.status])} aria-hidden />
                <span className="min-w-0 flex-1 truncate type-label-md text-fg-primary">{s.name}</span>
                <span className={cn("type-caption", s.status === "operational" ? "text-status-success-text" : "text-status-warning-text")}>{LABEL[s.status]}</span>
              </span>
              <span className="type-caption text-fg-tertiary">
                {s.role} · {s.latency}
              </span>
              {s.note && <span className="type-body-sm text-fg-secondary">{s.note}</span>}
            </li>
          ))}
        </ul>
      </PanelSection>

      <PanelSection title="Recent errors">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>When</TableHeaderCell>
              <TableHeaderCell>Step</TableHeaderCell>
              <TableHeaderCell>Website</TableHeaderCell>
              <TableHeaderCell>Error</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {errors.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="text-fg-secondary">{minutesLabel(g.minutesAgo)}</TableCell>
                <TableCell>{AI_STEPS.find((s) => s.id === g.step)?.label}</TableCell>
                <TableCell>
                  <span className="block max-w-[240px] truncate">{sites.find((s) => s.id === g.siteId)?.name}</span>
                </TableCell>
                <TableCell className="min-w-[240px] whitespace-normal">
                  <span className="font-mono text-[13px] text-fg-secondary">{g.id}</span> · {g.error}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelSection>

      <PanelSection title="Emails sent">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>When</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>To</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Actions</span>
              </TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {EMAILS.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-fg-secondary">{minutesLabel(e.minutesAgo)}</TableCell>
                <TableCell>{e.template}</TableCell>
                <TableCell className="text-fg-secondary">{e.to}</TableCell>
                <TableCell>
                  <Badge tone={e.status === "bounced" ? "error" : e.status === "opened" ? "success" : "neutral"}>{e.status === "bounced" ? "Bounced" : e.status === "opened" ? "Opened" : "Delivered"}</Badge>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      adminActions.resendEmail(e.to, e.template)
                      showToast(`Resent to ${e.to}`)
                    }}
                  >
                    Resend
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelSection>
    </PanelPage>
  )
}
