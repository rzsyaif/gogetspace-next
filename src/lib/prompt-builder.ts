/**
 * The homepage prompt builder: a simplified set of Quick Questions inside the prompt box. It reads what the
 * prompt already says (the same way the agent will) and offers the rest as blanks — business type, name, city,
 * main goal, the niche's speciality, a style and a logo. Picking a blank writes it into the prompt as a phrase
 * the agent understands, so the prompt stays the one thing that is sent.
 */
import { DENTAL_THEMES, LAW_THEMES, THEMES, type SiteTheme } from "@/lib/bakti/themes"
import { detect, initialPlaybookState } from "@/lib/playbooks/engine"
import type { NicheId } from "@/lib/playbooks/types"

export type SlotId = "type" | "name" | "place" | "goal" | "detail" | "style" | "logo"

export interface Choice {
  id: string
  label: string
  /** how it's written into the prompt */
  phrase: string
}

export interface BusinessType extends Choice {
  niche: NicheId | null
  /** reads the type back from a prompt (niche types use the playbook detection) */
  signal?: RegExp
}

export const BUSINESS_TYPES: BusinessType[] = [
  { id: "dentist", niche: "dentist", label: "Dental clinic", phrase: "a dental clinic" },
  { id: "lawyer", niche: "lawyer", label: "Law firm", phrase: "a law firm" },
  { id: "lab", niche: null, label: "Clinical lab", phrase: "a clinical laboratory", signal: /\b(clinical )?lab(oratory)?\b|\bblood tests?\b/i },
  { id: "clinic", niche: null, label: "Medical clinic", phrase: "a medical clinic", signal: /\b(medical|gp|family doctor'?s?|polyclinic) (clinic|practice)\b|\bdoctor'?s? (clinic|practice)\b/i },
  { id: "physio", niche: null, label: "Physiotherapy", phrase: "a physiotherapy practice", signal: /\bphysio(therap\w*)?\b/i },
  { id: "accountant", niche: null, label: "Accounting firm", phrase: "an accounting firm", signal: /\baccount(ant|ing)s?\b|\btax (advisers?|agents?)\b/i },
]

/** the main goal, worded so the agent reads the same goal back */
const NICHE_GOALS: Record<NicheId, Choice[]> = {
  dentist: [
    { id: "G1", label: "More online bookings", phrase: "so patients can book appointments online" },
    { id: "G2", label: "Consultations for bigger treatments", phrase: "to get consultation requests for bigger treatments" },
    { id: "G3", label: "Emergency patients", phrase: "to handle emergencies and same-day patients" },
    { id: "G4", label: "Patients coming back", phrase: "to keep patients coming back for check-ups" },
    { id: "G6", label: "Be found and trusted", phrase: "so we're found and trusted online" },
  ],
  lawyer: [
    { id: "LG1", label: "Consultations booked online", phrase: "so clients can book consultations online" },
    { id: "LG2", label: "Qualified case enquiries", phrase: "to get qualified case enquiries" },
    { id: "LG3", label: "Urgent matters", phrase: "to handle urgent matters" },
    { id: "LG5", label: "Business clients", phrase: "to win business clients and retainers" },
    { id: "LG7", label: "Be found and trusted", phrase: "so we're found and trusted online" },
  ],
}

const GENERAL_GOALS: (Choice & { signal: RegExp })[] = [
  { id: "book", label: "Online bookings", phrase: "so customers can book online", signal: /\bbook(ings?)? online\b|\bonline booking/i },
  { id: "enquire", label: "More enquiries", phrase: "to get more enquiries", signal: /\b(more )?enquir(y|ies)\b|\binquir(y|ies)\b/i },
  { id: "trust", label: "Be found and trusted", phrase: "so we're found and trusted online", signal: /\bfound and trusted\b|\bbe found\b/i },
  { id: "info", label: "Share prices and services", phrase: "to show our services and prices", signal: /\bservices and prices\b|\bprice list\b/i },
]

/** what kind of dentistry / which area of law — the playbook's own speciality question */
const NICHE_DETAIL: Record<NicheId, { label: string; slot: "focus"; choices: Choice[] }> = {
  dentist: {
    label: "Speciality",
    slot: "focus",
    choices: [
      { id: "general", label: "General or family", phrase: "for general and family dentistry" },
      { id: "ortho", label: "Orthodontics", phrase: "mostly braces and aligners" },
      { id: "cosmetic", label: "Cosmetic and implants", phrase: "mostly cosmetic dentistry and implants" },
      { id: "pediatric", label: "Children", phrase: "for children" },
    ],
  },
  lawyer: {
    label: "Area of law",
    slot: "focus",
    choices: [
      { id: "family", label: "Family", phrase: "working in family law" },
      { id: "criminal", label: "Criminal", phrase: "working in criminal law" },
      { id: "business", label: "Business", phrase: "working in business and contract law" },
      { id: "property", label: "Property", phrase: "working in property law" },
      { id: "immigration", label: "Immigration", phrase: "working in immigration law" },
      { id: "estates", label: "Wills and estates", phrase: "working on wills and probate" },
    ],
  },
}

export interface Reading {
  type: BusinessType | null
  name: string | null
  place: string | null
  goal: Choice | null
  detail: Choice | null
  style: SiteTheme | null
}

const NAME = /\b(?:named|called)\s+["“']?([A-Za-z][\w&'’.-]*(?:\s+[A-Za-z&][\w&'’.-]*){0,4})/i
const PLACE = /\b(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/

export function goalChoices(type: BusinessType | null): Choice[] {
  return type?.niche ? NICHE_GOALS[type.niche] : GENERAL_GOALS
}
export function detailOf(type: BusinessType | null) {
  return type?.niche ? NICHE_DETAIL[type.niche] : null
}
export function styleChoices(type: BusinessType | null): SiteTheme[] {
  return type?.niche === "dentist" ? DENTAL_THEMES : type?.niche === "lawyer" ? LAW_THEMES : THEMES.slice(0, 4)
}

/** what the prompt already tells the agent */
export function read(text: string): Reading {
  const niche = text.trim() ? detect(text).niche : null
  const type = niche ? BUSINESS_TYPES.find((t) => t.niche === niche)! : (BUSINESS_TYPES.find((t) => t.signal?.test(text)) ?? null)
  const st = niche ? initialPlaybookState(text) : null
  const name = text.match(NAME)?.[1].replace(/\s+(in|at|on|for|with|so|to)\b.*$/i, "").replace(/[.,]$/, "").trim() ?? null
  const place = text.match(PLACE)?.[1] ?? null
  const goals = goalChoices(type)
  const goal = st
    ? (goals.find((g) => g.id === (st.goals[0] ?? st.candidates?.goals[0])) ?? null)
    : (GENERAL_GOALS.find((g) => g.signal.test(text)) ?? null)
  const d = detailOf(type)
  // a lawyer can name several areas; the one picked here wins, then the first the agent read
  const areas = st?.answers.focus?.value.split(",") ?? []
  const detail = d ? (d.choices.find((c) => text.includes(c.phrase)) ?? d.choices.find((c) => areas.includes(c.id)) ?? null) : null
  const style = [...styleChoices(type), ...THEMES, ...DENTAL_THEMES, ...LAW_THEMES].find((t) => new RegExp(`\\b${t.name.replace(/[&]/g, "\\$&")} style\\b`, "i").test(text)) ?? null
  return { type, name, place: place && place !== name ? place : null, goal, detail, style }
}

/** the blanks still open, in the order the template reads */
export function missing(r: Reading, logo: boolean): SlotId[] {
  const out: SlotId[] = []
  if (!r.type) out.push("type")
  if (!r.name) out.push("name")
  if (!r.place) out.push("place")
  if (!r.goal) out.push("goal")
  if (detailOf(r.type) && !r.detail) out.push("detail")
  if (!r.style) out.push("style")
  if (!logo) out.push("logo")
  return out
}

/** the template, as shown when the box is empty */
export const TEMPLATE = "Build a website for [business type] named [business name] in [city], so [main goal]…"

/** writes a picked blank into the prompt */
export function apply(text: string, slot: Exclude<SlotId, "logo">, value: string): string {
  const base = text.trim().replace(/[.…]+$/, "")
  const join = (phrase: string, sep = " ") => (base ? `${base}${sep}${phrase}` : phrase)
  switch (slot) {
    case "type": {
      const t = BUSINESS_TYPES.find((x) => x.id === value)!
      return base ? `Build a website for ${t.phrase}. ${base}` : `Build a website for ${t.phrase}`
    }
    case "name":
      return join(`named ${value.trim()}`)
    case "place":
      return join(`in ${value.trim()}`)
    case "goal":
    case "detail":
      return join(value, ", ")
    case "style":
      return join(`in the ${value} style`, ", ")
  }
}

/** the next blank's preview, shown faintly after the cursor (Tab fills it) */
export function ghostFor(slot: SlotId | undefined, text: string): string {
  if (!slot || !text.trim()) return ""
  const lead = /[\s]$/.test(text) ? "" : " "
  switch (slot) {
    case "type":
      return ""
    case "name":
      return `${lead}named [business name]`
    case "place":
      return `${lead}in [city]`
    case "goal":
      return `, [main goal]`
    case "detail":
      return `, [speciality]`
    case "style":
      return `, in the [style] style`
    case "logo":
      return ""
  }
}
