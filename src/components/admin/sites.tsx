"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ExternalLink, MoreHorizontal, Search } from "lucide-react"
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  IconButton,
  Input,
  SegmentedControl,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea,
} from "@/components/ui"
import { PanelHeader, PanelPage } from "@/components/account/panel"
import { PLANS, planInfo, type Plan } from "@/lib/plans"
import { relDays, type AdminSite } from "@/lib/admin/data"
import { adminActions, showToast, useAdmin } from "@/lib/admin/store"
import { FilterBar, PlanBadge, ReasonDialog, SiteCell, SiteStatusBadge } from "./common"

/** sites that exist in the client-side prototype, so "Open editor" has somewhere to go */
const EDITABLE = new Set(["bakti-analisa", "rahma-dental", "lim-partners"])

type Filter = "all" | "live" | "draft" | "suspended" | "failing"

export function SitesPage() {
  const { sites, clients } = useAdmin()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const [filter, setFilter] = useState<Filter>("all")
  const [plan, setPlan] = useState<"all" | Plan>("all")

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return sites.filter((s) => {
      const c = clients.find((x) => x.id === s.clientId)
      if (term && ![s.name, s.freeDomain, s.domain?.name, c?.name].some((x) => x?.toLowerCase().includes(term))) return false
      if (plan !== "all" && s.plan !== plan) return false
      if (filter === "failing") return s.failedGenerations > 0
      return filter === "all" || s.status === filter
    })
  }, [sites, clients, q, filter, plan])

  return (
    <PanelPage>
      <PanelHeader title="Websites" description={`${sites.length} websites across ${clients.length} clients. Plans, credits and publishing are per website.`} />
      <FilterBar>
        <div className="md:w-[320px]">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, domain or client" aria-label="Search websites" leadingIcon={<Search />} className="h-11" />
        </div>
        <SegmentedControl
          label="Status"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "live", label: "Live" },
            { value: "draft", label: "Draft" },
            { value: "suspended", label: "Unpublished" },
            { value: "failing", label: "Failed builds" },
          ]}
          className="max-w-full overflow-x-auto"
        />
        <div className="md:ml-auto md:w-[180px]">
          <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)} options={[{ value: "all", label: "All plans" }, ...PLANS.map((p) => ({ value: p.id, label: p.name }))]} className="h-11" />
        </div>
      </FilterBar>

      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Website</TableHeaderCell>
            <TableHeaderCell>Client</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Plan</TableHeaderCell>
            <TableHeaderCell align="right">Pages</TableHeaderCell>
            <TableHeaderCell align="right">Visitors · 30 d</TableHeaderCell>
            <TableHeaderCell align="right">Credits used</TableHeaderCell>
            <TableHeaderCell align="right">Failed builds</TableHeaderCell>
            <TableHeaderCell>Published</TableHeaderCell>
            <TableHeaderCell>
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {rows.length === 0 && <TableEmpty colSpan={10}>No websites match these filters.</TableEmpty>}
          {rows.map((s) => {
            const c = clients.find((x) => x.id === s.clientId)!
            const allowance = planInfo(s.plan).credits + s.bonusCredits
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <SiteCell site={s} href={`/admin/clients/${s.clientId}?tab=sites`} />
                </TableCell>
                <TableCell>
                  <Link href={`/admin/clients/${c.id}`} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:focus-ring">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <SiteStatusBadge status={s.status} />
                </TableCell>
                <TableCell>
                  <PlanBadge plan={s.plan} />
                </TableCell>
                <TableCell align="right">{s.pages}</TableCell>
                <TableCell align="right">{s.status === "live" ? s.visitors30.toLocaleString("en") : "—"}</TableCell>
                <TableCell align="right" className={s.credits > allowance ? "text-status-error-text" : undefined}>
                  {s.credits} / {allowance}
                </TableCell>
                <TableCell align="right" className={s.failedGenerations ? "text-status-warning-text" : "text-fg-tertiary"}>
                  {s.failedGenerations || "—"}
                </TableCell>
                <TableCell className="text-fg-secondary">{s.publishedAgo == null ? "Never" : relDays(s.publishedAgo)}</TableCell>
                <TableCell align="right">
                  <SiteActions site={s} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </PanelPage>
  )
}

/** Row menu for a website: open, change plan, grant credits, re-run failures, unpublish or republish. */
export function SiteActions({ site, trigger }: { site: AdminSite; trigger?: "button" }) {
  const [dialog, setDialog] = useState<null | "plan" | "credits" | "unpublish" | "republish">(null)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger === "button" ? (
            <Button size="sm" variant="secondary" trailingIcon={<MoreHorizontal />}>
              Manage
            </Button>
          ) : (
            <IconButton aria-label={`Actions for ${site.name}`}>
              <MoreHorizontal />
            </IconButton>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{site.name}</DropdownMenuLabel>
          {EDITABLE.has(site.id) && (
            <DropdownMenuItem asChild>
              <Link href={`/sites/${site.id}`}>
                <ExternalLink className="size-4" /> Open in editor
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setDialog("plan")}>Change plan</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("credits")}>Grant credits</DropdownMenuItem>
          {site.failedGenerations > 0 && (
            <DropdownMenuItem
              onSelect={() => {
                adminActions.rerunFailed(site.id)
                showToast(`Re-running ${site.failedGenerations} failed ${site.failedGenerations === 1 ? "build" : "builds"}`)
              }}
            >
              Re-run failed builds ({site.failedGenerations})
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {site.status === "suspended" ? (
            <DropdownMenuItem onSelect={() => setDialog("republish")}>Republish</DropdownMenuItem>
          ) : site.status === "live" ? (
            <DropdownMenuItem tone="danger" onSelect={() => setDialog("unpublish")}>
              Unpublish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem tone="danger" onSelect={() => setDialog("unpublish")}>
              Block publishing
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReasonDialog
        open={dialog === "unpublish"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={site.status === "live" ? `Unpublish ${site.name}?` : `Block publishing for ${site.name}?`}
        description="Visitors see a “This site is unavailable” page. The client keeps their content and can ask support to republish."
        confirmLabel={site.status === "live" ? "Unpublish" : "Block"}
        destructive
        onConfirm={(r) => {
          adminActions.setSiteStatus(site.id, "suspended", r)
          showToast(`${site.name} is unpublished`)
        }}
      />
      <ReasonDialog
        open={dialog === "republish"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Republish ${site.name}?`}
        description="It goes back online at its current address straight away."
        confirmLabel="Republish"
        onConfirm={(r) => {
          adminActions.setSiteStatus(site.id, "live", r)
          showToast(`${site.name} is live again`)
        }}
      />
      <Dialog open={dialog === "plan"} onOpenChange={(o) => !o && setDialog(null)}>
        {dialog === "plan" && <ChangePlan site={site} onClose={() => setDialog(null)} />}
      </Dialog>
      <Dialog open={dialog === "credits"} onOpenChange={(o) => !o && setDialog(null)}>
        {dialog === "credits" && <GrantCredits site={site} onClose={() => setDialog(null)} />}
      </Dialog>
    </>
  )
}

function ChangePlan({ site, onClose }: { site: AdminSite; onClose: () => void }) {
  const [plan, setPlan] = useState<Plan>(site.plan)
  const [reason, setReason] = useState("")
  const down = PLANS.findIndex((p) => p.id === plan) < PLANS.findIndex((p) => p.id === site.plan)
  return (
    <DialogContent
      title="Change plan"
      description={`${site.name} is on ${planInfo(site.plan).name}. Changes made here aren't charged — use it for goodwill upgrades or fixing a billing mistake.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={plan === site.plan || reason.trim().length < 3}
            onClick={() => {
              adminActions.changePlan(site.id, plan, reason.trim())
              showToast(`${site.name} moved to ${planInfo(plan).name}`)
              onClose()
            }}
          >
            Change plan
          </Button>
        </>
      }
    >
      <Field label="New plan">
        <Select value={plan} onValueChange={(v) => setPlan(v as Plan)} options={PLANS.map((p) => ({ value: p.id, label: `${p.name}${p.price ? ` · $${p.price}/mo` : ""}` }))} />
      </Field>
      {down && (
        <Alert tone="warning" size="sm">
          Pages over the {planInfo(plan).name} limit go back to locked, and a custom domain stops working on Free.
        </Alert>
      )}
      <Field label="Reason" helper="Saved to the audit log">
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. compensating for downtime on 21 Oct" />
      </Field>
    </DialogContent>
  )
}

function GrantCredits({ site, onClose }: { site: AdminSite; onClose: () => void }) {
  const [amount, setAmount] = useState(50)
  const [reason, setReason] = useState("")
  return (
    <DialogContent
      title="Grant agent credits"
      description={`${site.name} has used ${site.credits} of ${planInfo(site.plan).credits + site.bonusCredits} credits this month. Extra credits expire at the end of the month.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={reason.trim().length < 3}
            onClick={() => {
              adminActions.grantCredits(site.id, amount, reason.trim())
              showToast(`Granted ${amount} credits to ${site.name}`)
              onClose()
            }}
          >
            Grant {amount} credits
          </Button>
        </>
      }
    >
      <Field label="Amount">
        <SegmentedControl label="Credits" value={amount} onChange={setAmount} fill options={[25, 50, 100, 200].map((n) => ({ value: n, label: `+${n}` }))} />
      </Field>
      <Field label="Reason" helper="Saved to the audit log">
        <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. page build failed twice (gen_9818)" />
      </Field>
    </DialogContent>
  )
}
