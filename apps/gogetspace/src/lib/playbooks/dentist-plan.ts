/**
 * Turns the dentist playbook's answers into the three things the owner reviews: the brief, the page plan and
 * the order of the style options. Only modules the owner added get pages or features; declined ones appear
 * under "Add later" in the brief and nowhere else.
 */
import type { BriefSection, OpenQuestion } from "@/lib/generation/brief"
import type { PageNode } from "@/lib/bakti/sitemap"
import { DENTIST } from "./dentist"
import { added, addLater, automationsOf, goalLabel, mainButton, monthlyTotal, optionLabel, scenariosOf, type PlaybookState } from "./engine"

let n = 0
const item = (text: string) => ({ id: `d${++n}`, text })

/** what the web search found for the demo clinic */
export const RAHMA = {
  name: "Rahma Family Dental",
  place: "Air Itam, Penang",
  rating: "4.8★ from 186 Google reviews",
  dentists: ["Dr. Nur Rahmah Azman", "Dr. Daniel Lim"],
  hours: "Mon–Fri 9 am – 6 pm · Sat 9 am – 1 pm",
}

export const clinicName = (st: PlaybookState) => st.business ?? "Your Dental Clinic"
export const isDemoClinic = (st: PlaybookState) => /rahma/i.test(st.business ?? "")
export const domainFor = (st: PlaybookState) =>
  `${clinicName(st)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 3)
    .join("-")}.get.space`

/* ---------------- treatments (§6.3 starter library, by focus) ---------------- */

export interface Treatment {
  id: string
  title: string
  slug: string
  /** 'from' price in RM for routine care; null = "Ask us" (specialty, priced after an exam) */
  from: number | null
  range?: [number, number]
  visits: string
  short: string
}

export const TREATMENTS: Record<string, Treatment> = {
  checkup: { id: "checkup", title: "Check-up and cleaning", slug: "check-up-and-cleaning", from: 80, range: [80, 150], visits: "1 visit, 45 minutes", short: "An exam, scaling and polishing, and advice on looking after your teeth." },
  fillings: { id: "fillings", title: "Fillings", slug: "fillings", from: 90, range: [90, 250], visits: "1 visit", short: "Tooth-coloured fillings to repair decay or small chips." },
  rootcanal: { id: "rootcanal", title: "Root canal treatment", slug: "root-canal-treatment", from: 600, range: [600, 1500], visits: "1 to 3 visits", short: "Saves a tooth whose nerve is infected or inflamed." },
  crowns: { id: "crowns", title: "Crowns and bridges", slug: "crowns-and-bridges", from: null, range: [900, 2500], visits: "2 visits", short: "Caps and bridges to restore broken or missing teeth." },
  whitening: { id: "whitening", title: "Teeth whitening", slug: "teeth-whitening", from: 650, range: [650, 1200], visits: "1 visit, or take-home trays", short: "Professional whitening, in the clinic or at home." },
  extraction: { id: "extraction", title: "Tooth extraction", slug: "tooth-extraction", from: 100, range: [100, 600], visits: "1 visit", short: "Gentle removal when a tooth can't be saved, including wisdom teeth." },
  braces: { id: "braces", title: "Braces", slug: "braces", from: null, range: [4500, 9000], visits: "Monthly visits for 18–24 months", short: "Metal or ceramic braces for straighter teeth and a healthier bite." },
  aligners: { id: "aligners", title: "Clear aligners", slug: "clear-aligners", from: null, range: [8000, 16000], visits: "Check-ins every 6–8 weeks", short: "Nearly invisible aligners you can take out to eat and brush." },
  retainers: { id: "retainers", title: "Retainers", slug: "retainers", from: 450, range: [450, 1200], visits: "1 to 2 visits", short: "Keep your teeth in place after braces or aligners." },
  veneers: { id: "veneers", title: "Veneers", slug: "veneers", from: null, range: [1200, 2800], visits: "2 to 3 visits", short: "Thin porcelain shells that change the shape or colour of front teeth." },
  implants: { id: "implants", title: "Dental implants", slug: "dental-implants", from: null, range: [5500, 9000], visits: "Several visits over 3–6 months", short: "A fixed replacement for a missing tooth." },
  bonding: { id: "bonding", title: "Bonding", slug: "bonding", from: 250, range: [250, 600], visits: "1 visit", short: "Tooth-coloured resin to fix chips and small gaps." },
  firstvisit: { id: "firstvisit", title: "Your child's first visit", slug: "first-visit", from: 60, range: [60, 100], visits: "1 visit, 30 minutes", short: "A calm, playful first check-up so your child feels at home." },
  fluoride: { id: "fluoride", title: "Fluoride treatment", slug: "fluoride-treatment", from: 50, range: [50, 90], visits: "1 visit", short: "Strengthens young teeth against decay." },
  sealants: { id: "sealants", title: "Fissure sealants", slug: "fissure-sealants", from: 60, range: [60, 120], visits: "1 visit", short: "A thin coating that protects back teeth from cavities." },
}

const BY_FOCUS: Record<string, string[]> = {
  general: ["checkup", "fillings", "rootcanal", "crowns", "whitening"],
  ortho: ["braces", "aligners", "retainers", "checkup"],
  cosmetic: ["whitening", "veneers", "implants", "bonding"],
  pediatric: ["firstvisit", "checkup", "fluoride", "sealants"],
}

export const treatmentsFor = (st: PlaybookState) => (BY_FOCUS[st.answers.focus?.value ?? "general"] ?? BY_FOCUS.general).map((id) => TREATMENTS[id])

export function priceText(t: Treatment, mode: string) {
  if (mode === "ask") return "Ask us"
  if (mode === "range" && t.range) return `RM ${t.range[0].toLocaleString("en")} – ${t.range[1].toLocaleString("en")}`
  if (mode === "exact" && t.from !== null) return `RM ${t.from.toLocaleString("en")}`
  return t.from !== null ? `From RM ${t.from.toLocaleString("en")}` : "Ask us"
}

/* ---------------- sitemap ---------------- */

const page = (id: string, title: string, slug: string, purpose: string, sections: string[], children?: PageNode[]): PageNode => ({ id, title, slug, purpose, sections, children })

export function dentistSitemap(st: PlaybookState): PageNode {
  const has = (m: string) => st.decisions[m] === "added"
  const sc = scenariosOf(st)
  const pediatric = st.answers.focus?.value === "pediatric"
  const insurance = has("insurance") || st.answers.insurance?.value === "list"
  const treatments = treatmentsFor(st).map((t) => page(`t-${t.id}`, t.title, t.slug, t.short, ["What it is", "Who it's for", "What happens", "How long it takes", "Comfort", "Aftercare", "Price or estimate note", "FAQ", "Book or ask"]))
  const children: PageNode[] = [
    page("treatments", "Treatments", "treatments", "Every treatment, grouped, with a price or estimate note", ["Page header", "Treatments by category", "Price note"], treatments),
    page("dentists", "Our dentists", "our-dentists", "Who your patients will see, their registration and focus", ["Page header", "Dentist profiles", "Book with a dentist"]),
    page("new-patients", pediatric ? "Your child's first visit" : "New patients", "new-patients", "What to bring and what happens on the day", ["Page header", "What to bring", "Step by step", "Forms and payment", "Nervous patients"]),
    page("prices", insurance ? "Prices and insurance" : "Prices", "prices", "Price table with the estimate note", insurance ? ["Page header", "Price table", "Insurers and panels", "Installments"] : ["Page header", "Price table", "Installments"]),
    page("contact", "Contact and locations", "contact", "Address, map, hours, phone and WhatsApp", ["Page header", "Map and hours", "Phone and WhatsApp", "Emergency notice", "Contact form"]),
    page("faq", "FAQ", "faq", "Cost, pain, children, insurance and cancellations", ["Page header", "Questions and answers"]),
  ]
  if (has("appointments")) children.splice(1, 0, page("book", "Book an appointment", "book", "Pick a treatment, a time and add your details", ["Page header", "Booking steps", "What happens next"]))
  if (has("estimates")) children.splice(1, 0, page("consultation", "Request a consultation", "consultation", "Tell us what you'd like done and get an estimate", ["Page header", "Request form", "What happens next"]))
  if (has("emergency")) children.splice(1, 0, page("emergency", "Emergency dental care", "emergency", "Call or WhatsApp now, same-day slots and the urgent-care notice", ["Urgent-care notice", "Call and WhatsApp", "Same-day slots", "What counts as an emergency"]))
  if (has("branches")) children.push(page("branches", "Our branches", "branches", "A page for each branch, with its dentists and hours", ["Page header", "Branches", "Dentists at each branch"]))
  if (has("gallery") && st.consent.includes("gallery")) children.push(page("before-after", "Before and after", "before-and-after", "Real results, shown with patient consent", ["Page header", "Photo pairs", "Results vary note"]))
  if (sc.includes("S2") && !pediatric) children.push(page("kids", "Kids' dentistry", "kids", "Check-ups and care for children", ["Page header", "First visit", "Treatments for children"]))
  children.push(
    page("privacy", "Privacy Policy", "privacy", "How patient data is handled (PDPA 2010)", ["Page header", "Legal sections"]),
    page("terms", "Terms and Conditions", "terms", "Booking, cancellation and website terms", ["Page header", "Legal sections"]),
  )
  return page("home", "Homepage", "", "A specific promise, the main button and how a first visit works", homeSections(st), children)
}

function homeSections(st: PlaybookState) {
  const has = (m: string) => st.decisions[m] === "added"
  return [
    "Hero with the main button",
    "Trust strip",
    ...(has("emergency") ? ["Emergency banner"] : []),
    "Popular treatments",
    "How a first visit works",
    ...(has("reviews") ? ["Reviews"] : []),
    "Our dentists",
    "Hours and location",
    "FAQ",
  ]
}

/** which pages a plan builds first (Starter builds five) */
export function dentistPriority(st: PlaybookState): string[] {
  const has = (m: string) => st.decisions[m] === "added"
  const first = has("emergency") ? "emergency" : has("estimates") && st.goals[0] === "G2" ? "consultation" : has("appointments") ? "book" : null
  return ["home", ...(first ? [first] : []), "treatments", "new-patients", "contact", "dentists", "prices", "faq", ...treatmentsFor(st).map((t) => `t-${t.id}`), "consultation", "book", "emergency", "branches", "before-after", "kids", "privacy", "terms"]
}

/* ---------------- brief ---------------- */

const SCALE_TEXT: Record<string, string> = { solo: "one dentist", dentists: "several dentists at one clinic", branches: "several branches" }
const FOCUS_TEXT: Record<string, string> = { general: "general and family dental clinic", ortho: "orthodontic clinic", cosmetic: "cosmetic and implant dental clinic", pediatric: "children's dental clinic" }
const PRICE_TEXT: Record<string, string> = {
  exact: "Exact prices for each treatment, with “final price confirmed after examination”",
  from: "“From” prices for routine care, “Ask us” for specialty treatments, with “final price confirmed after examination”",
  range: "Price ranges for each treatment, with “final price confirmed after examination”",
  ask: "No prices on the site — patients ask for an estimate. The FAQ still answers “how much will it cost?”",
}

/** wraps a value in [brackets] (shown as a guess to confirm) unless the owner or the prompt said it */
const guess = (v: string, source?: string) => (source === "owner" || source === "prompt" ? v : `[${v}]`)

/** the dentists in the brief: from the owner's file or list when given, otherwise placeholders to fill in */
function teamItems(st: PlaybookState, demo: boolean) {
  const reg = DENTIST.market.registration
  const team = st.team
  if (team?.file) return [item(`Dentists and ${reg}s: from your file “${team.file.name}”`)]
  const people = (team?.people ?? []).filter((p) => p.name.trim())
  if (people.length) {
    const missing = people.filter((p) => !p.reg?.trim()).length
    return [
      item(`Dentists: ${people.map((p) => `${p.name.trim()}${p.branch?.trim() ? ` (${p.branch.trim()})` : ""}`).join(", ")}`),
      missing
        ? item(`Registration: ${people.filter((p) => p.reg?.trim()).map((p) => `${p.name.trim()} — ${p.reg!.trim()}`).join("; ")}${people.length > missing ? "; " : ""}[${reg} for ${missing === people.length ? "each dentist" : `the other ${missing}`} — you'll add these; I never make them up]`)
        : item(`Registration: ${people.map((p) => `${p.name.trim()} — ${p.reg!.trim()}`).join("; ")}`),
    ]
  }
  return [
    item(demo ? `Dentists: [${RAHMA.dentists.join(" and ")}]` : "Dentists: [names and roles — you'll add these]"),
    item(`Registration: each dentist's ${reg} — [you'll add these; I never make them up]`),
  ]
}

export function dentistBrief(st: PlaybookState): BriefSection[] {
  const a = st.answers
  const demo = isDemoClinic(st)
  const name = st.business ? st.business : "[Your clinic name]"
  const place = st.place ?? (demo ? RAHMA.place : null)
  const kept = added(st).filter((m) => !m.core)
  const later = addLater(st)
  const btn = mainButton(st)
  const total = monthlyTotal(st)
  const sc = scenariosOf(st)

  return [
    {
      id: "about",
      title: "About the clinic",
      items: [
        item(`Name: ${name}`),
        item(`What it is: a ${guess(FOCUS_TEXT[a.focus?.value ?? "general"], a.focus?.source)}${place ? ` in ${guess(place, st.place ? "prompt" : undefined)}` : " in [your area]"}`),
        item(`Size: ${guess(SCALE_TEXT[a.scale?.value ?? "solo"], a.scale?.source === "search" ? undefined : a.scale?.source)}${a.scale?.source === "search" ? " — found online" : ""}`),
        ...teamItems(st, demo),
        item(demo ? `Opening hours: [${RAHMA.hours}]` : "Opening hours: [Call for opening hours] until you add them"),
        ...(demo ? [item(`Reviews: ${RAHMA.rating} — only real, attributable reviews are shown`)] : []),
      ],
    },
    {
      id: "goals",
      title: "Goals and main button",
      items: [
        item(`Main goal: ${goalLabel(st.goals[0])}`),
        ...st.goals.slice(1).map((g) => item(`Also: ${goalLabel(g)}`)),
        item(`Main button: “${btn.label}”${btn.fallback ? ` (because ${btn.module?.name} isn't added)` : ""}. Second button: call or message on WhatsApp`),
        ...(st.unsupported.length ? [item(`Not supported yet: ${st.unsupported.join(", ")} — the site can link to your existing shop`)] : []),
      ],
    },
    {
      id: "audience",
      title: "Who the site is for",
      items: [
        item(sc.includes("S3") ? "Parents looking for a calm first dental visit for their child" : "Local patients looking for a dentist they can trust, and what it will cost"),
        ...(sc.includes("S4") || sc.includes("S5") ? [item("People weighing up bigger treatments who want a clear plan and price before committing")] : []),
        ...(sc.includes("S6") ? [item("People in pain today who need to reach someone quickly")] : []),
        ...(sc.includes("S7") ? [item("Patients choosing a branch or a specific dentist")] : []),
        ...(sc.includes("S8") ? [item("Companies and insured patients checking coverage")] : []),
        item("Nervous patients who want to know what will happen before they come in"),
      ],
    },
    {
      id: "tools",
      title: "Tools on the site",
      items: [
        item("Included free: Services and Prices, Contact and Locations, Enquiry inbox"),
        ...kept.map((m) => item(`${m.name}${m.price ? ` — $${m.price}/month` : " — free"}: ${m.included[0].toLowerCase()}`)),
        ...(kept.length ? [item(`Add-ons total: $${total}/month, charged from when you publish`)] : []),
        ...(automationsOf(st).length ? [item(`Automatic messages: ${automationsOf(st).join(", ")} — you approve every template before it goes live`)] : []),
        ...(later.length ? [item(`Add later: ${later.map((m) => m.name).join(", ")}`)] : []),
      ],
    },
    {
      id: "treatments",
      title: "Treatments and prices",
      items: [
        item(`Treatments: [${treatmentsFor(st).map((t) => t.title).join(", ")}] — remove any you don't offer; nothing unconfirmed is published`),
        item(`Prices: ${PRICE_TEXT[a.prices?.value ?? "from"]}`),
        ...(a.prices?.value === "ask"
          ? []
          : st.priceList?.file
            ? [item(`Price list: from your file “${st.priceList.file.name}” — every treatment uses these prices`)]
            : st.priceList?.text
              ? [item(`Price list: ${st.priceList.text.split("\n").filter(Boolean).join("; ")}`)]
              : [item("Price list: [I'll draft typical prices for each treatment — check them before you publish]")]),
        ...(a.insurance?.value === "list" ? [item("Insurance: [the insurers and company panels you accept]")] : []),
      ],
    },
    {
      id: "tone",
      title: "Tone and what the site won't say",
      items: [
        item(sc.includes("S5") ? "Tone: refined and confident, plain words, short sentences" : sc.includes("S3") ? "Tone: warm and playful for parents, calm and clear" : "Tone: warm, calm, plain language, short sentences, no jargon"),
        item("No “painless”, “best dentist”, “No. 1”, guarantees or invented statistics — only facts you can prove"),
        ...st.notes.map((x) => item(x)),
        ...(st.decisions.emergency === "added" || sc.includes("S6") ? [item(`Emergency notice on the contact and emergency pages: call ${DENTIST.market.emergencyNumber} for severe swelling, trouble breathing, heavy bleeding or a facial injury`)] : []),
        item("Languages: [English and Bahasa Malaysia]"),
      ],
    },
    {
      id: "privacy",
      title: "Forms and privacy",
      items: [
        item("Booking form: name, WhatsApp number, email (optional), first visit or returning, who the patient is, reason for visit, preferred time"),
        item("Never on a public form: medical history, medications, allergies or photos of teeth"),
        item(`Consent line on every form, in line with the ${DENTIST.market.dataLaw}`),
        ...(st.answers.focus?.value === "pediatric" || sc.includes("S2") ? [item("Parent or guardian details and consent when the patient is a child")] : []),
      ],
    },
  ]
}

export function dentistQuestions(st: PlaybookState): OpenQuestion[] {
  const q: OpenQuestion[] = []
  if (!isDemoClinic(st)) q.push({ id: "dq-hours", q: "What are your opening hours?", answer: "" })
  q.push({ id: "dq-mdc", q: `What is each dentist's ${DENTIST.market.registration}?`, answer: "" })
  if (st.answers.insurance?.value === "list") q.push({ id: "dq-ins", q: "Which insurers and company panels do you accept?", answer: "" })
  q.push({ id: "dq-photos", q: "Do you have photos of the clinic and the team we can use instead of stock images?", answer: "" })
  return q
}

/** one-line labels for the plan card */
export const presetName = (id: string) => ({ "calm-clinical": "Calm clinical", "warm-family": "Warm family", "modern-premium": "Modern premium" })[id] ?? id
export const answerText = (slot: "focus" | "scale" | "prices" | "emergency" | "insurance", st: PlaybookState) => optionLabel(slot, st.answers[slot]?.value ?? "")

/** everything the flow needs from the dentist plan, behind the same shape as other niches */
export const DENTIST_PLAN = {
  brief: dentistBrief,
  sitemap: dentistSitemap,
  priority: dentistPriority,
  questions: dentistQuestions,
  name: clinicName,
  isDemo: isDemoClinic,
  domain: domainFor,
}
