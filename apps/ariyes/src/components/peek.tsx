import type { ReactNode } from "react"
import { Check, Star } from "lucide-react"
import type { PeekMap, Project, ToolId } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"

/** the headline number of a tile and what it counts */
function Stat({ value, label, tone }: { value: ReactNode; label: ReactNode; tone?: "good" }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="type-h3 text-fg-primary tabular-nums">{value}</span>
      <span className={cn("type-body-sm", tone === "good" ? "text-status-success-text" : "text-fg-secondary")}>{label}</span>
    </p>
  )
}

/** a thin bar for "how full" or "how far" */
function Meter({ value, label }: { value: number; label: string }) {
  return (
    <span role="meter" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="block h-2 overflow-hidden rounded-full bg-subtle">
      <span className="block h-full rounded-full bg-action-primary" style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }} />
    </span>
  )
}

/** nothing to show yet: say what will appear, not "no data" */
function Empty({ children }: { children: ReactNode }) {
  return <p className="type-body-sm text-fg-tertiary">{children}</p>
}

const n = (v: number) => v.toLocaleString("en-US")

/** what a tile shows inside: a sneak peek of the tool, from the project's latest numbers */
export function Peek({ tool, data, project }: { tool: ToolId; data?: PeekMap[ToolId]; project: Project }) {
  const money = (v: number) => `${project.currency} ${n(v)}`
  switch (tool) {
    case "appointments": {
      const d = data as PeekMap["appointments"] | undefined
      if (!d || d.today === 0) return <Empty>Bookings from your website will show up here, starting with today’s.</Empty>
      return (
        <div className="flex flex-col gap-3">
          <Stat value={d.today} label="today" />
          <ul className="flex flex-col divide-y divide-line-default">
            {d.next.map((a) => (
              <li key={a.time + a.name} className="flex items-baseline gap-3 py-1.5 type-body-sm">
                <span className="w-11 shrink-0 font-medium text-fg-primary tabular-nums">{a.time}</span>
                <span className="shrink-0 text-fg-primary">{a.name}</span>
                <span className="ml-auto min-w-0 truncate text-fg-tertiary max-[400px]:hidden">{a.what}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    case "payments": {
      const d = data as PeekMap["payments"] | undefined
      if (!d) return <Empty>Deposits and payments will show up here.</Empty>
      const max = Math.max(...d.lastSevenDays, 1)
      return (
        <div className="flex flex-col gap-3">
          <Stat value={money(d.thisMonth)} label="this month" />
          <div className="flex h-12 items-end gap-1.5" role="img" aria-label={`Last 7 days: ${d.lastSevenDays.map(money).join(", ")}`}>
            {d.lastSevenDays.map((v, i) => (
              <span
                key={i}
                className={cn("flex-1 rounded-t-[4px]", i === d.lastSevenDays.length - 1 ? "bg-action-primary" : "bg-accent-blue-subtle")}
                style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
              />
            ))}
          </div>
          {d.pending > 0 && <p className="type-body-sm text-fg-secondary">{d.pending} waiting to be paid</p>}
        </div>
      )
    }
    case "reviews": {
      const d = data as PeekMap["reviews"] | undefined
      if (!d || d.total === 0) return <Empty>After a visit, patients get a short message asking for a review.</Empty>
      return (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-2">
            <span className="type-h3 tabular-nums">{d.rating.toFixed(1)}</span>
            <span aria-label={`${d.rating} out of 5 stars`} className="flex gap-0.5 text-yellow-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} aria-hidden className={cn("size-4", s <= Math.round(d.rating) ? "fill-current" : "opacity-30")} />
              ))}
            </span>
          </p>
          <p className="type-body-sm text-fg-secondary">
            {n(d.total)} reviews{d.newThisWeek > 0 && <span className="text-status-success-text"> · {d.newThisWeek} new this week</span>}
          </p>
        </div>
      )
    }
    case "inbox": {
      const d = data as PeekMap["inbox"] | undefined
      if (!d || (!d.unread && !d.latest)) return <Empty>Messages from your website’s contact form land here.</Empty>
      return (
        <div className="flex flex-col gap-3">
          <Stat value={d.unread} label="unread" />
          {d.latest && (
            <div className="flex flex-col gap-0.5 rounded-md bg-subtle px-3 py-2">
              <span className="flex items-baseline justify-between gap-2 type-label-sm">
                <span className="truncate text-fg-primary">{d.latest.from}</span>
                <span className="shrink-0 font-normal text-fg-tertiary">{d.latest.when}</span>
              </span>
              <span className="line-clamp-1 type-body-sm text-fg-secondary">{d.latest.preview}</span>
            </div>
          )}
        </div>
      )
    }
    case "contacts": {
      const d = data as PeekMap["contacts"] | undefined
      if (!d || d.total === 0) return <Empty>Everyone who books, pays or gets in touch is added for you.</Empty>
      return <Stat value={n(d.total)} label={d.newThisWeek ? `+${d.newThisWeek} this week` : "contacts"} tone={d.newThisWeek ? "good" : undefined} />
    }
    case "crm": {
      const d = data as PeekMap["crm"] | undefined
      if (!d) return <Empty>Follow each patient from first enquiry to their next check-up.</Empty>
      const total = d.stages.reduce((a, s) => a + s.count, 0) || 1
      const shades = ["bg-blue-500", "bg-blue-300", "bg-green-500", "bg-yellow-400"]
      return (
        <div className="flex flex-col gap-3">
          <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {d.stages.map((s, i) => (
              <span key={s.name} className={shades[i % shades.length]} style={{ width: `${(s.count / total) * 100}%` }} />
            ))}
          </span>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {d.stages.map((s, i) => (
              <li key={s.name} className="flex items-center gap-2 type-body-sm">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", shades[i % shades.length])} />
                <span className="truncate text-fg-secondary">{s.name}</span>
                <span className="ml-auto font-medium text-fg-primary tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    case "campaigns": {
      const d = data as PeekMap["campaigns"] | undefined
      if (!d || d.active === 0) return <Empty>No campaign running. A check-up reminder is a good first one.</Empty>
      return (
        <div className="flex flex-col gap-3">
          <Stat value={d.active} label="active" />
          {d.top && (
            <div className="flex flex-col gap-1.5">
              <span className="flex justify-between gap-3 type-body-sm">
                <span className="truncate text-fg-primary">{d.top.name}</span>
                <span className="shrink-0 text-fg-secondary tabular-nums">{d.top.openRate}% opened</span>
              </span>
              <Meter value={d.top.openRate / 100} label={`${d.top.name}: ${d.top.openRate}% opened`} />
            </div>
          )}
        </div>
      )
    }
    case "todo": {
      const d = data as PeekMap["todo"] | undefined
      if (!d || d.open === 0) return <Empty>All done. Tasks your team adds will show here.</Empty>
      return (
        <div className="flex flex-col gap-3">
          <Stat value={d.open} label={d.dueToday ? `open · ${d.dueToday} due today` : "open"} />
          {d.next && (
            <p className="flex items-start gap-2 type-body-sm text-fg-primary">
              <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong" />
              <span className="line-clamp-2">{d.next}</span>
            </p>
          )}
        </div>
      )
    }
    case "drive": {
      const d = data as PeekMap["drive"] | undefined
      if (!d) return <Empty>Photos and documents for this project.</Empty>
      return (
        <div className="flex flex-col gap-3">
          <Stat value={`${d.usedGb} GB`} label={`of ${d.totalGb} GB`} />
          <Meter value={d.usedGb / d.totalGb} label={`${d.usedGb} of ${d.totalGb} GB used`} />
          <p className="type-body-sm text-fg-secondary">{n(d.files)} files</p>
        </div>
      )
    }
    case "settings": {
      const d = data as PeekMap["settings"] | undefined
      if (!d) return null
      return (
        <dl className="flex flex-col gap-1.5 type-body-sm">
          {[
            ["Plan", d.plan],
            ["Domain", d.domain],
            ["Team", `${d.seats} ${d.seats === 1 ? "person" : "people"}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-fg-secondary">{k}</dt>
              <dd className="truncate font-medium text-fg-primary">{v}</dd>
            </div>
          ))}
        </dl>
      )
    }
    case "estimates": {
      const d = data as PeekMap["estimates"] | undefined
      if (!d || d.open === 0) return <Empty>Quote requests for bigger treatments will show up here.</Empty>
      return <Stat value={d.open} label={`open · ${d.awaitingReply} awaiting reply`} />
    }
    case "locations": {
      const d = data as PeekMap["locations"] | undefined
      if (!d) return <Empty>Add your branches, each with its own hours.</Empty>
      return <Stat value={d.count} label={`branches · busiest: ${d.busiest}`} />
    }
    case "sequences": {
      const d = data as PeekMap["sequences"] | undefined
      if (!d || d.running === 0) return <Empty>Follow-ups that send themselves after a visit.</Empty>
      return <Stat value={d.running} label={`running · ${n(d.enrolled)} people in them`} />
    }
    case "broadcasts": {
      const d = data as PeekMap["broadcasts"] | undefined
      if (!d || d.scheduled === 0) return <Empty>Send one message to many people at once.</Empty>
      return <Stat value={d.scheduled} label={d.next ? `scheduled · next ${d.next}` : "scheduled"} />
    }
    case "helpdesk": {
      const d = data as PeekMap["helpdesk"] | undefined
      if (!d || d.open === 0) return (
        <p className="flex items-center gap-2 type-body-sm text-status-success-text">
          <Check aria-hidden className="size-4" /> No open tickets
        </p>
      )
      return <Stat value={d.open} label={`open · oldest ${d.oldestHours}h`} />
    }
  }
}
