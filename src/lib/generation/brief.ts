/**
 * The brief the agent drafts for a dental practice.
 * Text in [square brackets] is a guess the agent made and wants confirmed;
 * it renders as a highlighted chip until the person confirms or changes it.
 */

export interface BriefItem {
  id: string
  text: string
}
export interface BriefSection {
  id: string
  title: string
  items: BriefItem[]
}
export interface OpenQuestion {
  id: string
  q: string
  answer: string
}

let n = 0
const item = (text: string): BriefItem => ({ id: `b${++n}`, text })

export const DEFAULT_BRIEF: BriefSection[] = [
  {
    id: "about",
    title: "About the practice",
    items: [
      item("Name: [Your Dental Clinic]"),
      item("What it is: a [general] dental practice in [your city]"),
      item("Specialty: [general and family dentistry]"),
      item("Credentials: [registered dentist; member of the Malaysian Dental Association]"),
      item("Established: [2015]"),
    ],
  },
  {
    id: "audience",
    title: "Who the site is for",
    items: [
      item("Patients looking for a dentist nearby — from first-time visitors to regular check-up patients."),
      item("Parents booking dental care for their children."),
      item("Adults considering cosmetic or orthodontic treatment."),
    ],
  },
  {
    id: "services",
    title: "Treatments to feature",
    items: [
      item("General: check-up and exam, teeth cleaning, fillings, extractions"),
      item("Cosmetic: [teeth whitening, veneers, bonding]"),
      item("Orthodontics: [braces, clear aligners, retainers]"),
      item("Restorative: [crowns, bridges, dentures]"),
      item("[Root canal treatment]"),
      item("[Dental implants]"),
    ],
  },
  {
    id: "goals",
    title: "What the website should achieve",
    items: [
      item("Turn visitors into booked appointments — online or by phone."),
      item("Build trust with real dentist profiles, credentials and patient reviews."),
      item("Answer the common questions about cost, pain and what to bring."),
    ],
  },
  {
    id: "tone",
    title: "Tone & Style",
    items: [
      item("Tone: warm, calm and plain-language. Short sentences. No medical jargon without an explanation."),
      item("Style preset: [Calm clinical — white with soft blue or teal and a warm accent for buttons]"),
    ],
  },
  {
    id: "features",
    title: "Must-have features",
    items: [
      item("Online appointment booking"),
      item("Phone and WhatsApp always visible on mobile"),
      item("Treatment pages with honest comfort information"),
      item("Price guidance (from-prices or ranges)"),
      item("New-patient guide: what to bring, step-by-step first visit"),
      item("Map and opening hours"),
    ],
  },
]

export const DEFAULT_QUESTIONS: OpenQuestion[] = [
  { id: "q1", q: "How would you like prices to appear on the site?", answer: "" },
  { id: "q2", q: "Do you have an existing booking system we should link to, or should we set one up?", answer: "" },
  { id: "q3", q: "Is there a logo or brand colour we must use?", answer: "" },
]

export const ASSUMPTION = /\[([^\]]+)\]/g

export function countAssumptions(sections: BriefSection[]) {
  return sections.reduce((sum, s) => sum + s.items.reduce((a, i) => a + (i.text.match(ASSUMPTION)?.length ?? 0), 0), 0)
}

/** split item text into plain parts and [assumption] parts */
export function segments(text: string): { text: string; guess: boolean; index: number }[] {
  const out: { text: string; guess: boolean; index: number }[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(ASSUMPTION)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), guess: false, index: -1 })
    out.push({ text: m[1], guess: true, index: i++ })
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), guess: false, index: -1 })
  return out
}

/** replace the n-th [guess] in text with value (confirmed, no brackets) */
export function resolveGuess(text: string, index: number, value: string) {
  let i = 0
  return text.replace(ASSUMPTION, (m, inner: string) => (i++ === index ? value.trim() || inner : m))
}

export const stripBrackets = (text: string) => text.replace(ASSUMPTION, "$1")
