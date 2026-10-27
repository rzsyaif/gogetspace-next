/**
 * The brief the agent drafts for Bakti Analisa. Text in [square brackets] is a guess the agent made
 * and wants confirmed; it renders as a highlighted chip until the person confirms or changes it.
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
    title: "About the business",
    items: [
      item("Name: Bakti Analisa"),
      item("What it is: a private clinical laboratory in [George Town], Penang"),
      item("Locations: [1 main lab + collection centres in Bayan Lepas and Butterworth]"),
      item("Credentials: [MS ISO 15189 accredited; licensed under the Private Healthcare Facilities and Services Act]"),
      item("Established: [2008]"),
    ],
  },
  {
    id: "audience",
    title: "Who the site is for",
    items: [
      item("Patients who need a blood test or health check, either on their own or with a doctor’s referral."),
      item("Doctors and clinics who send samples to the lab."),
      item("HR teams and companies that need pre-employment or annual staff screening."),
    ],
  },
  {
    id: "services",
    title: "Services to feature",
    items: [
      item("Routine blood and urine tests: full blood count, glucose, cholesterol, kidney and liver function"),
      item("Health screening packages: [Basic, Comprehensive, Women’s, Men’s, Senior]"),
      item("Specialist tests: [hormones, allergy panels, tumour markers]"),
      item("Pre-employment and corporate screening, including [on-site collection]"),
      item("[Home sample collection]"),
      item("Online results"),
    ],
  },
  {
    id: "goals",
    title: "What the website should achieve",
    items: [
      item("Turn “I need a blood test” into a booked visit or a WhatsApp enquiry."),
      item("Give doctors and HR teams enough confidence to send their work to Bakti Analisa."),
      item("Cut down repeat phone calls about test preparation, opening hours and results."),
    ],
  },
  {
    id: "tone",
    title: "Tone & Language",
    items: [
      item("Tone: reassuring, clear and professional. Plain language for patients and precise detail for doctors."),
      item("Languages: [English and Bahasa Malaysia; Chinese optional]"),
    ],
  },
  {
    id: "features",
    title: "Must-have features",
    items: [
      item("Online booking"),
      item("WhatsApp button"),
      item("Test and package list with prices"),
      item("Preparation instructions for each test"),
      item("Map and opening hours for each location"),
      item("Link to the results portal"),
    ],
  },
]

export const DEFAULT_QUESTIONS: OpenQuestion[] = [
  { id: "q1", q: "Should prices be shown publicly, or only on request?", answer: "" },
  { id: "q2", q: "Do you already use a booking or results system we should link to?", answer: "" },
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
