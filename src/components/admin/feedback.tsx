"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Download, MessageSquareHeart, Search } from "lucide-react"
import { Badge, Button, Input, SegmentedControl, Select, Switch } from "@/components/ui"
import { AreaChart, BarList, StatTile } from "@/components/account/charts"
import { PanelEmpty, PanelHeader, PanelPage, PanelSection } from "@/components/account/panel"
import { cn } from "@/lib/cn"
import { AI_DAILY, RATING, minutesLabel, type Feedback, type Rating, type ResearchStatus } from "@/lib/admin/data"
import { adminActions, minutesSince, showToast, useAdmin } from "@/lib/admin/store"
import { FilterBar } from "./common"

const RESEARCH: Record<ResearchStatus, string> = { new: "Not contacted", invited: "Invited", scheduled: "Call scheduled", done: "Done", declined: "Declined" }
const ageMin = (f: Feedback) => (f.at ? minutesSince({ at: f.at }) : f.hoursAgo * 60)

/**
 * What people said right after their first build (Good / Fine / Bad + why), and who agreed to be contacted
 * for research. Answers from the builder's feedback card show up here straight away.
 */
export function FeedbackPage() {
  const { feedback } = useAdmin()
  const params = useSearchParams()
  const initial = params.get("rating") as Rating | null
  const [rating, setRating] = useState<"all" | Rating>(initial ?? "all")
  const [researchOnly, setResearchOnly] = useState(false)
  const [q, setQ] = useState("")

  const last30 = feedback.filter((f) => ageMin(f) < 30 * 1440)
  const prev30 = feedback.filter((f) => ageMin(f) >= 30 * 1440 && ageMin(f) < 60 * 1440)
  const share = (xs: Feedback[], r: Rating) => xs.filter((f) => f.rating === r).length / Math.max(1, xs.length)
  // first builds ≈ page-build generations ÷ pages per site
  const builds30 = Math.round((AI_DAILY.slice(-30).reduce((n, d) => n + d.generations, 0) * 0.44) / 5)
  const optedIn = feedback.filter((f) => f.research)
  const waiting = optedIn.filter((f) => f.researchStatus === "new")

  // share of "Good" over the 4 weeks before each of the last 12 weeks (smooths out quiet weeks)
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const from = (11 - i) * 7 * 1440
    const win = feedback.filter((f) => ageMin(f) >= from && ageMin(f) < from + 28 * 1440)
    return { label: i === 11 ? "Now" : `${11 - i} wk ago`, value: win.length ? Math.round(share(win, "good") * 100) : 0 }
  })

  const reasons = (r: Rating) => {
    const counts = new Map<string, number>()
    feedback.filter((f) => f.rating === r).forEach((f) => f.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
    return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }

  const term = q.trim().toLowerCase()
  const rows = feedback
    .filter((f) => (rating === "all" || f.rating === rating) && (!researchOnly || f.research) && (!term || [f.name, f.email ?? "", f.siteName, f.comment, ...f.tags].some((x) => x.toLowerCase().includes(term))))
    .sort((a, b) => ageMin(a) - ageMin(b))

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = ["Name,Email,Website,Rating,Status", ...optedIn.map((f) => [f.name, f.email ?? "", f.siteName, RATING[f.rating].label, RESEARCH[f.researchStatus]].map(esc).join(","))].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "gogetspace-research-participants.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PanelPage>
      <PanelHeader
        title="Feedback"
        description="Asked once, right after someone's first website is built: how it turned out, why, and whether we can contact them for research."
        actions={
          <Button variant="secondary" leadingIcon={<Download />} onClick={exportCsv}>
            Export research list
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile label="Answers · 30 days" value={String(last30.length)} delta={prev30.length ? last30.length / prev30.length - 1 : null} />
        <StatTile label="Rated Good · 30 days" value={`${Math.round(share(last30, "good") * 100)}%`} />
        <StatTile label="Answered after first build" value={`${Math.min(100, Math.round((last30.length / Math.max(1, builds30)) * 100))}%`} />
        <StatTile label="Open to research" value={String(optedIn.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSection title="How the first build turned out">
          <RatingSplit items={feedback} />
          <p className="type-caption text-fg-tertiary">All {feedback.length} answers. People who haven&apos;t signed up yet are included — most first builds happen before sign-up.</p>
        </PanelSection>
        <PanelSection title="Rated Good · % over the previous 4 weeks" className="xl:col-span-2">
          <AreaChart points={weeks} label="Share rated Good, 4-week window" unit="% Good" height={200} />
        </PanelSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSection title="When it was Bad, why">
          <BarList rows={reasons("bad")} />
        </PanelSection>
        <PanelSection title="When it was Fine, what would help">
          <BarList rows={reasons("fine")} />
        </PanelSection>
        <PanelSection title="When it was Good, what they liked">
          <BarList rows={reasons("good")} />
        </PanelSection>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="type-h6 text-fg-primary">Answers</h2>
        <FilterBar>
          <div className="md:w-[300px]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, website or comment" aria-label="Search feedback" leadingIcon={<Search />} className="h-11" />
          </div>
          <SegmentedControl
            label="Rating"
            size="sm"
            value={rating}
            onChange={setRating}
            options={[
              { value: "all", label: "All" },
              { value: "good", label: "Good" },
              { value: "fine", label: "Fine" },
              { value: "bad", label: "Bad" },
            ]}
          />
          <Switch label={`Open to research${waiting.length ? ` · ${waiting.length} not contacted` : ""}`} checked={researchOnly} onCheckedChange={setResearchOnly} className="md:ml-auto" />
        </FilterBar>

        {rows.length === 0 ? (
          <PanelEmpty icon={<MessageSquareHeart />} title="No answers match" text="Try another rating, or turn off “Open to research”." />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((f) => (
              <FeedbackRow key={f.id} f={f} />
            ))}
          </ul>
        )}
      </section>
    </PanelPage>
  )
}

/** One bar split into Good / Fine / Bad, with counts underneath. */
function RatingSplit({ items }: { items: Feedback[] }) {
  const total = Math.max(1, items.length)
  const parts = (["good", "fine", "bad"] as Rating[]).map((r) => ({ r, n: items.filter((f) => f.rating === r).length }))
  const fill = { good: "bg-status-success-solid", fine: "bg-status-warning-solid", bad: "bg-status-error-solid" }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${RATING[p.r].label} ${p.n}`).join(", ")}>
        {parts.map((p) => p.n > 0 && <div key={p.r} className={cn("h-full", fill[p.r])} style={{ width: `${(p.n / total) * 100}%` }} />)}
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.r} className="flex flex-col">
            <dt className="flex items-center gap-1.5 type-caption text-fg-tertiary">
              <span aria-hidden className={cn("size-2 rounded-full", fill[p.r])} /> {RATING[p.r].label}
            </dt>
            <dd className="type-h5 text-fg-primary tabular-nums">{Math.round((p.n / total) * 100)}%</dd>
            <dd className="type-caption text-fg-tertiary tabular-nums">{p.n} answers</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function FeedbackRow({ f }: { f: Feedback }) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line-default p-4 sm:p-5 md:flex-row md:items-start md:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={RATING[f.rating].tone}>{RATING[f.rating].label}</Badge>
          <span className="min-w-0 truncate type-label-md text-fg-primary">{f.siteName}</span>
          <span className="type-caption text-fg-tertiary">· {minutesLabel(ageMin(f))}</span>
          {f.at && (
            <Badge tone="brand" dot={false}>
              New
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {f.tags.map((t) => (
            <Badge key={t} dot={false}>
              {t}
            </Badge>
          ))}
        </div>
        {f.comment && <p className="type-body-md text-fg-primary">“{f.comment}”</p>}
        <p className="type-caption text-fg-tertiary">
          {f.clientId ? (
            <Link href={`/admin/clients/${f.clientId}`} className="text-fg-link hover:underline">
              {f.name}
            </Link>
          ) : (
            f.name
          )}
          {f.email && ` · ${f.email}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 md:w-[220px]">
        {f.research ? (
          <>
            <span className="type-caption text-fg-tertiary">Open to research</span>
            <Select
              value={f.researchStatus}
              onValueChange={(v) => {
                adminActions.setResearchStatus(f.id, v as ResearchStatus)
                showToast(v === "invited" ? `Research invite sent to ${f.email ?? f.name}` : `Marked as ${RESEARCH[v as ResearchStatus].toLowerCase()}`)
              }}
              options={(Object.keys(RESEARCH) as ResearchStatus[]).map((k) => ({ value: k, label: RESEARCH[k] }))}
              className="h-10"
            />
          </>
        ) : (
          <span className="type-caption text-fg-tertiary">Didn&apos;t want to be contacted</span>
        )}
      </div>
    </li>
  )
}
