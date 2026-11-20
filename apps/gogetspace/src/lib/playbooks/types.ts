/**
 * The shape of a niche playbook: everything the agent needs to plan a website for one kind of professional
 * (detection, scenarios, the questions it may ask, goals and the modules they bring, defaults, guardrails and
 * its own wording). Playbooks are data; the engine in ./engine.ts reads them, so adding a niche is adding a file.
 */

export type NicheId = "dentist" | "lawyer"

/** an answer slot the agent fills, from the prompt, the web search, the owner or its own default */
export type Slot = "build" | "goals" | "focus" | "scale" | "prices" | "emergency" | "insurance" | "jurisdiction" | "clients" | "meeting" | "urgent"
/** a slot with a single (or comma-joined) value, i.e. everything but the goals */
export type AnswerSlot = Exclude<Slot, "goals">
export type Source = "prompt" | "search" | "owner" | "default"

export interface Option {
  id: string
  label: string
}

export interface Question {
  /** Q0 and QJ are gates and don't count towards the four */
  id: "Q0" | "QJ" | "Q1" | "Q2" | "Q3" | "Q4"
  slot: Slot
  /** the follow-up variant (Q3 and Q4 can have several) */
  variant?: string
  text: string
  helper?: string
  options: Option[]
  /** several answers allowed, up to this many (stored comma-joined) */
  multi?: number
  /** what the "You decide" option is called, e.g. "I'm not sure" */
  decideLabel?: string
}

export interface Goal {
  id: string
  /** in the owner's words */
  label: string
  /** shorter label for chips */
  chip: string
  mainButton: string
  /** module ids offered for this goal (core modules are always included and not listed here) */
  modules: string[]
  automations: string[]
  /** which follow-up question variant this goal asks, if any */
  followUp?: string
  /** scenarios this goal fits, to order the chips */
  fits: string[]
}

export interface Scenario {
  id: string
  label: string
  signals: RegExp
  mainButton: string
  preset: string
  /** extra pages the scenario adds to the sitemap */
  pages?: string[]
}

export interface ModuleDef {
  id: string
  /** owner-facing name */
  name: string
  /** one line per goal it can serve */
  benefit: Record<string, string>
  included: string[]
  /** monthly add-on price per website in USD; 0 = free */
  price: number
  /** core modules are always added and never offered */
  core?: boolean
  /** any one of these must come with it (Payments needs Appointments or Estimates) */
  dependsOn?: string[]
  /** accounts the owner has to connect before it goes fully live */
  needsAccount?: { label: string; testMode: string; connect: string }
  /** what the main button becomes if the owner declines it */
  fallback?: string
  /** pages it adds to the sitemap */
  pages?: string[]
  sensitive?: string
  /** a notice the owner reads before adding it (e.g. the trust-funds notice on a lawyer's Payments) */
  notice?: string
  /** what the owner confirms before it can be added (gallery consent, trust funds) */
  confirm?: string
  /** a rule area that can switch it off where the local rules restrict it (e.g. "reviews") */
  restrictedBy?: string
}

export interface GuardrailRule {
  id: string
  area: string
  match: RegExp
  /** what the agent says: it can't publish this, and why (one line) */
  reason: string
  /** the compliant alternative it offers */
  alternative: string
  /** what accepting the alternative records in the plan */
  note: string
  /** needs an explicit confirmation before going ahead (e.g. patient consent for photos) */
  confirm?: string
}

export interface Market {
  country: string
  regulator: string
  registration: string
  emergencyNumber: string
  dataLaw: string
}

/** what the agent says that depends on the niche */
export interface PlaybookCopy {
  /** "dental clinic" — used in "a single dental clinic" */
  unitShort: string
  /** the people the site is for: "patients", "clients" */
  customers: string
  /** one person on the team: "dentist", "lawyer" */
  member: string
  /** name used until the owner gives one */
  defaultName: string
  /** search query when there's no name */
  searchHint: string
  /** first message before the goal question */
  opening: string
  justBuild: string
  /** reply when the owner taps You decide on the goal question */
  decideGoal: string
  /** why the default was chosen, by slot */
  decideReason: Partial<Record<Slot, string>>
  /** plan-card line labels, in order */
  planLines: { slot: AnswerSlot; label: string }[]
  /** style presets offered on the plan card */
  presets: Record<string, string>
}

/** the niche's own reasoning; the engine calls these instead of hard-coding one niche */
export interface PlaybookLogic {
  /** reads what the prompt already answers */
  read: (prompt: string, set: (slot: AnswerSlot, value: string) => void) => void
  /** goal signals in the prompt (also used for goals typed later) */
  goalSignals: [string, RegExp][]
  /** drops goals that are only details, and orders by intent */
  refineGoals: (goals: string[], prompt: string, answers: Partial<Record<AnswerSlot, { value: string }>>) => string[]
  /** asks for things the product can't do yet */
  unsupported: (prompt: string) => string[]
  /** "more patients", "more clients" */
  vague: RegExp
  /**
   * The next counted question (Q2–Q4), or null. `ask` returns the question when it may still be asked.
   * Gates (Q0, QJ) and the goal question are handled by the engine.
   */
  next: (st: import("./engine").PlaybookState, pb: Playbook, ask: (q: Question | undefined) => Question | null) => Question | null
  scenarios: (st: import("./engine").PlaybookState) => string[]
  preset: (st: import("./engine").PlaybookState) => string
  /** the main goal's own module — declining it changes the main button */
  keyModule: Record<string, string>
  /** the main button when the key module isn't added */
  fallbackFor?: (goal: string) => string | undefined
  automations: (has: (id: string) => boolean, st: import("./engine").PlaybookState) => string[]
  /** goal chips order, before the scenario's own goals are moved first */
  goalOrder: string[]
  /** the gate after Q0 (QJ for lawyers): asked first when the slot isn't answered */
  gate?: Slot
  /** whether a module may be offered under the rules followed (null = allowed, otherwise why not) */
  restricted?: (st: import("./engine").PlaybookState, m: ModuleDef) => string | null
  /** the business name, read from a prompt that names it without "called" */
  titledName?: RegExp
}

export interface Playbook {
  id: NicheId
  name: string
  version: string
  /** what one site is, e.g. "dental practice" */
  unit: string
  signals: RegExp
  /** prompts that belong somewhere else (directories, labs…) */
  generic: RegExp
  directory: RegExp
  /** another niche named in the same prompt (asks whether it's two sites) */
  otherNiche: RegExp
  scenarios: Scenario[]
  questions: Question[]
  goals: Goal[]
  /** goal used for "just build it" and "You decide" */
  defaultGoal: string
  defaultSecondary: string
  modules: ModuleDef[]
  guardrails: GuardrailRule[]
  /** standing emergency or safety notice for contact and urgent pages */
  emergencyNotice: string
  /** jurisdiction overlay applied on top of the playbook (lawyers: the default, until the owner says where) */
  market: Market
  /** answers used on "You decide", by slot */
  defaults: Partial<Record<AnswerSlot, string>> & { style: string }
  copy: PlaybookCopy
  logic: PlaybookLogic
}
