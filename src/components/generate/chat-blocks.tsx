"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  FileText,
  FolderTree,
  Globe,
  Loader,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  SwatchBook,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/cn"
import { flatten } from "@/lib/bakti/sitemap"
import { BUSINESS_MATCHES, SEARCH_QUERY, SEARCH_RESULTS, type ArtifactKey, type Msg, type Run, type Task } from "@/lib/generation/state"
import { useGen } from "./gen-provider"

export const ARTIFACTS: { key: ArtifactKey; title: string; Icon: typeof FileText }[] = [
  { key: "brief", title: "Project Brief", Icon: FileText },
  { key: "style", title: "Design & Style", Icon: SwatchBook },
  { key: "sitemap", title: "Sitemap Plan", Icon: FolderTree },
]

export function Messages({ compact }: { compact?: boolean }) {
  const { s } = useGen()
  return (
    <div className={cn("flex flex-col", compact ? "gap-6" : "gap-9")}>
      {s.msgs.map((m) => (
        <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Block m={m} compact={compact} />
        </motion.div>
      ))}
    </div>
  )
}

function Block({ m, compact }: { m: Msg; compact?: boolean }) {
  const { s } = useGen()
  switch (m.type) {
    case "user":
      return (
        <div className={cn("flex justify-end", compact ? "pl-12" : "pl-20")}>
          <p className="rounded-lg border border-line-default bg-surface px-5 py-4 type-body-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)]">{m.text}</p>
        </div>
      )
    case "agent":
      return <p className={cn("type-body-md text-fg-primary", !compact && "pr-20")}>{m.text}</p>
    case "plan":
      return <PlanBlock run={s.runs[m.runId]} compact={compact} />
    case "artifacts":
      return compact ? <ArtifactList /> : <ArtifactGrid />
    case "clarify":
      return <Clarify answered={m.answer} />
    case "pick":
      return <PickBusiness picked={m.picked} />
    case "refused":
      return <Refused />
    case "build":
      return <BuildBlock run={s.runs[m.runId]} />
    case "credits-out":
      return <CreditsOut resolved={m.resolved} />
  }
}

/* ---------------- task list ---------------- */

function TaskIcon({ status }: { status: Task["status"] }) {
  if (status === "done")
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-blue-subtle text-blue-600">
        <Check className="size-3.5" strokeWidth={2.5} />
      </span>
    )
  if (status === "running")
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-dashed border-blue-500 bg-canvas text-blue-500">
        <Loader className="size-3.5 animate-[spin_2.4s_linear_infinite]" />
      </span>
    )
  if (status === "failed")
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-status-error-bg text-status-error-text">
        <X className="size-3.5" strokeWidth={2.5} />
      </span>
    )
  if (status === "warning")
    return (
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-status-warning-bg text-status-warning-text">
        <AlertTriangle className="size-3.5" />
      </span>
    )
  return <span className="size-6 shrink-0 rounded-full border border-line-strong" />
}

function TaskList({ run, children }: { run: Run; children?: (t: Task) => React.ReactNode }) {
  return (
    <ol className="flex flex-col">
      {run.tasks.map((t, i) => (
        <li key={t.id} className="flex flex-col">
          {i > 0 && <span aria-hidden className={cn("ml-[11.5px] h-3 w-px", t.status === "pending" ? "bg-line-default" : "bg-blue-300")} />}
          <div className="flex gap-3" aria-current={t.status === "running" ? "step" : undefined}>
            <TaskIcon status={t.status} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={cn(
                    "type-body-md",
                    t.status === "running" ? "shimmer-text" : t.status === "pending" ? "text-fg-disabled" : t.status === "failed" ? "text-status-error-text" : "text-fg-tertiary",
                  )}
                >
                  {t.label}
                </span>
                {t.duration && <span className="type-body-sm text-fg-secondary tabular-nums">{t.duration}</span>}
              </p>
              {t.note && <p className="type-body-sm text-status-warning-text">{t.note}</p>}
              {t.detail && <p className={cn("type-body-sm", t.status === "failed" ? "text-status-error-text" : "text-fg-tertiary")}>{t.detail}</p>}
              {children?.(t)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function PlanBlock({ run, compact }: { run: Run; compact?: boolean }) {
  const { s, dispatch } = useGen()
  const [open, setOpen] = useState(!compact)
  const done = run.tasks.filter((t) => t.status === "done" || t.status === "warning").length
  const finished = run.status === "done"
  const isCurrent = run.id === s.planRun

  if (run.status === "restarted")
    return (
      <p className="flex items-center gap-2 type-body-sm text-fg-tertiary">
        <RotateCcw className="size-4" /> Plan restarted after {done} of {run.tasks.length} tasks
      </p>
    )

  return (
    <div className={cn("flex flex-col gap-6", !compact && "pr-20")}>
      {finished ? (
        <div className="flex flex-col gap-4 type-body-md text-fg-primary">
          <p>Hi! Let&apos;s build the website for Bakti Analisa. I&apos;ve drafted three things for you to review before I start: a brief, some style options, and a page plan.</p>
          <p>Open each one and change anything that doesn&apos;t fit — nothing gets built until you confirm.</p>
        </div>
      ) : (
        <p className="type-body-md text-fg-primary">Before I build anything, I&apos;ll plan it out with you first.</p>
      )}
      <div className="flex flex-col gap-4">
        {finished ? (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1 self-start type-label-sm text-fg-secondary">
            {run.tasks.length} tasks done <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        ) : (
          <p className="type-label-sm text-fg-secondary" aria-live="polite">
            {done}/{run.tasks.length} tasks
          </p>
        )}
        {(!finished || open) && (
          <TaskList run={run}>{(t) => (t.id === "search" && t.status !== "pending" ? <SearchResults task={t} /> : null)}</TaskList>
        )}
        {isCurrent && run.status === "stopped" && (
          <div className="flex items-center gap-3 rounded-md border border-line-default bg-surface p-3">
            <p className="flex-1 type-body-sm text-fg-secondary">Stopped. Nothing is lost — pick up where I left off, or send a message to change the plan.</p>
            <Button size="sm" variant="secondary" leadingIcon={<Play />} onClick={() => dispatch({ type: "resume" })}>Resume</Button>
          </div>
        )}
        {isCurrent && run.status === "failed" && (
          <div className="flex items-center gap-3 rounded-md border border-status-error-border bg-status-error-bg p-3">
            <p className="flex-1 type-body-sm text-status-error-text">I couldn&apos;t finish this step. Your earlier steps are saved.</p>
            <Button size="sm" variant="secondary" leadingIcon={<RotateCcw />} onClick={() => dispatch({ type: "retryStep" })}>Retry</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function SearchResults({ task }: { task: Task }) {
  const { s } = useGen()
  const [open, setOpen] = useState(true)
  if (s.scenario === "search-fail" || s.scenario === "no-results") return <p className="type-body-sm text-fg-secondary">{SEARCH_QUERY}</p>
  const shown = Math.min(s.searchShown, SEARCH_RESULTS.length)
  return (
    <div className="mt-1 flex flex-col gap-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1 self-start type-body-sm text-fg-primary">
        {SEARCH_QUERY}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && shown > 0 && (
        <ul className="flex flex-col gap-2 rounded-sm bg-subtle p-2">
          <AnimatePresence initial={false}>
            {SEARCH_RESULTS.slice(0, shown).map((r) => (
              <motion.li key={r.site} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-[4px] bg-muted text-fg-tertiary"><Globe className="size-3" /></span>
                <span className="min-w-0 flex-1 truncate type-body-sm text-fg-primary">{r.title}</span>
                <a href={`https://${r.site}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1 type-body-sm whitespace-nowrap text-blue-600 hover:underline sm:flex">
                  {r.site} <ArrowUpRight className="size-4" />
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {task.status === "running" && shown === 0 && <p className="type-body-sm text-fg-tertiary">Looking…</p>}
    </div>
  )
}

/* ---------------- artifacts ---------------- */

export function statusLabel(st: "awaiting" | "confirmed" | "stale") {
  return st === "confirmed" ? "Confirmed" : st === "stale" ? "Needs refresh" : "Awaiting confirmation"
}

function ArtifactGrid() {
  const { s, dispatch } = useGen()
  const confirmed = ARTIFACTS.filter((a) => s.artifacts[a.key] === "confirmed").length
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-3 sm:flex">
        {ARTIFACTS.map(({ key, title, Icon }, i) => {
          const st = s.artifacts[key]
          return (
            <li key={key} className="flex flex-col justify-between gap-6 rounded-lg border border-line-default bg-subtle p-3 sm:size-[200px]">
              <span
                className={cn(
                  "truncate rounded-[6px] px-1 py-0.5 text-center type-label-sm",
                  st === "confirmed" ? "bg-status-success-bg text-status-success-text" : st === "stale" ? "bg-status-warning-bg text-status-warning-text" : "bg-muted text-fg-tertiary",
                )}
              >
                {statusLabel(st)}
              </span>
              <div className="flex flex-col gap-3">
                <Icon className="size-8 text-fg-secondary" strokeWidth={1.5} />
                <p className="type-h6 text-fg-secondary">{title}</p>
                <Button size="sm" variant="secondary" className="w-full" onClick={() => dispatch({ type: "openReview", step: i })}>
                  {st === "confirmed" ? "View" : "Review"}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="type-body-sm text-fg-tertiary">{confirmed} of 3 confirmed</p>
      {confirmed === 3 && s.phase === "plan" && (
        <Button size="lg" className="self-start" leadingIcon={<Zap />} onClick={() => dispatch({ type: "openReview", step: 2 })}>
          Review & start creation
        </Button>
      )}
    </div>
  )
}

function ArtifactList() {
  const { s, dispatch } = useGen()
  return (
    <ul className="flex flex-col gap-3">
      {ARTIFACTS.map(({ key, title, Icon }, i) => {
        const st = s.artifacts[key]
        return (
          <li key={key} className="flex items-center gap-3 rounded-lg border border-line-default bg-subtle p-3">
            <Icon className="size-7 shrink-0 text-fg-secondary" strokeWidth={1.5} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate type-body-md text-fg-secondary">{title}</span>
              <span className={cn("type-caption", st === "confirmed" ? "text-status-success-text" : st === "stale" ? "text-status-warning-text" : "text-fg-tertiary")}>{statusLabel(st)}</span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "openReview", step: i })}>
              {st === "confirmed" ? "View" : "Review"}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

/* ---------------- edge cases in the plan ---------------- */

const CLARIFY_CHIPS = [
  "A clinical laboratory in Penang called Bakti Analisa",
  "A family dental clinic in Penang",
  "A small law firm in Jakarta",
]

function Clarify({ answered }: { answered?: string }) {
  const { dispatch } = useGen()
  return (
    <div className="flex flex-col gap-4 pr-4 sm:pr-20">
      <p className="type-body-md text-fg-primary">Happy to help! Before I plan, tell me a little more — what&apos;s the business, and where is it?</p>
      {!answered && (
        <div className="flex flex-wrap gap-2">
          {CLARIFY_CHIPS.map((c) => (
            <button key={c} type="button" onClick={() => dispatch({ type: "answerClarify", answer: c })} className="rounded-full border border-line-strong bg-surface px-4 py-2 type-body-sm text-fg-primary hover:border-blue-500 hover:text-fg-link">
              {c}
            </button>
          ))}
        </div>
      )}
      {!answered && <p className="type-body-sm text-fg-tertiary">Or type it below in your own words.</p>}
    </div>
  )
}

function PickBusiness({ picked }: { picked?: string }) {
  const { dispatch } = useGen()
  return (
    <div className="flex flex-col gap-4 pr-4 sm:pr-20">
      <p className="type-body-md text-fg-primary">I found a few businesses with a similar name. Which one is yours?</p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {BUSINESS_MATCHES.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              disabled={!!picked}
              onClick={() => dispatch({ type: "pickBusiness", id: b.id })}
              className={cn(
                "flex h-full w-full flex-col items-start gap-1 rounded-md border bg-surface p-3 text-left disabled:cursor-default",
                picked === b.id ? "border-blue-500 ring-4 ring-blue-100" : "border-line-default enabled:hover:border-blue-500",
                picked && picked !== b.id && "opacity-50",
              )}
            >
              <Building2 className="mb-1 size-5 text-fg-tertiary" />
              <span className="type-label-md text-fg-primary">{b.name}</span>
              <span className="type-body-sm text-fg-secondary">{b.place}</span>
              <span className="type-caption text-fg-tertiary">{b.kind}</span>
            </button>
          </li>
        ))}
      </ul>
      {!picked && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => dispatch({ type: "pickBusiness", id: "none" })}>
          None of these — it&apos;s a new business
        </Button>
      )}
    </div>
  )
}

function Refused() {
  return (
    <div className="flex gap-3 rounded-lg border border-status-error-border bg-status-error-bg p-4 sm:mr-20">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-status-error-text" />
      <div className="flex flex-col gap-1">
        <p className="type-label-md text-status-error-text">I can&apos;t build this one</p>
        <p className="type-body-sm text-fg-primary">
          GoGetSpace doesn&apos;t make websites for gambling, vaping or counterfeit goods. If I&apos;ve misunderstood, tell me more about what the business does and I&apos;ll start again.
        </p>
      </div>
    </div>
  )
}

/* ---------------- build ---------------- */

function BuildBlock({ run }: { run: Run }) {
  const { s, dispatch } = useGen()
  const done = run.tasks.filter((t) => t.status === "done" || t.status === "warning").length
  const pages = flatten(s.sitemap)
  return (
    <div className="flex flex-col gap-4">
      <p className="type-label-sm text-fg-secondary" aria-live="polite">
        {run.status === "done" ? `${run.tasks.length} tasks done` : `${done}/${run.tasks.length} tasks`}
        {run.status === "paused" && " · paused"}
      </p>
      <TaskList run={run}>
        {(t) =>
          t.id === "pages" && t.status !== "pending" ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {pages.map((p) => {
                const st = s.pages[p.id]
                return (
                  <li key={p.id} className={cn("flex items-center gap-2 type-body-sm", st === "locked" || st === "skipped" ? "text-fg-disabled" : "text-fg-secondary")} style={{ paddingLeft: p.depth * 12 }}>
                    {st === "built" && <Check className="size-4 text-status-success-text" />}
                    {st === "building" && <Loader className="size-4 animate-spin text-blue-500" />}
                    {st === "queued" && <span className="size-4 rounded-full border border-line-strong" />}
                    {st === "failed" && <X className="size-4 text-status-error-text" />}
                    {(st === "locked" || st === "skipped") && <Lock className="size-4" />}
                    <span className="flex-1 truncate">{p.title}</span>
                    {st === "failed" && (
                      <button type="button" onClick={() => dispatch({ type: "retryPage", id: p.id })} className="type-label-sm text-fg-link hover:underline">
                        Retry
                      </button>
                    )}
                    {st === "locked" && <span className="type-caption">Upgrade</span>}
                    {st === "skipped" && <span className="type-caption">Not built</span>}
                  </li>
                )
              })}
            </ul>
          ) : null
        }
      </TaskList>
    </div>
  )
}

function CreditsOut({ resolved }: { resolved?: "upgrade" | "stop" }) {
  const { s, dispatch } = useGen()
  const built = Object.values(s.pages).filter((p) => p === "built").length
  const left = Object.values(s.pages).filter((p) => p === "queued").length
  if (resolved)
    return <p className="type-body-sm text-fg-tertiary">{resolved === "upgrade" ? "Credits topped up — carrying on with the build." : "Stopped here. The pages already built are ready to preview and publish."}</p>
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-status-warning-border bg-status-warning-bg p-4">
      <p className="type-label-md text-status-warning-text">You&apos;ve run out of credits</p>
      <p className="type-body-sm text-fg-primary">
        I built {built} {built === 1 ? "page" : "pages"}; {left} still to go. Top up to finish them, or stop here and publish what&apos;s built.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => dispatch({ type: "creditsUpgrade" })}>Top up credits</Button>
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "creditsStop" })}>Stop here</Button>
      </div>
    </div>
  )
}
