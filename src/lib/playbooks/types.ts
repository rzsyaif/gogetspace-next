/**
 * The shape of a niche playbook: everything the agent needs to plan a website for one kind of professional
 * (detection, scenarios, the questions it may ask, goals and the modules they bring, defaults, guardrails and
 * its own wording). Playbooks are data; the engine in ./engine.ts reads them, so adding a niche is adding a file.
 */

export type NicheId = "dentist"

/** an answer slot the agent fills, from the prompt, the web search, the owner or its own default */
export type Slot = "build" | "goals" | "focus" | "scale" | "prices" | "emergency" | "insurance"
export type Source = "prompt" | "search" | "owner" | "default"

export interface Option {
  id: string
  label: string
}

export interface Question {
  id: "Q0" | "Q1" | "Q2" | "Q3" | "Q4"
  slot: Slot
  /** the follow-up variant for Q4 */
  variant?: "prices" | "emergency" | "insurance"
  text: string
  helper?: string
  options: Option[]
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
  /** which Q4 variant this goal asks, if any */
  followUp?: "prices" | "emergency" | "insurance" | "scale"
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
  /** standing emergency notice for contact and emergency pages */
  emergencyNotice: string
  /** jurisdiction overlay applied on top of the playbook */
  market: { country: string; regulator: string; registration: string; emergencyNumber: string; dataLaw: string }
  defaults: { focus: string; scale: string; prices: string; emergency: string; insurance: string; style: string }
}
