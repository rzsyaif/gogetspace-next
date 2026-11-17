"use client"

import { useEffect, useState } from "react"
import { Check, Loader } from "lucide-react"
import { cn } from "@/lib/cn"
import type { Msg } from "@/lib/generation/state"
import { moduleById } from "@/lib/playbooks/engine"
import { useGen } from "@/components/generate/gen-provider"

const STEP_MS = 1400

/**
 * The agent adding a module to the built site (sent from the Modules page): a short checklist that ticks through,
 * then what changed. Progress is paced from when it was sent, so a reload shows it finished.
 */
export function ImplementCard({ m }: { m: Extract<Msg, { type: "pb-implement" }> }) {
  const { s } = useGen()
  const mod = moduleById(m.module)
  const live = !mod.needsAccount || s.pb?.activated.includes(mod.id)
  const where = m.pages.length ? `a new ${m.pages.map((p) => p.title).join(" and ")} ${m.pages.length === 1 ? "page" : "pages"}` : "your Home, Contact and treatment pages"
  const steps = [
    "Reading your site and plan",
    `Adding ${mod.name} to ${where}`,
    mod.needsAccount ? `Connecting it to ${mod.needsAccount.label}` : "Wiring it into your enquiry inbox and notifications",
    "Checking links and the mobile layout",
  ]
  const [now, setNow] = useState(() => m.at)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, 300)
    return () => (window.clearTimeout(first), window.clearInterval(id))
  }, [])
  const doneCount = Math.min(steps.length, Math.floor((now - m.at) / STEP_MS))
  const finished = doneCount >= steps.length

  return (
    <div className="flex flex-col gap-4">
      <p className="type-body-md text-fg-primary">On it — I&apos;ll add {mod.name} and leave everything else as it is.</p>
      <ol className="flex flex-col gap-2" aria-live="polite">
        {steps.map((t, i) => {
          const state = i < doneCount ? "done" : i === doneCount ? "running" : "pending"
          return (
            <li key={t} className="flex items-center gap-3">
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", state === "done" ? "bg-accent-blue-subtle text-fg-brand" : state === "running" ? "text-fg-brand" : "border border-line-strong")}>
                {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : state === "running" ? <Loader className="size-4 animate-spin" /> : null}
              </span>
              <span className={cn("type-body-md", state === "done" ? "text-fg-disabled" : state === "running" ? "text-fg-primary" : "text-fg-tertiary")}>{t}</span>
            </li>
          )
        })}
      </ol>
      {finished && (
        <p className="type-body-md text-fg-primary">
          Done — {mod.name} is on your site{m.pages.length ? ` with ${where}` : ""}. Have a look in the preview.
          {!live && ` It runs in test mode until you connect ${mod.needsAccount!.label} in Modules.`}
        </p>
      )}
    </div>
  )
}
