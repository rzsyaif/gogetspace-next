"use client"

import { useState } from "react"
import { Check, Download, Minus, Search, UserPlus } from "lucide-react"
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogContent,
  Field,
  Input,
  SegmentedControl,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui"
import { PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { ME, PERMISSIONS, minutesLabel, type PlanSettings, type Role } from "@/lib/admin/data"
import { adminActions, minutesSince, showToast, useAdmin } from "@/lib/admin/store"
import { FilterBar } from "./common"

/* ---------------- plans & features ---------------- */

export function PlansAdminPage() {
  const s = useAdmin()
  const [draft, setDraft] = useState<PlanSettings[]>(s.plans)
  const [limit, setLimit] = useState<number | null>(s.freeSiteLimit)
  const dirty = JSON.stringify(draft) !== JSON.stringify(s.plans) || limit !== s.freeSiteLimit
  const priceChanged = draft.some((p, i) => p.price !== s.plans[i].price)
  const set = (i: number, patch: Partial<PlanSettings>) => setDraft((d) => d.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const freeCounts = s.clients.map((c) => s.sites.filter((x) => x.clientId === c.id && x.plan === "free").length)
  const affected = limit == null ? 0 : freeCounts.filter((n) => n > limit).length

  return (
    <PanelPage className="pb-28">
      <PanelHeader title="Plans & features" description="What each plan includes, the free-website rule and feature flags. Changes apply to everyone on that plan straight away." />

      <div className="grid gap-4 lg:grid-cols-3">
        {draft.map((p, i) => (
          <PanelSection key={p.id} title={p.name} actions={<Badge tone={p.id === "free" ? "neutral" : "brand"} dot={false}>{s.sites.filter((x) => x.plan === p.id).length} websites</Badge>}>
            <Field label="Price per month (USD)">
              <Input type="number" min={0} value={p.price} disabled={p.id === "free"} onChange={(e) => set(i, { price: Math.max(0, Number(e.target.value)) })} className="h-11" />
            </Field>
            <Field label="Pages">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input type="number" min={1} value={p.pages ?? ""} placeholder="Unlimited" disabled={p.pages === null} onChange={(e) => set(i, { pages: Math.max(1, Number(e.target.value)) })} className="h-11" aria-label={`${p.name} page limit`} />
                </div>
                <Switch label="Unlimited" checked={p.pages === null} onCheckedChange={(on) => set(i, { pages: on ? null : 5 })} />
              </div>
            </Field>
            <Field label="Agent credits per month">
              <Input type="number" min={0} step={10} value={p.credits} onChange={(e) => set(i, { credits: Math.max(0, Number(e.target.value)) })} className="h-11" />
            </Field>
            <Field label="Analytics history">
              <Select
                value={String(p.analyticsDays)}
                onValueChange={(v) => set(i, { analyticsDays: Number(v) })}
                options={[7, 30, 90, 365].map((d) => ({ value: String(d), label: d === 365 ? "12 months" : `${d} days` }))}
                className="h-11"
              />
            </Field>
            <Switch label="Custom domain" checked={p.customDomain} onCheckedChange={(on) => set(i, { customDomain: on })} />
          </PanelSection>
        ))}
      </div>
      {priceChanged && (
        <Alert tone="info" size="sm">
          Price changes apply to new subscriptions. Existing ones keep their price until you migrate them, and they get 30 days&apos; notice by email.
        </Alert>
      )}

      <PanelSection title="Free websites per account">
        <p className="type-body-sm text-fg-secondary">Still undecided. A limit nudges people with several drafts to upgrade one; no limit lets them try ideas freely.</p>
        <SegmentedControl
          label="Free websites per account"
          size="sm"
          value={limit === null ? "none" : String(limit)}
          onChange={(v) => setLimit(v === "none" ? null : Number(v))}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "none", label: "No limit" },
          ]}
          className="self-start"
        />
        <p className="type-caption text-fg-tertiary">
          {limit == null ? "No limit today." : affected ? `${affected} ${affected === 1 ? "client already has" : "clients already have"} more than ${limit} free ${limit === 1 ? "website" : "websites"}. They keep them; they just can't add another.` : `No current client has more than ${limit}.`}
        </p>
      </PanelSection>

      <PanelSection title="Feature flags">
        <ul className="flex flex-col divide-y divide-line-default">
          {s.flags.map((f) => (
            <li key={f.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-label-md text-fg-primary">{f.label}</span>
                <span className="type-caption text-fg-tertiary">
                  {f.help} · {f.audience}
                </span>
              </span>
              <Switch
                checked={f.on}
                onCheckedChange={(on) => {
                  adminActions.setFlag(f.id, on)
                  showToast(`${f.label} ${on ? "on" : "off"}`)
                }}
                label={<span className="sr-only">{f.label}</span>}
              />
            </li>
          ))}
        </ul>
      </PanelSection>

      {dirty && (
        <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4 lg:left-[260px]">
          <div className="flex w-full max-w-[560px] items-center gap-3 rounded-lg border border-line-default bg-surface-raised p-3 pl-4 shadow-soft-md">
            <span className="min-w-0 flex-1 type-label-md text-fg-primary">Unsaved plan changes</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDraft(s.plans)
                setLimit(s.freeSiteLimit)
              }}
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={() => {
                adminActions.savePlans(draft, limit)
                showToast("Plans saved")
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
    </PanelPage>
  )
}

/* ---------------- team & roles ---------------- */

const ROLES: Role[] = ["Owner", "Admin", "Support", "Finance", "Viewer"]

export function TeamPage() {
  const { team } = useAdmin()
  const [invite, setInvite] = useState(false)
  return (
    <PanelPage>
      <PanelHeader
        title="Team & roles"
        description="Who can see and change client accounts. Every change is recorded in the audit log."
        actions={
          <Button leadingIcon={<UserPlus />} onClick={() => setInvite(true)}>
            Invite
          </Button>
        }
      />
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Member</TableHeaderCell>
            <TableHeaderCell className="w-[200px]">Role</TableHeaderCell>
            <TableHeaderCell>Two-factor</TableHeaderCell>
            <TableHeaderCell>Last active</TableHeaderCell>
            <TableHeaderCell>
              <span className="sr-only">Actions</span>
            </TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {team.map((m) => {
            const me = m.id === ME.id
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <span className="flex items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <span className="flex flex-col">
                      <span className="type-label-md">
                        {m.name}
                        {me && <span className="text-fg-tertiary"> (you)</span>}
                      </span>
                      <span className="type-caption text-fg-tertiary">{m.email}</span>
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <Select
                    value={m.role}
                    disabled={me}
                    onValueChange={(v) => {
                      adminActions.setRole(m.id, v as Role)
                      showToast(`${m.name} is now ${v}`)
                    }}
                    options={ROLES.map((r) => ({ value: r, label: r }))}
                    className="h-10"
                  />
                </TableCell>
                <TableCell>{m.twoFactor ? <Badge tone="success">On</Badge> : <Badge tone="warning">Off</Badge>}</TableCell>
                <TableCell className="text-fg-secondary">{m.lastActive}</TableCell>
                <TableCell align="right">
                  {!me && (
                    <Button
                      size="sm"
                      variant="link"
                      className="text-status-error-text"
                      onClick={() => {
                        adminActions.removeMember(m.id)
                        showToast(`${m.name} removed`)
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {team.some((m) => !m.twoFactor) && (
        <Alert tone="warning" size="sm">
          Someone with access to client accounts doesn&apos;t have two-factor sign-in. Support staff can log in as clients, so turn it on before they do.
        </Alert>
      )}

      <h2 className="type-h6 text-fg-primary">What each role can do</h2>
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Permission</TableHeaderCell>
            {ROLES.map((r) => (
              <TableHeaderCell key={r} className="text-center">
                {r}
              </TableHeaderCell>
            ))}
          </tr>
        </TableHead>
        <TableBody>
          {PERMISSIONS.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.label}</TableCell>
              {ROLES.map((r) => (
                <TableCell key={r} className="text-center">
                  {p.roles.includes(r) ? <Check aria-label="Allowed" className="mx-auto size-4 text-status-success-text" /> : <Minus aria-label="Not allowed" className="mx-auto size-4 text-fg-disabled" />}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={invite} onOpenChange={setInvite}>
        {invite && <Invite onClose={() => setInvite(false)} />}
      </Dialog>
    </PanelPage>
  )
}

function Invite({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("Support")
  const ok = name.trim().length > 1 && /^[^@\s]+@get\.space$/i.test(email.trim())
  return (
    <DialogContent
      title="Invite a team member"
      description="They get an email to set a password and turn on two-factor sign-in."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              adminActions.invite(name.trim(), email.trim().toLowerCase(), role)
              showToast(`Invite sent to ${email.trim()}`)
              onClose()
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nadia Ismail" />
      </Field>
      <Field label="Work email" helper={email && !ok ? "Use a @get.space address" : undefined}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nadia@get.space" />
      </Field>
      <Field label="Role">
        <Select value={role} onValueChange={(v) => setRole(v as Role)} options={ROLES.filter((r) => r !== "Owner").map((r) => ({ value: r, label: r }))} />
      </Field>
    </DialogContent>
  )
}

/* ---------------- audit log ---------------- */

export function AuditPage() {
  const { audit, team } = useAdmin()
  const [q, setQ] = useState("")
  const [actor, setActor] = useState("all")
  const term = q.trim().toLowerCase()
  const rows = audit.filter((a) => (actor === "all" || a.actor === actor) && (!term || [a.action, a.target, a.detail].some((x) => x?.toLowerCase().includes(term))))
  const actors = [...new Set([...team.map((m) => m.name), ...audit.map((a) => a.actor)])]

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = ["When,Who,Action,Target,Detail", ...rows.map((a) => [minutesLabel(minutesSince(a)), a.actor, a.action, a.target, a.detail ?? ""].map(esc).join(","))].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "gogetspace-audit-log.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PanelPage>
      <PanelHeader
        title="Audit log"
        description="Every change the team makes to client accounts, money, models and settings. Kept for 2 years and can't be edited."
        actions={
          <Button variant="secondary" leadingIcon={<Download />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <FilterBar>
        <div className="md:w-[320px]">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action, client or detail" aria-label="Search the audit log" leadingIcon={<Search />} className="h-11" />
        </div>
        <div className="md:w-[220px]">
          <Select value={actor} onValueChange={setActor} options={[{ value: "all", label: "Everyone" }, ...actors.map((a) => ({ value: a, label: a }))]} className="h-11" />
        </div>
      </FilterBar>
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>When</TableHeaderCell>
            <TableHeaderCell>Who</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
            <TableHeaderCell>Target</TableHeaderCell>
            <TableHeaderCell>Detail</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {rows.length === 0 && <TableEmpty colSpan={5}>Nothing matches.</TableEmpty>}
          {rows.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="text-fg-secondary">{minutesLabel(minutesSince(a))}</TableCell>
              <TableCell>{a.actor}</TableCell>
              <TableCell className="type-label-md">{a.action}</TableCell>
              <TableCell>
                <span className="block max-w-[240px] truncate">{a.target}</span>
              </TableCell>
              <TableCell className="min-w-[280px] whitespace-normal text-fg-secondary">{a.detail ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PanelPage>
  )
}
