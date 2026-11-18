/**
 * The playbook engine: plain functions that read a playbook and decide what the agent does next — which niche a
 * prompt belongs to, what it already answers, which question (if any) to ask, which modules the goals bring,
 * what the plan card says, and whether a piece of text breaks a guardrail.
 *
 * In the prototype the prompt is read with patterns. The interface (prompt in → answered slots out) is the same
 * one a model would fill in production, so the flow doesn't change when that is swapped in.
 */
import { DENTIST } from "./dentist"
import { LAWYER } from "./lawyer"
import type { AnswerSlot, GuardrailRule, ModuleDef, NicheId, Playbook, Question, Slot, Source } from "./types"

export const PLAYBOOKS: Record<NicheId, Playbook> = { dentist: DENTIST, lawyer: LAWYER }
export const getPlaybook = (id: NicheId) => PLAYBOOKS[id]
/** the playbook a conversation runs on */
export const playbookOf = (st: { niche: NicheId }) => PLAYBOOKS[st.niche] ?? DENTIST

/** module ids are unique across niches (shared core modules are the same card), so a module is found by id alone */
const ALL_MODULES = new Map<string, ModuleDef>(Object.values(PLAYBOOKS).flatMap((pb) => pb.modules.map((m) => [m.id, m] as const)))
/** goal ids are unique across niches too (G1… for dentists, LG1… for lawyers) */
const playbookOfGoal = (id: string | undefined) => Object.values(PLAYBOOKS).find((pb) => pb.goals.some((g) => g.id === id)) ?? DENTIST
const playbookOfGoals = (goals: string[]) => playbookOfGoal(goals[0])

/* ---------------- detection ---------------- */

export interface Detection {
  niche: NicheId | null
  /** a directory or marketplace of many practices (asks Q0) */
  directory: boolean
  /** also names a different kind of business (asks whether it's two sites) */
  otherNiche: boolean
}

export function detect(prompt: string): Detection {
  for (const pb of Object.values(PLAYBOOKS)) {
    if (pb.signals.test(prompt) && !pb.generic.test(prompt)) {
      return { niche: pb.id, directory: pb.directory.test(prompt), otherNiche: pb.otherNiche.test(prompt) }
    }
  }
  return { niche: null, directory: false, otherNiche: false }
}

/* ---------------- what the prompt already says ---------------- */

export type Answer = { value: string; source: Source }
export type Answers = Partial<Record<AnswerSlot, Answer>>

export interface Analysis {
  goals: string[]
  /** "more patients" and similar: propose the default goals and ask to confirm */
  vagueGoal: boolean
  allOfTheAbove: boolean
  justBuild: boolean
  /** things it asked for that the product can't do yet */
  unsupported: string[]
  answers: Answers
  guardrails: GuardrailRule[]
  business: string | null
  place: string | null
}

export function analyze(prompt: string, pb: Playbook = DENTIST): Analysis {
  const p = prompt
  const answers: Answers = {}
  pb.logic.read(p, (slot, value) => (answers[slot] = { value, source: "prompt" }))
  if (pb.directory.test(p)) answers.build = { value: "directory", source: "prompt" }

  const signals = pb.logic.goalSignals
  const allOfTheAbove = /\ball of (the )?(above|them|it)|everything\b/i.test(p)
  const justBuild = /\bjust (build|make|do) it\b|\byou decide\b|\bsurprise me\b/i.test(p)
  const vagueGoal = pb.logic.vague.test(p) && !signals.some(([, re]) => re.test(p))
  const goals = pb.logic.refineGoals(
    signals.filter(([, re]) => re.test(p)).map(([g]) => g),
    p,
    answers,
  )

  return {
    goals,
    vagueGoal,
    allOfTheAbove,
    justBuild,
    unsupported: pb.logic.unsupported(p),
    answers,
    guardrails: checkGuardrails(p, pb),
    business: businessName(p, pb),
    place: placeName(p),
  }
}

function businessName(p: string, pb: Playbook): string | null {
  const m = p.match(/\b(?:named|called)\s+["“']?([A-Za-z][\w&'’.-]*(?:\s+[A-Za-z&][\w&'’.-]*){0,4})/i) ?? p.match(/["“]([^"”]{3,48})["”]/)
  if (!m) {
    const titled = pb.logic.titledName ? p.match(pb.logic.titledName) : null
    return titled ? titled[1].trim() : null
  }
  return m[1].replace(/\s+(in|at|on|for|with)\b.*$/i, "").replace(/[.,]$/, "").trim()
}

function placeName(p: string): string | null {
  const m = p.match(/\b(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
  return m ? m[1] : null
}

/* ---------------- the conversation state the engine works on ---------------- */

export type Decision = "added" | "later"

export interface PriceList {
  file?: { name: string; size: number }
  text?: string
}

/** the dentists (and their branches) the owner gave on the size question, uploaded or typed */
export interface TeamMember {
  name: string
  /** registration number with the regulator, if they have it to hand */
  reg?: string
  branch?: string
}
export interface TeamList {
  file?: { name: string; size: number }
  people?: TeamMember[]
}

export interface PlaybookState {
  niche: NicheId
  /** goals in priority order; the first is the main goal */
  goals: string[]
  goalsSource: Source | null
  answers: Answers
  /** questions asked so far (Q1–Q4 count towards the four) */
  asked: string[]
  /** decisions on the module offer */
  decisions: Record<string, Decision>
  /** guardrail notes the owner accepted, shown in the brief */
  notes: string[]
  justBuild: boolean
  /** what the web search found (fills answers without asking) */
  found: { rating?: string; dentists?: number; branches?: number; hours?: string } | null
  business: string | null
  place: string | null
  unsupported: string[]
  /** consent confirmed for sensitive modules (the gallery) */
  consent: string[]
  /**
   * goals to choose the main one from: several goals in the prompt or "all of the above" (only the main one is
   * kept, the rest go under Add later), or the proposal for a vague goal ("more patients")
   */
  candidates: { goals: string[]; kind: "several" | "vague" } | null
  /** style preset the owner picked on the plan card (otherwise the scenario's preset) */
  style: string | null
  /** the plan card was confirmed: brief, style and sitemap are generated from here on */
  planConfirmed: boolean
  /** modules whose owner accounts are connected (out of test mode) */
  activated: string[]
  /** the owner's own price list, uploaded or typed on the prices question */
  priceList?: PriceList | null
  /** the owner's dentists, uploaded or typed on the size question */
  team?: TeamList | null
}

export function initialPlaybookState(prompt: string, pb: Playbook = PLAYBOOKS[detect(prompt).niche ?? "dentist"]): PlaybookState {
  const a = analyze(prompt, pb)
  const several = a.allOfTheAbove || a.goals.length >= 3
  const goals = a.justBuild && !a.goals.length ? [pb.defaultGoal] : a.vagueGoal || several ? [] : a.goals
  const candidates: PlaybookState["candidates"] = a.vagueGoal
    ? { goals: [pb.defaultGoal, pb.defaultSecondary], kind: "vague" }
    : several
      ? { goals: a.allOfTheAbove && a.goals.length < 2 ? pb.goals.map((g) => g.id) : a.goals, kind: "several" }
      : null
  return {
    niche: pb.id,
    goals,
    goalsSource: goals.length ? (a.justBuild && !a.goals.length ? "default" : "prompt") : null,
    answers: a.answers,
    asked: [],
    decisions: {},
    notes: [],
    justBuild: a.justBuild,
    found: null,
    business: a.business,
    place: a.place,
    unsupported: a.unsupported,
    consent: [],
    candidates,
    style: null,
    planConfirmed: false,
    activated: [],
  }
}

/* ---------------- questions ---------------- */

/** questions that count towards the four (the gates Q0 and QJ don't) */
const counted = (st: PlaybookState) => st.asked.filter((q) => q !== "Q0" && q !== "QJ").length
const questionById = (pb: Playbook, id: Question["id"]) => pb.questions.find((q) => q.id === id)

/**
 * The next question to ask, or null when it's time for the plan card. At most four questions (the gates don't
 * count), one at a time, skipping anything the prompt, the search or the goals already settle.
 */
export function nextQuestion(st: PlaybookState, pb: Playbook = playbookOf(st)): Question | null {
  if (st.answers.build?.value === "directory") return st.asked.includes("Q0") ? null : questionById(pb, "Q0")!
  if (st.justBuild) return null
  // a gate that comes before the goals (where the lawyer practices)
  const gate = pb.logic.gate
  if (gate && !st.answers[gate as AnswerSlot] && !st.asked.includes("QJ")) return questionById(pb, "QJ") ?? null
  if (!st.goals.length) return st.asked.includes("Q1") ? null : questionById(pb, "Q1")!
  if (counted(st) >= 4) return null
  const ask = (q: Question | null | undefined) => (q && !st.asked.includes(q.id) && counted(st) < 4 ? q : null)
  return pb.logic.next(st, pb, ask)
}

/**
 * Where the owner is in the series of questions: the open question's number and how many there will probably be.
 * Later questions depend on the answers, so the total assumes the usual answers and can change by one as they come in.
 */
export function questionProgress(st: PlaybookState, currentSlot?: Slot, pb: Playbook = playbookOf(st)): { index: number; total: number } {
  const counted = st.asked.filter((q) => q !== "Q0" && q !== "QJ")
  let sim = st
  const fill = (q: Question) => {
    if (q.slot === "goals") sim = { ...sim, goals: sim.goals.length ? sim.goals : sim.candidates?.goals.slice(0, 1) ?? [pb.defaultGoal, pb.defaultSecondary] }
    else if (!sim.answers[q.slot as AnswerSlot])
      sim = { ...sim, answers: { ...sim.answers, [q.slot]: { value: pb.defaults[q.slot as AnswerSlot] ?? "one", source: "default" } } }
  }
  const current = pb.questions.find((q) => q.slot === currentSlot)
  if (current) fill(current)
  let extra = 0
  for (let i = 0; i < 6; i++) {
    const q = nextQuestion(sim, pb)
    if (!q) break
    sim = { ...sim, asked: [...sim.asked, q.id] }
    fill(q)
    if (q.id !== "Q0" && q.id !== "QJ") extra++
  }
  return { index: Math.max(1, counted.length), total: Math.max(1, counted.length + extra) }
}

/** fills every unanswered slot with the playbook default, so the plan card can show (and flag) it */
export function withDefaults(st: PlaybookState, pb: Playbook = playbookOf(st)): PlaybookState {
  const answers = { ...st.answers }
  for (const [slot, value] of Object.entries(pb.defaults)) if (slot !== "style" && !answers[slot as AnswerSlot]) answers[slot as AnswerSlot] = { value: value!, source: "default" }
  if (!answers.build) answers.build = { value: "one", source: "default" }
  const goals = st.goals.length ? st.goals : [pb.defaultGoal, pb.defaultSecondary]
  return { ...st, answers, goals, goalsSource: st.goalsSource ?? "default" }
}

/* ---------------- scenarios and style ---------------- */

export function scenariosOf(st: PlaybookState, pb: Playbook = playbookOf(st)): string[] {
  return pb.logic.scenarios(st).filter((id) => pb.scenarios.some((s) => s.id === id))
}

export function presetOf(st: PlaybookState, pb: Playbook = playbookOf(st)): string {
  return st.style ?? pb.logic.preset(st)
}

/* ---------------- goals → modules ---------------- */

export const moduleById = (id: string, pb?: Playbook) => (pb?.modules.find((m) => m.id === id) ?? ALL_MODULES.get(id))!
export const coreModules = (pb: Playbook = DENTIST) => pb.modules.filter((m) => m.core)

export interface OfferGroup {
  goal: string
  label: string
  modules: ModuleDef[]
}

/**
 * The module offer, grouped by goal. A module appears once, under the first goal that brings it; core modules
 * aren't offered (they're always included). Modules already decided are left out when `only` is given (a patch).
 */
export function offerFor(goals: string[], pb: Playbook = playbookOfGoals(goals), only?: (id: string) => boolean): OfferGroup[] {
  const seen = new Set<string>()
  const groups: OfferGroup[] = []
  for (const gid of goals) {
    const g = pb.goals.find((x) => x.id === gid)
    if (!g) continue
    const mods = g.modules.filter((m) => !seen.has(m) && !moduleById(m, pb).core && (!only || only(m)))
    mods.forEach((m) => seen.add(m))
    if (mods.length) groups.push({ goal: g.id, label: g.label, modules: mods.map((m) => moduleById(m, pb)) })
  }
  return groups
}

/** every module the goals bring (one list) */
export const bundleOf = (goals: string[], pb: Playbook = playbookOfGoals(goals)) => offerFor(goals, pb).flatMap((g) => g.modules.map((m) => m.id))

/**
 * Applies the owner's choices, keeping a module and what it depends on together: adding Payments adds Appointments
 * (or Estimates) with it, and declining that parent declines Payments too.
 */
export function decide(decisions: Record<string, Decision>, id: string, d: Decision, goals: string[], pb: Playbook = playbookOfGoals(goals)): Record<string, Decision> {
  const next = { ...decisions, [id]: d }
  const bundle = bundleOf(goals, pb)
  const mod = moduleById(id, pb)
  if (d === "added" && mod.dependsOn && !mod.dependsOn.some((dep) => next[dep] === "added")) {
    const parent = mod.dependsOn.find((dep) => bundle.includes(dep) && next[dep] !== "later") ?? mod.dependsOn.find((dep) => bundle.includes(dep)) ?? mod.dependsOn[0]
    next[parent] = "added"
  }
  if (d === "later") {
    for (const m of pb.modules) {
      if (m.dependsOn?.includes(id) && next[m.id] === "added" && !m.dependsOn.some((dep) => next[dep] === "added")) next[m.id] = "later"
    }
  }
  return next
}

/** the modules a dependent module would bring with it if added now */
export function bringsWith(id: string, decisions: Record<string, Decision>, goals: string[], pb: Playbook = playbookOfGoals(goals)): ModuleDef | null {
  const mod = moduleById(id, pb)
  if (!mod.dependsOn || mod.dependsOn.some((d) => decisions[d] === "added")) return null
  const bundle = bundleOf(goals, pb)
  const parent = mod.dependsOn.find((dep) => bundle.includes(dep) && decisions[dep] !== "later") ?? mod.dependsOn.find((dep) => bundle.includes(dep)) ?? mod.dependsOn[0]
  return moduleById(parent, pb)
}

export const added = (st: PlaybookState, pb: Playbook = playbookOf(st)) => pb.modules.filter((m) => m.core || st.decisions[m.id] === "added")

/** non-core modules that aren't added: declined, undecided, or outside the chosen goals */
export function addLater(st: PlaybookState, pb: Playbook = playbookOf(st)): ModuleDef[] {
  return pb.modules.filter((m) => !m.core && st.decisions[m.id] !== "added")
}

/** monthly add-on total for this website */
export const monthlyTotal = (st: PlaybookState, pb: Playbook = playbookOf(st)) => added(st, pb).reduce((n, m) => n + m.price, 0)

export function mainButton(st: PlaybookState, pb: Playbook = playbookOf(st)): { label: string; fallback: boolean; module?: ModuleDef } {
  const main = pb.goals.find((g) => g.id === st.goals[0]) ?? pb.goals.find((g) => g.id === pb.defaultGoal)!
  // the main goal's own module: declining it changes the main button
  const key = pb.logic.keyModule[main.id]
  if (key && st.decisions[key] === "later") {
    const mod = moduleById(key, pb)
    return { label: pb.logic.fallbackFor?.(main.id) ?? mod.fallback ?? "Call or message us", fallback: true, module: mod }
  }
  return { label: main.mainButton, fallback: false }
}

/** automations that come with the added modules for the chosen goals */
export function automationsOf(st: PlaybookState, pb: Playbook = playbookOf(st)): string[] {
  return [...new Set(pb.logic.automations((id) => st.decisions[id] === "added", st))]
}

/** why a module can't be offered under the rules followed (lawyers' reviews, say), or null */
export function restriction(st: PlaybookState | null, id: string): string | null {
  if (!st) return null
  const pb = playbookOf(st)
  return pb.logic.restricted?.(st, moduleById(id, pb)) ?? null
}

/* ---------------- labels for the plan card ---------------- */

export const goalLabel = (id: string, pb: Playbook = playbookOfGoal(id)) => pb.goals.find((g) => g.id === id)?.label ?? id

/** the label of an answer (several answers are comma-joined) */
export function optionLabel(slot: AnswerSlot, value: string, pb?: Playbook): string {
  const books = pb ? [pb] : Object.values(PLAYBOOKS)
  const one = (v: string) => {
    for (const b of books) for (const q of b.questions) if (q.slot === slot) for (const o of q.options) if (o.id === v) return o.label
    return v
  }
  return value.split(",").filter(Boolean).map(one).join(", ")
}

export const SOURCE_LABEL: Record<Source, string> = { prompt: "From your message", search: "Found online", owner: "You chose", default: "My default" }

/** goals ordered for the chips: the ones that fit the detected scenario first, the rest under "More" */
export function goalChips(st: PlaybookState, pb: Playbook = playbookOf(st)): { first: string[]; more: string[] } {
  const sc = scenariosOf(st, pb)
  const fits = pb.goals.filter((g) => g.fits.some((f) => sc.includes(f))).map((g) => g.id)
  const order = [...new Set([...fits, ...pb.logic.goalOrder])]
  return { first: order.slice(0, 4), more: order.slice(4) }
}

/* ---------------- guardrails ---------------- */

export function checkGuardrails(text: string, pb: Playbook = DENTIST): GuardrailRule[] {
  return pb.guardrails.filter((g) => g.match.test(text))
}

/* ---------------- patching after the plan ---------------- */

/** goals mentioned in a later message that aren't chosen yet */
export function newGoals(text: string, st: PlaybookState): string[] {
  return playbookOf(st).logic.goalSignals.filter(([g, re]) => re.test(text) && !st.goals.includes(g)).map(([g]) => g)
}
