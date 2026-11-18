"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ChevronDown, CircleCheck, FlaskConical, Pencil, ShieldCheck, Star } from "lucide-react"
import { Alert, Badge, Button, Chip } from "@/components/ui"
import { cn } from "@/lib/cn"
import type { Msg } from "@/lib/generation/state"
import { DENTIST } from "@/lib/playbooks/dentist"
import { clinicName, presetName } from "@/lib/playbooks/dentist-plan"
import {
  SOURCE_LABEL,
  coreModules,
  goalLabel,
  mainButton,
  monthlyTotal,
  moduleById,
  offerFor,
  optionLabel,
  presetOf,
  withDefaults,
  type Decision,
  type PlaybookState,
} from "@/lib/playbooks/engine"
import type { Slot, Source } from "@/lib/playbooks/types"
import { ModuleCard, priceLabel } from "@/components/playbook/module-card"
import { useGen } from "./gen-provider"
import { useEditorSite } from "./editor-site"

const card = "flex flex-col gap-4 rounded-lg border border-line-default bg-surface p-4 shadow-[0_2px_0_0_var(--color-shadow-block)] sm:p-5"
const SOURCE_TONE: Record<Source, "neutral" | "brand" | "success" | "warning"> = { prompt: "brand", search: "success", owner: "brand", default: "warning" }

function SourceTag({ source }: { source: Source }) {
  return (
    <Badge tone={SOURCE_TONE[source]} dot={false} className="shrink-0">
      {SOURCE_LABEL[source]}
    </Badge>
  )
}

/* ---------------- guardrails ---------------- */

/** something the site can't say or collect: why, and the compliant alternative */
export function GuardCard({ m, compact }: { m: Extract<Msg, { type: "pb-guard" }>; compact?: boolean }) {
  const { dispatch } = useGen()
  const rule = DENTIST.guardrails.find((g) => g.id === m.rule)!
  if (m.resolved)
    return (
      <p className="flex items-start gap-2 type-body-sm text-fg-tertiary">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        {m.resolved === "accepted" ? `Using: ${rule.alternative}` : `Left out “${m.quote}”.`}
      </p>
    )
  return (
    <Alert tone="warning" icon={<ShieldCheck />} title={m.quote ? `About “${m.quote}”` : "One thing to check"} className={cn(!compact && "sm:mr-20")}>
      <p>{rule.reason}</p>
      <p className="mt-2 rounded-sm bg-surface/70 px-3 py-2 text-fg-primary">{rule.confirm ?? rule.alternative}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => dispatch({ type: "pbGuard", id: m.id, resolution: "accepted" })}>
          {rule.confirm ? "Yes, I have consent" : "Use this instead"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "pbGuard", id: m.id, resolution: "declined" })}>
          Leave it out
        </Button>
      </div>
    </Alert>
  )
}

/* ---------------- the plan card ---------------- */

type Line = { key: Slot | "style" | "found"; label: string; value: string; source: Source; options?: { id: string; label: string }[]; multi?: boolean }

function planLines(pb: PlaybookState): Line[] {
  const st = withDefaults(pb)
  const ans = (slot: Exclude<Slot, "goals" | "build">) => st.answers[slot]!
  const q = (slot: Slot) => DENTIST.questions.find((x) => x.slot === slot)?.options
  const lines: Line[] = [
    { key: "goals", label: st.goals.length > 1 ? "Goals" : "Goal", value: st.goals.map((g, i) => (i === 0 && st.goals.length > 1 ? `${goalLabel(g)} (main)` : goalLabel(g))).join(" · "), source: st.goalsSource ?? "default", multi: true },
    { key: "focus", label: "Kind of dentistry", value: optionLabel("focus", ans("focus").value), source: ans("focus").source, options: q("focus") },
    { key: "scale", label: "Size", value: optionLabel("scale", ans("scale").value), source: ans("scale").source, options: q("scale") },
    { key: "prices", label: "Prices", value: optionLabel("prices", ans("prices").value), source: ans("prices").source, options: q("prices") },
  ]
  if (pb.found)
    lines.push({ key: "found", label: "Found online", value: [pb.found.rating, pb.found.dentists && `${pb.found.dentists} dentists`, pb.found.hours].filter(Boolean).join(" · "), source: "search" })
  lines.push(
    { key: "emergency", label: "Emergencies", value: optionLabel("emergency", ans("emergency").value), source: ans("emergency").source, options: q("emergency") },
    { key: "insurance", label: "Insurance", value: optionLabel("insurance", ans("insurance").value), source: ans("insurance").source, options: q("insurance") },
    {
      key: "style",
      label: "Style",
      value: presetName(presetOf(st)),
      source: pb.style ? "owner" : "default",
      options: ["calm-clinical", "warm-family", "modern-premium"].map((id) => ({ id, label: presetName(id) })),
    },
  )
  return lines
}

/** the one "Here's my plan" card: assumptions with where each came from, the tools offered per goal, and the total */
export function PlanCard({ m, compact }: { m: Extract<Msg, { type: "pb-plan" }>; compact?: boolean }) {
  const { s, dispatch } = useGen()
  const [all, setAll] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const pb = s.pb!
  const st = withDefaults(pb)
  const total = monthlyTotal(st)
  // tools the goals call for wait until after the first build, so the main button is planned without them
  const waiting = offerFor(st.goals)
    .flatMap((g) => g.modules)
    .filter((x) => !pb.decisions[x.id])
  const btn = mainButton({ ...st, decisions: { ...Object.fromEntries(waiting.map((x) => [x.id, "later" as Decision])), ...st.decisions } })

  if (m.confirmed) {
    const tools = Object.entries(pb.decisions).filter(([, d]) => d === "added").map(([id]) => moduleById(id))
    return (
      <section aria-label="Plan" className={cn(card, "gap-3", !compact && "sm:mr-20")}>
        <p className="flex items-center gap-2 type-label-md text-fg-primary">
          <CircleCheck className="size-4 text-status-success-text" /> Plan for {clinicName(pb)}
        </p>
        <p className="type-body-sm text-fg-secondary">
          {pb.goals.map((g) => goalLabel(g)).join(" · ")} — main button “{btn.label}”
        </p>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <Badge key={t.id} tone="brand" dot={false}>
              {t.name} · {priceLabel(t)}
            </Badge>
          ))}
          {!tools.length && <span className="type-body-sm text-fg-tertiary">Free parts only</span>}
        </div>
        <p className="type-caption text-fg-tertiary">{total ? `$${total}/month in add-ons, charged from when you publish.` : "No add-ons — nothing extra to pay."}</p>
      </section>
    )
  }

  const lines = planLines(pb)
  const shown = all ? lines : lines.slice(0, 4)
  // tools wait until the owner has seen their site: they're suggested in the editor's to-do list and on Modules
  const later = offerFor(st.goals)
    .flatMap((g) => g.modules)
    .filter((x) => pb.decisions[x.id] !== "added")
  const confirm = () => {
    for (const x of waiting) dispatch({ type: "pbDecide", module: x.id, decision: "later" })
    dispatch({ type: "pbConfirmPlan" })
  }
  const free = coreModules().map((x) => x.name)

  return (
    // the conclusion of the questions: read from its top, like the question cards
    <div data-question-open className={cn("flex flex-col gap-4", !compact && "sm:mr-20")}>
      <section aria-label="Here's my plan" className={cn(card, "gap-5 rounded-[24px] sm:p-6")}>
        <div className="flex flex-col gap-1">
          <h3 className="type-h5 text-fg-primary">Here&apos;s my plan</h3>
          <p className="type-body-sm text-fg-secondary">
            From your answers{pb.found ? " and what I found online" : ""}, for {clinicName(pb)}
            {pb.place ? `, ${pb.place}` : ""}. Main button: <span className="text-fg-primary">“{btn.label}”</span>
          </p>
        </div>

        {/* assumptions */}
        <dl className="flex flex-col divide-y divide-line-default rounded-md border border-line-default">
          {shown.map((l) => (
            <div key={l.key} className="flex flex-col gap-2 px-3 py-2.5">
              <div className="flex items-start gap-3">
                <dt className="w-28 shrink-0 type-body-sm text-fg-tertiary sm:w-36">{l.label}</dt>
                <dd className="min-w-0 flex-1 type-body-sm text-fg-primary">{l.value}</dd>
                <span className="hidden sm:inline-flex">
                  <SourceTag source={l.source} />
                </span>
                {l.key !== "found" && (
                  <Button size="sm" variant="link" className="type-label-sm" leadingIcon={<Pencil className="size-3.5" />} onClick={() => setEditing(editing === l.key ? null : l.key)} aria-expanded={editing === l.key}>
                    Edit
                  </Button>
                )}
              </div>
              {editing === l.key && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 pb-1 sm:pl-36">
                  {l.key === "goals" ? (
                    <GoalEdit st={st} onDone={(g) => (dispatch({ type: "pbEdit", slot: "goals", value: g }), setEditing(null))} />
                  ) : (
                    l.options?.map((o) => (
                      <Chip key={o.id} className="h-8 px-2.5 type-body-sm" selected={o.label === l.value} onClick={() => (dispatch({ type: "pbEdit", slot: l.key as Slot | "style", value: o.id }), setEditing(null))}>
                        {o.label}
                      </Chip>
                    ))
                  )}
                </motion.div>
              )}
            </div>
          ))}
          {lines.length > 4 && (
            <button type="button" onClick={() => setAll((a) => !a)} aria-expanded={all} className="flex items-center gap-1 px-3 py-2.5 type-label-sm text-fg-secondary">
              {all ? "Show fewer" : `Show all assumptions (${lines.length})`} <ChevronDown className={cn("size-4 transition-transform", all && "rotate-180")} />
            </button>
          )}
        </dl>

        <div className="flex flex-col gap-4 rounded-md bg-subtle p-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="type-label-md text-fg-primary">I&apos;ll build the free parts first</p>
            <p className="type-body-sm text-fg-secondary">
              Included free: {free.join(", ")}.{" "}
              {later.length
                ? `Once you've seen your website, I'll suggest tools for your goals, like ${later
                    .slice(0, 2)
                    .map((x) => x.name.toLowerCase())
                    .join(" or ")} — they'll be in your to-do list.`
                : "Nothing to pay on top of your plan."}
            </p>
          </div>
          <Button className="shrink-0 max-sm:w-full" onClick={confirm}>
            Create Website Plan
          </Button>
        </div>
      </section>
    </div>
  )
}

function GoalEdit({ st, onDone }: { st: PlaybookState; onDone: (goals: string[]) => void }) {
  const [picked, setPicked] = useState(st.goals)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {DENTIST.goals.map((g) => (
          <Chip
            key={g.id}
            className="h-auto min-h-8 px-2.5 py-1 text-left type-body-sm"
            selected={picked.includes(g.id)}
            onClick={() => setPicked((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : p.length < 3 ? [...p, g.id] : p))}
          >
            {picked[0] === g.id && <Star className="size-3.5" />} {g.chip}
          </Chip>
        ))}
      </div>
      <p className="type-caption text-fg-tertiary">Up to three — the first one you pick is the main goal.</p>
      <Button size="sm" className="self-start" disabled={!picked.length} onClick={() => onDone(picked)}>
        Update goals
      </Button>
    </div>
  )
}

/* ---------------- after the plan ---------------- */

/** a new goal after the plan: only its new modules, nothing else changes */
export function PatchCard({ m, compact }: { m: Extract<Msg, { type: "pb-patch" }>; compact?: boolean }) {
  const { s, dispatch } = useGen()
  const pb = s.pb!
  const offer = offerFor(m.goals, DENTIST, (id) => pb.decisions[id] !== "added")
  const [d, setD] = useState<Record<string, Decision>>(() => Object.fromEntries(offer.flatMap((g) => g.modules.map((x) => [x.id, "added" as Decision]))))
  if (m.resolved) return null
  const sum = Object.entries(d).reduce((n, [id, v]) => n + (v === "added" ? moduleById(id).price : 0), 0)
  return (
    <section aria-label="Add to your plan" className={cn(card, !compact && "sm:mr-20")}>
      <div className="flex flex-col gap-1">
        <h3 className="type-label-lg text-fg-primary">Add {m.goals.map((g) => goalLabel(g).toLowerCase()).join(" and ")}?</h3>
        <p className="type-body-sm text-fg-secondary">Only these change — the rest of your site stays as it is.</p>
      </div>
      {offer.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {offer.flatMap((g) => g.modules.map((x) => <ModuleCard key={x.id} m={x} goal={g.goal} decision={d[x.id]} onDecide={(v) => setD((p) => ({ ...p, [x.id]: v }))} />))}
        </div>
      ) : (
        <p className="type-body-sm text-fg-secondary">You already have the tools for this — I&apos;ll just add it to the brief.</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => dispatch({ type: "pbPatch", id: m.id, decisions: offer.length ? d : { reviews: "added" } })}>
          {sum ? `Add for $${sum}/month` : "Add"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "pbPatch", id: m.id, decisions: null })}>
          Not now
        </Button>
      </div>
    </section>
  )
}

/** after the build: tools that need the owner's own accounts run in test mode until connected */
export function ActivationCard({ compact }: { compact?: boolean }) {
  const { s, dispatch } = useGen()
  const { modules: api } = useEditorSite()
  const pb = s.pb!
  const mods = Object.entries(pb.decisions)
    .filter(([id, d]) => d === "added" && moduleById(id).needsAccount)
    .map(([id]) => moduleById(id))
  const left = mods.filter((x) => !pb.activated.includes(x.id))
  return (
    <section aria-label="Connect your accounts" className={cn(card, !compact && "sm:mr-20")}>
      <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-2 type-label-lg text-fg-primary">
          <FlaskConical className="size-4 text-fg-tertiary" /> {left.length ? "Some tools are in test mode" : "All tools are live"}
        </h3>
        <p className="type-body-sm text-fg-secondary">
          {left.length ? "Everything works on your site already — connect these so patients get messages and payments reach you." : "Patients now get messages and payments reach your account."}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {mods.map((x) => {
          const live = pb.activated.includes(x.id)
          return (
            <li key={x.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line-default px-3 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-label-md text-fg-primary">{x.name}</span>
                <span className="type-caption text-fg-tertiary">{live ? `${x.needsAccount!.label} connected` : x.needsAccount!.testMode}</span>
              </span>
              {live ? (
                <Badge tone="success">Live</Badge>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => (api ? api.activate(x.id) : dispatch({ type: "pbActivate", module: x.id }))}>
                  {x.needsAccount!.connect}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

