/**
 * The playbook engine: plain functions that read a playbook and decide what the agent does next — which niche a
 * prompt belongs to, what it already answers, which question (if any) to ask, which modules the goals bring,
 * what the plan card says, and whether a piece of text breaks a guardrail.
 *
 * In the prototype the prompt is read with patterns. The interface (prompt in → answered slots out) is the same
 * one a model would fill in production, so the flow doesn't change when that is swapped in.
 */
import { DENTIST } from "./dentist"
import type { GuardrailRule, ModuleDef, NicheId, Playbook, Question, Slot, Source } from "./types"

export const PLAYBOOKS: Record<NicheId, Playbook> = { dentist: DENTIST }
export const getPlaybook = (id: NicheId) => PLAYBOOKS[id]

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
export type Answers = Partial<Record<Exclude<Slot, "goals">, Answer>>

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

const GOAL_SIGNALS: [string, RegExp][] = [
  ["G1", /\b(book(ing)?s? (an )?(appointments? )?online|online (booking|appointments?)|book appointments|(patients?|people) (should|can|to|could) book|appointments? online|get reminders|bookings)\b/i],
  ["G2", /\b(consultations?|estimates?|quotes? for (braces|implants|veneers))\b/i],
  ["G3", /\b(emergenc\w*|same[- ]day|walk[- ]ins?|toothache|24 ?(hours|h|\/7))\b/i],
  ["G4", /\b(come back|coming back|recall|check-?up reminders?|return(ing)? patients|keep patients)\b/i],
  ["G5", /\b(deposits?|payments?|pay online|take payment)\b/i],
  ["G6", /\b(be found|found online|get found|trusted online|online presence|just (want )?(a )?(simple )?(website|site|page))\b/i],
  ["G7", /\b(\d+|two|three|four|five|several|multiple)[- ](branch(es)?|locations|clinics)|branches|several dentists|our dentists\b/i],
  ["G8", /\b(insur\w*|corporate|compan(y|ies)|panel)\b/i],
]

const FOCUS: [string, RegExp][] = [
  ["pediatric", /\b(kids?|child(ren)?'?s?|paediatric|pediatric)\b/i],
  ["ortho", /\b(orthodont\w*|braces|aligners?|invisalign)\b/i],
  ["cosmetic", /\b(cosmetic|whitening|veneers?|implants?)\b/i],
  ["general", /\b(general|family)\b/i],
]

export function analyze(prompt: string, pb: Playbook = DENTIST): Analysis {
  const p = prompt
  const answers: Answers = {}
  const set = (slot: Exclude<Slot, "goals">, value: string) => (answers[slot] = { value, source: "prompt" })

  const focus = FOCUS.find(([, re]) => re.test(p))
  if (focus) set("focus", focus[0])

  if (/\b(\d+|two|three|four|five|several|multiple)[- ](branch(es)?|locations|clinics)\b|\bbranches\b/i.test(p)) set("scale", "branches")
  else if (/\b(several|multiple|team of|\d+) dentists\b|\bour dentists\b/i.test(p)) set("scale", "dentists")
  else if (/\b(solo|one dentist|just me|single dentist)\b/i.test(p)) set("scale", "solo")

  if (/\b(no prices|don'?t (show|list|want) prices|hide (the )?prices|without prices)\b/i.test(p)) set("prices", "ask")
  else if (/\bprice ranges?\b|\branges\b/i.test(p)) set("prices", "range")
  else if (/\bexact prices|full price list\b/i.test(p)) set("prices", "exact")
  else if (/\bfrom[- ]prices|starting (at|from)\b/i.test(p)) set("prices", "from")

  if (/\b24 ?(hours|h|\/7)|every day|daily\b/i.test(p) && /\b(emergenc\w*|toothache|walk[- ]in|same[- ]day)\b/i.test(p)) set("emergency", "daily")
  if (/\b(we )?(don'?t|do not) (take|accept) insurance\b/i.test(p)) set("insurance", "none")
  else if (/\binsur\w*|panel\b/i.test(p)) set("insurance", "list")
  if (pb.directory.test(p)) set("build", "directory")

  const allOfTheAbove = /\ball of (the )?(above|them|it)|everything\b/i.test(p)
  const justBuild = /\bjust (build|make|do) it\b|\byou decide\b|\bsurprise me\b/i.test(p)
  const vagueGoal = /\bmore (patients|customers|clients|bookings)\b/i.test(p) && !GOAL_SIGNALS.some(([, re]) => re.test(p))
  const unsupported = /\b(online shop|e-?commerce|sell (products|toothbrushes|toothpaste)|shop online)\b/i.test(p) ? ["Selling products online"] : []

  let goals = GOAL_SIGNALS.filter(([, re]) => re.test(p)).map(([g]) => g)
  // "patients should book consultations" is the consultation goal, not general booking
  if (goals.includes("G2") && /\bbook(ing)?s? (a |their )?consultations?\b/i.test(p)) goals = goals.filter((g) => g !== "G1")
  // a stated insurance/branch detail isn't by itself a goal unless it's the point of the site
  if (goals.includes("G8") && !/\b(serve|insured patients|corporate (clients|patients)|companies)\b/i.test(p)) goals = goals.filter((g) => g !== "G8")
  if (goals.includes("G7") && answers.scale?.value !== "branches" && !/\bseveral dentists\b/i.test(p)) goals = goals.filter((g) => g !== "G7")

  // the main goal is the highest-intent one: emergency, then consultation, then booking (§3)
  const rank = (g: string) => ["G3", "G2", "G1"].indexOf(g) === -1 ? 9 : ["G3", "G2", "G1"].indexOf(g)
  goals = [...goals].sort((a, b) => rank(a) - rank(b))

  return {
    goals,
    vagueGoal,
    allOfTheAbove,
    justBuild,
    unsupported,
    answers,
    guardrails: checkGuardrails(p, pb),
    business: businessName(p),
    place: placeName(p),
  }
}

function businessName(p: string): string | null {
  const m = p.match(/\b(?:named|called)\s+["“']?([A-Za-z][\w&'’.-]*(?:\s+[A-Za-z&][\w&'’.-]*){0,4})/i) ?? p.match(/["“]([^"”]{3,48})["”]/)
  if (!m) {
    const titled = p.match(/\b((?:[A-Z][a-z’']+\s+){1,3}(?:Dental|Dentistry|Smile|Orthodontics|Clinic)(?:\s+(?:Clinic|Centre|Center|Care|Studio))?)\b/)
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

export function initialPlaybookState(prompt: string, pb: Playbook = DENTIST): PlaybookState {
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

const counted = (st: PlaybookState) => st.asked.filter((q) => q !== "Q0").length

/** the variant of Q4 the main goal asks for, if any */
function q4For(pb: Playbook, st: PlaybookState): Question | null {
  const main = pb.goals.find((g) => g.id === st.goals[0])
  const v = main?.followUp
  if (!v || v === "scale") return null
  return pb.questions.find((q) => q.id === "Q4" && q.variant === v) ?? null
}

/** whether the clinic's size changes what gets built for these goals */
function scaleMatters(st: PlaybookState) {
  return st.goals.includes("G7") || st.goals.some((g) => g === "G1" || g === "G4")
}

/**
 * The next question to ask, or null when it's time for the plan card. At most four questions (Q0 doesn't
 * count), one at a time, skipping anything the prompt, the search or the goals already settle.
 */
export function nextQuestion(st: PlaybookState, pb: Playbook = DENTIST): Question | null {
  if (st.answers.build?.value === "directory") return st.asked.includes("Q0") ? null : pb.questions[0]
  if (st.justBuild) return null
  if (!st.goals.length) return st.asked.includes("Q1") ? null : pb.questions[1]
  if (counted(st) >= 4) return null
  const ask = (q: Question | null | undefined) => (q && !st.asked.includes(q.id) && counted(st) < 4 ? q : null)
  if (!st.answers.focus && !st.goals.every((g) => g === "G6")) {
    const q = ask(pb.questions[2])
    if (q) return q
  }
  if (!st.answers.scale && scaleMatters(st)) {
    const q = ask(pb.questions[3])
    if (q) return q
  }
  const q4 = q4For(pb, st)
  if (q4 && !st.answers[q4.slot as Exclude<Slot, "goals">]) return ask(q4)
  return null
}

/**
 * Where the owner is in the series of questions: the open question's number and how many there will probably be.
 * Later questions depend on the answers, so the total assumes the usual answers and can change by one as they come in.
 */
export function questionProgress(st: PlaybookState, currentSlot?: Slot, pb: Playbook = DENTIST): { index: number; total: number } {
  const counted = st.asked.filter((q) => q !== "Q0")
  let sim = st
  const fill = (q: Question) => {
    if (q.slot === "goals") sim = { ...sim, goals: sim.goals.length ? sim.goals : sim.candidates?.goals.slice(0, 1) ?? [pb.defaultGoal, pb.defaultSecondary] }
    else if (!sim.answers[q.slot as Exclude<Slot, "goals">])
      sim = { ...sim, answers: { ...sim.answers, [q.slot]: { value: pb.defaults[q.slot as keyof Playbook["defaults"]] ?? "one", source: "default" } } }
  }
  const current = pb.questions.find((q) => q.slot === currentSlot)
  if (current) fill(current)
  let extra = 0
  for (let i = 0; i < 6; i++) {
    const q = nextQuestion(sim, pb)
    if (!q) break
    sim = { ...sim, asked: [...sim.asked, q.id] }
    fill(q)
    if (q.id !== "Q0") extra++
  }
  return { index: Math.max(1, counted.length), total: Math.max(1, counted.length + extra) }
}

/** fills every unanswered slot with the playbook default, so the plan card can show (and flag) it */
export function withDefaults(st: PlaybookState, pb: Playbook = DENTIST): PlaybookState {
  const answers = { ...st.answers }
  const fill = (slot: keyof Playbook["defaults"] & Exclude<Slot, "goals">) => {
    if (!answers[slot]) answers[slot] = { value: pb.defaults[slot], source: "default" }
  }
  fill("focus")
  fill("scale")
  fill("prices")
  fill("emergency")
  fill("insurance")
  if (!answers.build) answers.build = { value: "one", source: "default" }
  const goals = st.goals.length ? st.goals : [pb.defaultGoal, pb.defaultSecondary]
  return { ...st, answers, goals, goalsSource: st.goalsSource ?? "default" }
}

/* ---------------- scenarios and style ---------------- */

export function scenariosOf(st: PlaybookState, pb: Playbook = DENTIST): string[] {
  const out: string[] = []
  const f = st.answers.focus?.value
  if (f === "pediatric") out.push("S3")
  if (f === "ortho") out.push("S4")
  if (f === "cosmetic") out.push("S5")
  if (st.goals.includes("G3") || st.answers.emergency?.value === "daily") out.push("S6")
  if (st.goals.includes("G7") || st.answers.scale?.value === "branches" || st.answers.scale?.value === "dentists") out.push("S7")
  if (st.goals.includes("G8")) out.push("S8")
  if (f === "general" && !out.length) out.push(/family/i.test(st.business ?? "") ? "S2" : "S1")
  if (!out.length) out.push("S1")
  return out.filter((id) => pb.scenarios.some((s) => s.id === id))
}

export function presetOf(st: PlaybookState, pb: Playbook = DENTIST): string {
  if (st.style) return st.style
  const sc = scenariosOf(st, pb)
  if (sc.includes("S3")) return "warm-family"
  if (sc.includes("S5")) return "modern-premium"
  return pb.defaults.style
}

/* ---------------- goals → modules ---------------- */

export const moduleById = (id: string, pb: Playbook = DENTIST) => pb.modules.find((m) => m.id === id)!
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
export function offerFor(goals: string[], pb: Playbook = DENTIST, only?: (id: string) => boolean): OfferGroup[] {
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
export const bundleOf = (goals: string[], pb: Playbook = DENTIST) => offerFor(goals, pb).flatMap((g) => g.modules.map((m) => m.id))

/**
 * Applies the owner's choices, keeping a module and what it depends on together: adding Payments adds Appointments
 * (or Estimates) with it, and declining that parent declines Payments too.
 */
export function decide(decisions: Record<string, Decision>, id: string, d: Decision, goals: string[], pb: Playbook = DENTIST): Record<string, Decision> {
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
export function bringsWith(id: string, decisions: Record<string, Decision>, goals: string[], pb: Playbook = DENTIST): ModuleDef | null {
  const mod = moduleById(id, pb)
  if (!mod.dependsOn || mod.dependsOn.some((d) => decisions[d] === "added")) return null
  const bundle = bundleOf(goals, pb)
  const parent = mod.dependsOn.find((dep) => bundle.includes(dep) && decisions[dep] !== "later") ?? mod.dependsOn.find((dep) => bundle.includes(dep)) ?? mod.dependsOn[0]
  return moduleById(parent, pb)
}

export const added = (st: PlaybookState, pb: Playbook = DENTIST) => pb.modules.filter((m) => m.core || st.decisions[m.id] === "added")

/** non-core modules that aren't added: declined, undecided, or outside the chosen goals */
export function addLater(st: PlaybookState, pb: Playbook = DENTIST): ModuleDef[] {
  return pb.modules.filter((m) => !m.core && st.decisions[m.id] !== "added")
}

/** monthly add-on total for this website */
export const monthlyTotal = (st: PlaybookState, pb: Playbook = DENTIST) => added(st, pb).reduce((n, m) => n + m.price, 0)

/** the main goal's own module (if any) — declining it changes the main button */
const KEY_MODULE: Record<string, string> = { G1: "appointments", G2: "estimates", G3: "appointments", G4: "appointments", G5: "payments", G7: "branches", G8: "estimates" }

export function mainButton(st: PlaybookState, pb: Playbook = DENTIST): { label: string; fallback: boolean; module?: ModuleDef } {
  const main = pb.goals.find((g) => g.id === st.goals[0]) ?? pb.goals.find((g) => g.id === pb.defaultGoal)!
  const key = KEY_MODULE[main.id]
  if (key && st.decisions[key] === "later") {
    const mod = moduleById(key, pb)
    const label = main.id === "G3" ? "Call now" : mod.fallback ?? "Call or message us"
    return { label, fallback: true, module: mod }
  }
  return { label: main.mainButton, fallback: false }
}

/** automations that come with the added modules for the chosen goals */
export function automationsOf(st: PlaybookState): string[] {
  const has = (id: string) => st.decisions[id] === "added"
  const out: string[] = []
  if (has("appointments")) out.push("Confirmation", "Reminders")
  if (has("reviews")) out.push("Review request")
  if (has("crm") && st.goals.includes("G4")) out.push("Recall", "Reactivation")
  if (has("estimates")) out.push("Estimate follow-up")
  if (has("payments")) out.push("Payment receipts")
  if (has("branches") && has("appointments")) out.push("Per-branch reminders")
  return [...new Set(out)]
}

/* ---------------- labels for the plan card ---------------- */

export const goalLabel = (id: string, pb: Playbook = DENTIST) => pb.goals.find((g) => g.id === id)?.label ?? id

export function optionLabel(slot: Exclude<Slot, "goals">, value: string, pb: Playbook = DENTIST): string {
  const q = pb.questions.find((x) => x.slot === slot)
  const o = q?.options.find((x) => x.id === value)
  if (o) return o.label
  return value
}

export const SOURCE_LABEL: Record<Source, string> = { prompt: "From your message", search: "Found online", owner: "You chose", default: "My default" }

/** goals ordered for the chips: the ones that fit the detected scenario first, the rest under "More" */
export function goalChips(st: PlaybookState, pb: Playbook = DENTIST): { first: string[]; more: string[] } {
  const sc = scenariosOf(st, pb)
  const fits = pb.goals.filter((g) => g.fits.some((f) => sc.includes(f))).map((g) => g.id)
  const order = [...new Set([...fits, "G1", "G2", "G4", "G6", "G3", "G5", "G7", "G8"])]
  return { first: order.slice(0, 4), more: order.slice(4) }
}

/* ---------------- guardrails ---------------- */

export function checkGuardrails(text: string, pb: Playbook = DENTIST): GuardrailRule[] {
  return pb.guardrails.filter((g) => g.match.test(text))
}

/* ---------------- patching after the plan ---------------- */

/** goals mentioned in a later message that aren't chosen yet */
export function newGoals(text: string, st: PlaybookState): string[] {
  return GOAL_SIGNALS.filter(([g, re]) => re.test(text) && !st.goals.includes(g)).map(([g]) => g)
}
