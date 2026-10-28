"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { FlaskConical, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/cn"
import { SCENARIOS, type JumpTarget, type Scenario } from "@/lib/generation/state"
import { useGen } from "./gen-provider"

const JUMPS: { to: JumpTarget; label: string }[] = [
  { to: "generating", label: "Generating" },
  { to: "ready", label: "Ready to review" },
  { to: "review-brief", label: "Review: brief" },
  { to: "review-style", label: "Review: style" },
  { to: "review-sitemap", label: "Review: sitemap" },
  { to: "creating", label: "Creating" },
  { to: "built", label: "Built" },
  { to: "published", label: "Published" },
]

/** Prototype-only panel: replay the flow with an edge case, jump to any stage, change the pace. */
export function ScenarioPanel() {
  const { s, dispatch } = useGen()
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<Scenario>(s.scenario)

  return (
    <div className={cn(
        "fixed z-[45] flex flex-col items-start gap-2",
        s.phase === "create" ? "bottom-[104px] left-3 max-lg:top-auto max-lg:right-3 max-lg:bottom-[156px] max-lg:left-auto max-lg:items-end" : "bottom-4 left-4 max-lg:top-[18px] max-lg:bottom-auto max-lg:left-[64px]",
      )}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={cn("flex max-h-[min(640px,calc(100svh-120px))] w-[320px] flex-col gap-4 overflow-y-auto rounded-xl border border-line-default bg-surface-raised p-4 shadow-soft-lg", s.phase === "plan" && "max-lg:order-last")}
            role="dialog"
            aria-label="Prototype controls"
          >
            <div className="flex items-center justify-between">
              <p className="type-label-md text-fg-primary">Prototype controls</p>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="grid size-7 place-items-center rounded-sm hover:bg-subtle"><X className="size-4" /></button>
            </div>

            <section className="flex flex-col gap-2">
              <p className="type-label-sm text-fg-tertiary">EDGE CASE</p>
              <div role="radiogroup" className="flex flex-col gap-1">
                {SCENARIOS.map((sc) => (
                  <label key={sc.id} className={cn("flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5", pick === sc.id ? "bg-accent-blue-subtle" : "hover:bg-subtle")}>
                    <input type="radio" name="scenario" checked={pick === sc.id} onChange={() => setPick(sc.id)} className="mt-1 accent-blue-500" />
                    <span className="flex flex-col">
                      <span className="type-label-md text-fg-primary">{sc.label}{s.scenario === sc.id && <span className="ml-1.5 type-caption text-fg-tertiary">(current)</span>}</span>
                      <span className="type-caption text-fg-tertiary">{sc.note}</span>
                    </span>
                  </label>
                ))}
              </div>
              <Button size="sm" leadingIcon={<RotateCcw />} onClick={() => { dispatch({ type: "reset", scenario: pick }); setOpen(false) }}>
                Replay from the start
              </Button>
            </section>

            <section className="flex flex-col gap-2">
              <p className="type-label-sm text-fg-tertiary">JUMP TO</p>
              <div className="flex flex-wrap gap-1.5">
                {JUMPS.map((j) => (
                  <button key={j.to} type="button" onClick={() => { dispatch({ type: "jump", to: j.to, scenario: pick }); setOpen(false) }} className="rounded-full border border-line-default px-2.5 py-1 type-body-sm text-fg-primary hover:border-blue-500 hover:text-fg-link">
                    {j.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <p className="type-label-sm text-fg-tertiary">SPEED</p>
              <div className="flex gap-1 rounded-full bg-subtle p-1" role="radiogroup">
                {[1, 2, 4].map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={s.speed === v} onClick={() => dispatch({ type: "speed", speed: v })} className={cn("flex-1 rounded-full py-1 type-label-md", s.speed === v ? "bg-surface text-fg-primary shadow-block-sm" : "text-fg-secondary")}>
                    {v}×
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-line-default bg-surface-raised px-3 py-2 type-label-sm text-fg-secondary shadow-soft-sm hover:text-fg-primary"
      >
        <FlaskConical className="size-4" /> <span className={cn(s.phase === "create" && "max-lg:sr-only")}>Prototype</span>
        {s.scenario !== "happy" && <span className="rounded-full bg-accent-yellow-subtle px-1.5 text-fg-primary">{SCENARIOS.find((x) => x.id === s.scenario)?.label}</span>}
      </button>
    </div>
  )
}
