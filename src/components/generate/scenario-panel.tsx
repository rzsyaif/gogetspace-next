"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { FlaskConical, RotateCcw, X } from "lucide-react"
import { Button, IconButton, SegmentedControl } from "@/components/ui"
import { cn } from "@/lib/cn"
import { DEFAULT_PROMPT, SCENARIOS, type JumpTarget, type Scenario } from "@/lib/generation/state"
import { useGen } from "./gen-provider"

const JUMPS: { to: JumpTarget; label: string }[] = [
  { to: "generating", label: "Generating" },
  { to: "ready", label: "Ready to review" },
  { to: "creating", label: "Creating" },
  { to: "built", label: "Built" },
  { to: "published", label: "Published" },
]

/** the dentist playbook's evals (§11) as ready-made prompts */
const DENTIST_PROMPTS: { id: string; label: string; prompt: string }[] = [
  { id: "demo", label: "Rahma (demo)", prompt: "Website for a family dental clinic in Penang called Rahma Family Dental" },
  { id: "E1", label: "Vague", prompt: "Create a website for a dentist" },
  { id: "E2", label: "Ortho, 2 branches", prompt: "Website for my 2-branch orthodontic clinic. Patients should book consultations online and I want to show price ranges." },
  { id: "E3", label: "Just build it", prompt: "Just build it, I'm a dentist" },
  { id: "E4", label: "“Best”, “painless”", prompt: "Website for Rahma Family Dental in Penang. Say we're the best dentist in town and our treatments are painless" },
  { id: "E6", label: "Children's clinic", prompt: "Website for my children's dental clinic" },
  { id: "E7", label: "24h emergencies", prompt: "Dental clinic website — we take emergency patients 24 hours" },
  { id: "E8", label: "Directory", prompt: "I need a platform to list dentists in my city" },
  { id: "E9", label: "Dentist + lawyer", prompt: "A site for a dentist and a lawyer" },
  { id: "E15", label: "More patients", prompt: "I'm a dentist and I want more patients" },
  { id: "E16", label: "Many goals + shop", prompt: "Dental clinic: I want bookings, payments, an online shop and emergency slots" },
  { id: "E17", label: "Check-ups", prompt: "I'm a dentist. I want patients to come back for check-ups" },
  { id: "lab", label: "Bakti lab", prompt: DEFAULT_PROMPT },
]

/** the lawyer playbook's evals (§11) */
const LAWYER_PROMPTS: { id: string; label: string; prompt: string }[] = [
  { id: "demo", label: "Aziz & Lim (demo)", prompt: "Website for Aziz & Lim Advocates, a family and property law firm in Kuala Lumpur" },
  { id: "E1", label: "Vague", prompt: "Create a website for a lawyer" },
  { id: "E2", label: "Family law, confidential", prompt: "Website for my family law practice in Malaysia. People should book confidential consultations and be able to say if it's safe to leave a message." },
  { id: "E3", label: "Just build it", prompt: "Just build it, I'm a lawyer" },
  { id: "E4", label: "“Best”, “always win”", prompt: "Website for Aziz & Lim Advocates in Kuala Lumpur. Say we're the best lawyer in town and we always win" },
  { id: "E6", label: "Criminal, any time", prompt: "Website for my criminal defense practice in London. We take calls any time." },
  { id: "E7", label: "Directory", prompt: "I need a platform to list lawyers in my city" },
  { id: "E9", label: "Client portal", prompt: "Law firm website in Singapore with a client portal where clients upload documents" },
  { id: "E12", label: "Guaranteed visas", prompt: "Immigration lawyer in Jakarta. Our visa applications are guaranteed to be approved" },
  { id: "E15", label: "More clients", prompt: "I'm a lawyer and I want more clients" },
  { id: "E18", label: "Fees online", prompt: "Solicitor in London — I want to take consultation fees online" },
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
              <IconButton aria-label="Close" size="sm" onClick={() => setOpen(false)}><X /></IconButton>
            </div>

            {(
              [
                ["DENTIST", DENTIST_PROMPTS],
                ["LAWYER", LAWYER_PROMPTS],
              ] as const
            ).map(([name, prompts]) => (
              <section key={name} className="flex flex-col gap-2">
                <p className="type-label-sm text-fg-tertiary">PROMPT · {name} PLAYBOOK EVALS</p>
                <div className="flex flex-wrap gap-1.5">
                  {prompts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      title={d.prompt}
                      aria-pressed={s.prompt === d.prompt}
                      onClick={() => { dispatch({ type: "reset", prompt: d.prompt, scenario: "happy" }); setOpen(false) }}
                      className={cn("rounded-full border px-2.5 py-1 type-body-sm hover:border-blue-500 hover:text-fg-link", s.prompt === d.prompt ? "border-blue-500 bg-accent-blue-subtle text-fg-link" : "border-line-default text-fg-primary")}
                    >
                      {d.id !== "demo" && d.id !== "lab" && <span className="mr-1 text-fg-tertiary">{d.id}</span>}
                      {d.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}

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
              <SegmentedControl label="Speed" size="sm" fill value={s.speed} onChange={(speed) => dispatch({ type: "speed", speed })} options={[1, 2, 4].map((v) => ({ value: v, label: `${v}×` }))} />
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
