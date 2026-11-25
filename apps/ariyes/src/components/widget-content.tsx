import type { ReactNode } from "react"
import { Check, Star } from "lucide-react"
import type { PeekMap, Project, ToolId, WidgetSize } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"

/* ---------- building blocks ---------- */

/** the headline number of a widget and what it counts */
function Stat({ value, label, tone, big }: { value: ReactNode; label?: ReactNode; tone?: "good"; big?: boolean }) {
  return (
    <p className="flex min-w-0 flex-col gap-0.5">
      <span className={cn("truncate text-fg-primary tabular-nums", big ? "type-h2 @max-[799px]:type-h3" : "type-h3 @max-[799px]:type-h4")}>{value}</span>
      {label && <span className={cn("truncate type-body-sm", tone === "good" ? "text-status-success-text" : "text-fg-secondary")}>{label}</span>}
    </p>
  )
}

/** a thin bar for "how full" or "how far" */
function Meter({ value, label }: { value: number; label: string }) {
  return (
    <span role="meter" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="block h-1.5 w-full overflow-hidden rounded-full bg-subtle">
      <span className="block h-full rounded-full bg-action-primary" style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }} />
    </span>
  )
}

/** label · value rows, divided */
function Rows({ rows }: { rows: { key: string; lead?: ReactNode; main: ReactNode; side?: ReactNode }[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line-default">
      {rows.map((r) => (
        <li key={r.key} className="flex items-baseline gap-3 py-1.5 type-body-sm @max-[799px]:py-1">
          {r.lead != null && <span className="w-11 shrink-0 font-medium text-fg-primary tabular-nums">{r.lead}</span>}
          <span className="min-w-0 flex-1 truncate text-fg-primary">{r.main}</span>
          {r.side != null && <span className="shrink-0 text-fg-tertiary">{r.side}</span>}
        </li>
      ))}
    </ul>
  )
}

function Bars({ values, label, tall }: { values: number[]; label: string; tall?: boolean }) {
  const max = Math.max(...values, 1)
  return (
    <div className={cn("flex items-end gap-1.5", tall ? "h-20" : "h-14")} role="img" aria-label={label}>
      {values.map((v, i) => (
        <span
          key={i}
          className={cn("flex-1 rounded-t-[4px]", i === values.length - 1 ? "bg-action-primary" : "bg-accent-blue-subtle")}
          style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function Stars({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="flex gap-0.5 text-yellow-400">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} aria-hidden className={cn(size, s <= Math.round(rating) ? "fill-current" : "opacity-30")} />
      ))}
    </span>
  )
}

/** nothing to show yet: say what will appear, not "no data" */
function Empty({ children }: { children: ReactNode }) {
  return <p className="line-clamp-3 type-body-sm text-fg-tertiary">{children}</p>
}

/** wide widgets: the headline on the left, the detail on the right */
function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-6">
      <div className="min-w-0 max-w-[14rem]">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  )
}

const CRM_SHADES = ["bg-blue-500", "bg-blue-300", "bg-green-500", "bg-yellow-400"]
function StageBar({ stages }: { stages: { name: string; count: number }[] }) {
  const total = stages.reduce((a, s) => a + s.count, 0) || 1
  return (
    <span className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
      {stages.map((s, i) => (
        <span key={s.name} className={CRM_SHADES[i % CRM_SHADES.length]} style={{ width: `${(s.count / total) * 100}%` }} />
      ))}
    </span>
  )
}

const TONES = { muted: "text-fg-tertiary", good: "text-status-success-text", warn: "text-status-warning-text" }
type Tone = keyof typeof TONES

/** large widgets: a short list, each row a title with a status or time beside it and one line of detail */
function Items({ items }: { items: { key: string; title: ReactNode; detail?: ReactNode; side?: ReactNode; tone?: Tone }[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line-default">
      {items.map((it) => (
        <li key={it.key} className="flex min-w-0 flex-col gap-0.5 py-2 first:pt-0 last:pb-0 @max-[799px]:py-1.5 @max-[799px]:nth-3:hidden">
          <span className="flex items-baseline gap-3">
            <span className="min-w-0 flex-1 truncate type-label-md text-fg-primary">{it.title}</span>
            {it.side != null && <span className={cn("shrink-0 type-body-sm tabular-nums", TONES[it.tone ?? "muted"])}>{it.side}</span>}
          </span>
          {it.detail != null && <span className="truncate type-body-sm text-fg-secondary">{it.detail}</span>}
        </li>
      ))}
    </ul>
  )
}

/** a large widget: the headline, then its list */
function Listed({ stat, items }: { stat: ReactNode; items: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 @max-[799px]:gap-3">
      {stat}
      {items}
    </div>
  )
}

const n = (v: number) => v.toLocaleString("en-US")

/* ---------- each tool, at each size ---------- */

/**
 * The bottom half of a widget: a sneak peek of the tool from the project's latest numbers. Small widgets get the
 * headline figure, wide ones add a detail beside it, large ones add the lists.
 */
export function WidgetContent({ tool, size, data, project }: { tool: ToolId; size: WidgetSize; data?: PeekMap[ToolId]; project: Project }) {
  const money = (v: number) => `${project.currency} ${n(v)}`
  const small = size === "small"
  const large = size === "large"

  switch (tool) {
    case "appointments": {
      const d = data as PeekMap["appointments"] | undefined
      if (!d || d.today === 0) return <Empty>Bookings from your website will show up here.</Empty>
      const next = d.next[0]
      if (small) return <Stat value={d.today} label={next ? `Next ${next.time} · ${next.name}` : "today"} />
      const rows = d.next.slice(0, large ? 5 : 2).map((a) => ({ key: a.time, lead: a.time, main: a.name, side: large ? a.what : undefined }))
      if (!large) return <Split left={<Stat value={d.today} label="today" />} right={<Rows rows={rows} />} />
      return (
        <div className="flex flex-col gap-3">
          <Stat value={d.today} label="appointments today" big />
          <Rows rows={rows} />
        </div>
      )
    }
    case "payments": {
      const d = data as PeekMap["payments"] | undefined
      if (!d) return <Empty>Deposits and payments will show up here.</Empty>
      const chart = <Bars values={d.lastSevenDays} label={`Last 7 days: ${d.lastSevenDays.map(money).join(", ")}`} tall={large} />
      if (small) return <Stat value={money(d.thisMonth)} label="this month" />
      if (!large) return <Split left={<Stat value={money(d.thisMonth)} label="this month" />} right={chart} />
      return (
        <div className="flex flex-col gap-4">
          <Stat value={money(d.thisMonth)} label={d.pending ? `this month · ${d.pending} waiting to be paid` : "this month"} big />
          {chart}
          {d.recent && <Rows rows={d.recent.slice(0, 2).map((p) => ({ key: p.name + p.amount, main: p.name, side: money(p.amount) }))} />}
        </div>
      )
    }
    case "reviews": {
      const d = data as PeekMap["reviews"] | undefined
      if (!d || d.total === 0) return <Empty>After a visit, patients get a short message asking for a review.</Empty>
      const head = (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className={cn("tabular-nums", large ? "type-h2 @max-[799px]:type-h3" : "type-h3 @max-[799px]:type-h4")}>{d.rating.toFixed(1)}</span>
            {!small && <Stars rating={d.rating} />}
          </span>
          <span className="truncate type-body-sm text-fg-secondary">
            {small ? `${n(d.total)} reviews` : `${n(d.total)} reviews`}
            {d.newThisWeek > 0 && !small && <span className="text-status-success-text"> · {d.newThisWeek} new</span>}
          </span>
        </div>
      )
      if (small) return head
      const quotes = (d.latest ?? []).slice(0, large ? 2 : 1)
      const quoteList = (
        <ul className="flex flex-col gap-3">
          {quotes.map((q) => (
            <li key={q.name} className="flex flex-col gap-1">
              <p className={cn("type-body-sm text-fg-primary", large ? "line-clamp-3" : "line-clamp-2")}>“{q.text}”</p>
              <span className="type-label-sm text-fg-tertiary">{q.name}</span>
            </li>
          ))}
        </ul>
      )
      if (!large) return <Split left={head} right={quoteList} />
      return (
        <div className="flex flex-col gap-4">
          {head}
          {quoteList}
        </div>
      )
    }
    case "inbox": {
      const d = data as PeekMap["inbox"] | undefined
      if (!d || (!d.unread && !d.recent?.length)) return <Empty>Messages from your website’s contact form land here.</Empty>
      if (small) return <Stat value={d.unread} label={d.recent?.[0] ? `Latest: ${d.recent[0].from}` : "unread"} />
      const msgs = (d.recent ?? []).slice(0, large ? 3 : 1)
      const list = (
        <ul className="flex flex-col gap-2">
          {msgs.map((m) => (
            <li key={m.from + m.when} className="flex flex-col gap-0.5 rounded-md bg-subtle px-3 py-2 @max-[799px]:nth-3:hidden">
              <span className="flex items-baseline justify-between gap-2 type-label-sm">
                <span className="truncate text-fg-primary">{m.from}</span>
                <span className="shrink-0 font-normal text-fg-tertiary">{m.when}</span>
              </span>
              <span className="line-clamp-1 type-body-sm text-fg-secondary">{m.preview}</span>
            </li>
          ))}
        </ul>
      )
      if (!large) return <Split left={<Stat value={d.unread} label="unread" />} right={list} />
      return (
        <div className="flex flex-col gap-3">
          <Stat value={d.unread} label="unread" big />
          {list}
        </div>
      )
    }
    case "contacts": {
      const d = data as PeekMap["contacts"] | undefined
      if (!d || d.total === 0) return <Empty>Everyone who books, pays or gets in touch is added for you.</Empty>
      const stat = <Stat value={n(d.total)} label={d.newThisWeek ? `+${d.newThisWeek} this week` : "contacts"} tone={d.newThisWeek ? "good" : undefined} big={large} />
      if (small) return stat
      const people = (d.recent ?? []).slice(0, large ? 4 : 2)
      const list = <Rows rows={people.map((p) => ({ key: p, main: p, side: "new" }))} />
      if (!large) return <Split left={stat} right={list} />
      return (
        <div className="flex flex-col gap-3">
          {stat}
          <span className="type-label-sm text-fg-tertiary">Recently added</span>
          {list}
        </div>
      )
    }
    case "crm": {
      const d = data as PeekMap["crm"] | undefined
      if (!d) return <Empty>Follow each patient from first enquiry to their next check-up.</Empty>
      const total = d.stages.reduce((a, s) => a + s.count, 0)
      const legend = (
        <ul className={cn("grid gap-x-4 gap-y-1.5", large ? "grid-cols-1" : "grid-cols-2")}>
          {d.stages.map((s, i) => (
            <li key={s.name} className="flex items-center gap-2 type-body-sm">
              <span aria-hidden className={cn("size-2 shrink-0 rounded-full", CRM_SHADES[i % CRM_SHADES.length])} />
              <span className="truncate text-fg-secondary">{s.name}</span>
              <span className="ml-auto font-medium text-fg-primary tabular-nums">{s.count}</span>
            </li>
          ))}
        </ul>
      )
      if (small)
        return (
          <div className="flex flex-col gap-1.5">
            <Stat value={total} label="in the pipeline" />
            <StageBar stages={d.stages} />
          </div>
        )
      return (
        <div className={cn("flex flex-col", large ? "gap-4" : "gap-3")}>
          {large && <Stat value={total} label="people in the pipeline" big />}
          <StageBar stages={d.stages} />
          {legend}
        </div>
      )
    }
    case "campaigns": {
      const d = data as PeekMap["campaigns"] | undefined
      if (!d || d.active === 0) return <Empty>No campaign running. A check-up reminder is a good first one.</Empty>
      const top = d.list?.[0]
      if (small) return <Stat value={d.active} label={top ? `active · ${top.openRate}% opened` : "active"} />
      const list = (d.list ?? []).slice(0, large ? 3 : 1)
      const meters = (
        <ul className="flex flex-col gap-3">
          {list.map((c) => (
            <li key={c.name} className="flex flex-col gap-1.5">
              <span className="flex justify-between gap-3 type-body-sm">
                <span className="truncate text-fg-primary">{c.name}</span>
                <span className="shrink-0 text-fg-secondary tabular-nums">{c.openRate}%</span>
              </span>
              <Meter value={c.openRate / 100} label={`${c.name}: ${c.openRate}% opened`} />
              {large && <span className="type-body-sm text-fg-tertiary">Sent to {n(c.sent)}</span>}
            </li>
          ))}
        </ul>
      )
      if (!large) return <Split left={<Stat value={d.active} label="active" />} right={meters} />
      return (
        <div className="flex flex-col gap-4">
          <Stat value={d.active} label="active campaigns" big />
          {meters}
        </div>
      )
    }
    case "todo": {
      const d = data as PeekMap["todo"] | undefined
      if (!d || d.open === 0) return <Empty>All done. Tasks your team adds will show here.</Empty>
      const label = d.dueToday ? `open · ${d.dueToday} due today` : "open"
      if (small) return <Stat value={d.open} label={label} />
      const items = (d.items ?? []).slice(0, large ? 4 : 2)
      const list = (
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <li key={t.text} className="flex items-start gap-2 type-body-sm text-fg-primary">
              <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-full border-[1.5px] border-line-strong" />
              <span className={cn("min-w-0 flex-1", large ? "line-clamp-2" : "truncate")}>{t.text}</span>
              {large && t.due && <span className={cn("shrink-0", t.due === "Today" ? "text-status-warning-text" : "text-fg-tertiary")}>{t.due}</span>}
            </li>
          ))}
        </ul>
      )
      if (!large) return <Split left={<Stat value={d.open} label={label} />} right={list} />
      return (
        <div className="flex flex-col gap-4">
          <Stat value={d.open} label={label} big />
          {list}
        </div>
      )
    }
    case "drive": {
      const d = data as PeekMap["drive"] | undefined
      if (!d) return <Empty>Photos and documents for this project.</Empty>
      const meter = <Meter value={d.usedGb / d.totalGb} label={`${d.usedGb} of ${d.totalGb} GB used`} />
      if (small)
        return (
          <div className="flex flex-col gap-1.5">
            <Stat value={`${d.usedGb} GB`} label={`of ${d.totalGb} GB`} />
            {meter}
          </div>
        )
      if (!large)
        return (
          <Split
            left={<Stat value={`${d.usedGb} GB`} label={`of ${d.totalGb} GB`} />}
            right={
              <div className="flex flex-col gap-2">
                {meter}
                <span className="type-body-sm text-fg-secondary">{n(d.files)} files</span>
              </div>
            }
          />
        )
      return (
        <div className="flex flex-col gap-4">
          <Stat value={`${d.usedGb} GB`} label={`of ${d.totalGb} GB · ${n(d.files)} files`} big />
          {meter}
          {d.byType && <Rows rows={d.byType.map((t) => ({ key: t.label, main: t.label, side: `${t.gb} GB` }))} />}
        </div>
      )
    }
    case "settings": {
      const d = data as PeekMap["settings"] | undefined
      if (!d) return null
      if (small) return <Stat value={d.plan} label={d.domain} />
      return (
        <dl className="flex flex-col gap-1.5 type-body-sm">
          {[
            ["Plan", d.plan],
            ["Domain", d.domain],
            ...(large ? [["Team", `${d.seats} ${d.seats === 1 ? "person" : "people"}`], ["SSL", "Active"], ["Billing", "Monthly"]] : []),
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
      const stat = <Stat value={d.open} label={`open · ${d.awaitingReply} awaiting reply`} big={large} />
      if (!large || !d.list?.length) return stat
      return (
        <Listed
          stat={stat}
          items={
            <Items
              items={d.list.slice(0, 3).map((e) => ({
                key: e.name + e.matter,
                title: e.name,
                detail: e.amount ? `${e.matter} · ${money(e.amount)}` : e.matter,
                side: e.status === "awaiting" ? "Awaiting reply" : "Draft",
                tone: e.status === "awaiting" ? "warn" : "muted",
              }))}
            />
          }
        />
      )
    }
    case "locations": {
      const d = data as PeekMap["locations"] | undefined
      if (!d) return <Empty>Add your branches, each with its own hours.</Empty>
      const stat = <Stat value={d.count} label={`branches · busiest: ${d.busiest}`} big={large} />
      if (!large || !d.list?.length) return stat
      const STATUS = { open: ["Open", "good"], closing: ["Closing soon", "warn"], closed: ["Closed", "muted"] } as const
      return (
        <Listed
          stat={stat}
          items={
            <Items
              items={d.list.slice(0, 3).map((b) => ({
                key: b.name,
                title: b.name,
                detail: b.detail,
                side: (
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className="size-1.5 rounded-full bg-current" />
                    {STATUS[b.status][0]}
                  </span>
                ),
                tone: STATUS[b.status][1],
              }))}
            />
          }
        />
      )
    }
    case "sequences": {
      const d = data as PeekMap["sequences"] | undefined
      if (!d || d.running === 0) return <Empty>Follow-ups that send themselves after a visit.</Empty>
      const stat = <Stat value={d.running} label={`running · ${n(d.enrolled)} people`} big={large} />
      if (!large || !d.list?.length) return stat
      return (
        <Listed
          stat={stat}
          items={<Items items={d.list.slice(0, 3).map((q) => ({ key: q.name, title: q.name, detail: `${q.steps} messages · ${n(q.people)} people in it`, side: `${q.sentToday} sent today` }))} />}
        />
      )
    }
    case "broadcasts": {
      const d = data as PeekMap["broadcasts"] | undefined
      if (!d || d.scheduled === 0) return <Empty>Send one message to many people at once.</Empty>
      const stat = <Stat value={d.scheduled} label={d.next ? `scheduled · next ${d.next}` : "scheduled"} big={large} />
      if (!large || !d.list?.length) return stat
      return (
        <Listed
          stat={stat}
          items={<Items items={d.list.slice(0, 3).map((b) => ({ key: b.name, title: b.name, detail: `${b.channel} · to ${n(b.audience)} people`, side: b.when }))} />}
        />
      )
    }
    case "helpdesk": {
      const d = data as PeekMap["helpdesk"] | undefined
      if (!d || d.open === 0)
        return (
          <p className="flex items-center gap-2 type-body-sm text-status-success-text">
            <Check aria-hidden className="size-4" /> No open tickets
          </p>
        )
      const stat = <Stat value={d.open} label={`open · oldest ${d.oldestHours}h`} big={large} />
      if (!large || !d.tickets?.length) return stat
      return (
        <Listed
          stat={stat}
          items={<Items items={d.tickets.slice(0, 3).map((t) => ({ key: t.from + t.when, title: t.from, detail: t.subject, side: `${t.when} ago` }))} />}
        />
      )
    }
  }
}
