"use client"

import { useState, type ReactNode } from "react"
import { Check } from "lucide-react"
import { Button, copyText } from "@/components/ui"
import { cn } from "@/lib/cn"
import { countAssumptions } from "@/lib/generation/brief"
import { DENTIST } from "@/lib/playbooks/dentist"
import { moduleById } from "@/lib/playbooks/engine"
import { useEditorNav } from "./editor-nav"
import { useEditorSite } from "./editor-site"
import { useGen } from "./gen-provider"

/** tools a site without a playbook can ask the agent for */
const GENERIC_TOOLS = ["Enquiries", "Catalog", "Appointments", "Payments", "Estimates", "Contacts"]

interface Step {
  id: string
  title: string
  detail?: ReactNode
  done: boolean
  action?: { label: string; onClick: () => void }
}

/**
 * "What to do next" after the first build (Figma 143:3369): the steps a non-technical owner still has to take
 * before customers can find and use the site. Each step has one button that takes them where it's done, and
 * ticks itself off when the editor sees it's done.
 */
export function NextSteps({ compact }: { compact?: boolean }) {
  const { s, dispatch } = useGen()
  const { usage, modules } = useEditorSite()
  const nav = useEditorNav()
  const [shared, setShared] = useState(false)
  const live = s.publish.status === "live"
  const guesses = countAssumptions(s.brief)
  const locked = Object.values(s.pages).filter((p) => p === "locked").length
  const pb = s.pb
  const url = `https://${usage.domain?.name ?? s.publish.domain}`

  // tools that run in test mode until the owner connects their own account
  const accounts = (modules?.list ?? []).filter((m) => moduleById(m.id).needsAccount).map((m) => ({ m: moduleById(m.id), live: m.status === "live" }))
  const addedIds = new Set((modules?.list ?? []).map((m) => m.id))
  const moreTools = pb ? DENTIST.modules.filter((m) => !m.core && !addedIds.has(m.id)).map((m) => m.name) : GENERIC_TOOLS

  const steps: Step[] = [
    { id: "created", title: "Website created", done: true },
    {
      id: "details",
      title: "Check your details",
      detail: guesses ? `${guesses} details are still my guesses — like your phone number and opening hours.` : "Every detail is confirmed.",
      done: guesses === 0,
      action: { label: "Review", onClick: () => dispatch({ type: "openReview", step: 0 }) },
    },
    ...accounts.map<Step>(({ m, live }) => ({
      id: `connect-${m.id}`,
      title: m.needsAccount!.connect,
      detail: `${m.name} is in test mode — ${m.needsAccount!.label} isn't connected yet.`,
      done: live,
      action: { label: "Connect", onClick: () => modules!.activate(m.id) },
    })),
    {
      id: "publish",
      title: "Publish website",
      detail: live ? `Live at ${url.replace("https://", "")}` : "Until you publish, only you can see it.",
      done: live,
      action: live ? undefined : { label: "Publish", onClick: nav.publish },
    },
    {
      id: "domain",
      title: "Add a proper domain",
      detail: usage.customDomain ? `${usage.domain?.name} is connected.` : "A name like yourclinic.com is easier to remember and trust.",
      done: usage.customDomain,
      action: usage.customDomain ? undefined : { label: "Connect", onClick: () => nav.goTo("domain") },
    },
    {
      id: "tools",
      title: "Add functional modules",
      detail: (
        <span className="flex flex-wrap gap-1">
          {moreTools.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full border border-line-default bg-surface px-3 py-1 type-label-sm text-fg-primary shadow-[0_2px_0_0_var(--color-line-default)]">
              {t}
            </span>
          ))}
          {moreTools.length > 4 && <span className="px-1 py-1 type-label-sm text-fg-tertiary">+{moreTools.length - 4} more</span>}
        </span>
      ),
      done: false,
      action: modules ? { label: "Add", onClick: () => nav.goTo("modules") } : { label: "Add", onClick: () => dispatch({ type: "followUp", text: "Which tools should I add to my website?" }) },
    },
    locked
      ? {
          id: "pages",
          title: `Build ${locked} more planned ${locked === 1 ? "page" : "pages"}`,
          detail: "They're in your page plan and get built when you upgrade.",
          done: false,
          action: { label: "Upgrade", onClick: () => nav.goTo("plan") },
        }
      : {
          id: "pages",
          title: "Create additional pages",
          detail: "Add a page to your plan and I'll build it.",
          done: false,
          action: { label: "Create", onClick: () => dispatch({ type: "openReview", step: 2 }) },
        },
    {
      id: "share",
      title: pb ? "Share it with your patients" : "Share it with your customers",
      detail: live ? "Put the link on Google, WhatsApp and Instagram." : "You can share the link once it's published.",
      done: shared,
      action: live ? { label: shared ? "Copied" : "Copy link", onClick: () => copyText(url).then(() => setShared(true)) } : undefined,
    },
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
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={cn("type-body-md", step.done ? "text-fg-disabled line-through" : "text-fg-primary")}>
                  {step.title}
                  <span className="sr-only">{step.done ? " (done)" : ""}</span>
                </span>
                {step.detail && !step.done && <span className="type-body-sm text-fg-secondary">{step.detail}</span>}
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
