"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/cn"
import { moduleById } from "@/lib/playbooks/engine"
import { useEditorNav } from "./editor-nav"
import { useEditorSite } from "./editor-site"
import { useGen } from "./gen-provider"


interface Step {
  id: string
  title: string
  /** one short line, only where the title alone isn't enough */
  detail?: string
  done: boolean
  action?: { label: string; onClick: () => void }
}

/**
 * "What to do next" after the first build (Figma 143:3369): the steps a non-technical owner still has to take
 * before customers can find and use the site. Each step has one button that takes them where it's done, and
 * ticks itself off when the editor sees it's done. At most five steps, one line each.
 */
export function NextSteps({ compact }: { compact?: boolean }) {
  const { s, dispatch } = useGen()
  const { usage, modules } = useEditorSite()
  const nav = useEditorNav()
  const live = s.publish.status === "live"
  const locked = Object.values(s.pages).filter((p) => p === "locked").length
  const pb = s.pb

  // tools that run in test mode until the owner connects their own account
  const accounts = (modules?.list ?? []).map((m) => ({ m: moduleById(m.id), live: m.status === "live" })).filter((x) => x.m.needsAccount)
  const toolsHint = pb ? "Bookings, reviews, payments and more" : "Enquiries, bookings, payments and more"

  // test-mode tools come right after the build: until they're connected, bookings and payments don't reach the owner
  const accountsStep: Step | null = accounts.length
    ? {
        id: "accounts",
        title: accounts.length === 1 ? accounts[0].m.needsAccount!.connect : "Connect your accounts",
        done: accounts.every((x) => x.live),
        action: { label: "Connect", onClick: () => accounts.filter((x) => !x.live).forEach((x) => modules!.activate(x.m.id)) },
      }
    : null
  const pagesStep: Step = locked
    ? { id: "pages", title: `Build ${locked} more planned ${locked === 1 ? "page" : "pages"}`, done: false, action: { label: "Upgrade", onClick: () => nav.goTo("plan") } }
    : { id: "pages", title: "Create additional pages", done: false, action: { label: "Create", onClick: () => dispatch({ type: "openReview", step: 2 }) } }

  // at most five steps, one line each
  const steps: Step[] = [
    { id: "created", title: "Website created", done: true },
    ...(accountsStep ? [accountsStep] : []),
    {
      id: "publish",
      title: "Publish website",
      done: live,
      action: live ? undefined : { label: "Publish", onClick: nav.publish },
    },
    {
      id: "domain",
      title: "Add a proper domain",
      done: usage.customDomain,
      action: usage.customDomain ? undefined : { label: "Connect", onClick: () => nav.goTo("domain") },
    },
    {
      id: "tools",
      title: "Add functional modules",
      detail: toolsHint,
      done: false,
      action: modules ? { label: "Add", onClick: () => nav.goTo("modules") } : { label: "Add", onClick: () => dispatch({ type: "followUp", text: "Which tools should I add to my website?" }) },
    },
    ...(accountsStep ? [] : [pagesStep]),
  ]
  const done = steps.filter((x) => x.done).length

  return (
    <section aria-label="What to do next" className={cn("flex flex-col gap-3", !compact && "sm:mr-20")}>
      <p className="flex items-baseline justify-between gap-3 type-body-md text-fg-primary">
        Here are the things that you need to do next:
        <span className="shrink-0 type-label-sm text-fg-tertiary tabular-nums">
          {done} of {steps.length} done
        </span>
      </p>
      <ol className="flex flex-col overflow-hidden rounded-[16px] border border-line-default">
        {steps.map((step) => (
          <li key={step.id} className={cn("flex items-center gap-3 border-b border-line-default py-3 pr-3 pl-4 last:border-b-0", step.done ? "bg-subtle" : "bg-surface")}>
            <span className={cn("flex min-w-0 flex-1 gap-3", step.detail ? "items-start" : "items-center")}>
              <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-full", step.done ? "bg-status-success-bg text-status-success-text" : "border border-line-strong")}>
                {step.done && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("type-body-md", step.done ? "text-fg-disabled line-through" : "text-fg-primary")}>
                  {step.title}
                  <span className="sr-only">{step.done ? " (done)" : ""}</span>
                </span>
                {step.detail && !step.done && <span className="type-body-sm text-fg-tertiary">{step.detail}</span>}
              </span>
            </span>
            {step.action && !step.done && (
              <Button size="sm" variant="secondary" className="shrink-0" onClick={step.action.onClick}>
                {step.action.label}
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
