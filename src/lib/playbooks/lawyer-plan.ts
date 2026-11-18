/**
 * Turns the lawyer playbook's answers into what the owner reviews: the brief, the page plan and the open
 * questions. Like the dentist plan, only added modules get pages; everything about fees, reviews, claims and
 * confidentiality follows the rules the owner chose (or the strictest defaults).
 */
import type { BriefSection, OpenQuestion } from "@/lib/generation/brief"
import type { PageNode } from "@/lib/bakti/sitemap"
import { added, addLater, automationsOf, goalLabel, mainButton, monthlyTotal, optionLabel, restriction, scenariosOf, type PlaybookState } from "./engine"
import { JURISDICTIONS, LAWYER, jurisdictionOf } from "./lawyer"

let n = 0
const joinAnd = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)
const item = (text: string) => ({ id: `l${++n}`, text })

/** what the web search finds for the demo firm */
export const LAW_DEMO = {
  name: "Aziz & Lim Advocates",
  place: "Bangsar, Kuala Lumpur",
  rating: "4.9★ from 64 Google reviews",
  lawyers: ["Nadia Aziz", "Marcus Lim"],
  hours: "Mon–Fri 9 am – 6 pm",
  since: 2012,
}

export const firmName = (st: PlaybookState) => st.business ?? LAWYER.copy.defaultName
export const isDemoFirm = (st: PlaybookState) => /\baziz\b/i.test(st.business ?? "")
export const firmDomain = (st: PlaybookState) =>
  `${firmName(st)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 3)
    .join("-")}.get.space`

/* ---------------- practice areas (§6.3 starter library) ---------------- */

export interface PracticeArea {
  id: string
  title: string
  slug: string
  short: string
  /** who it helps */
  who: string
  matters: string[]
  /** the typical fee model, and a starting fee in the local currency for fixed-fee work (null = discussed) */
  fee: { model: string; from: number | null }
  steps: string[]
  timeline: string
}

export const AREAS: Record<string, PracticeArea> = {
  family: {
    id: "family",
    title: "Family law",
    slug: "family-law",
    short: "Divorce, custody and support, handled calmly and in confidence.",
    who: "Couples separating, parents agreeing arrangements for their children, and families planning ahead.",
    matters: ["Divorce", "Child custody", "Child support", "Prenuptial agreements"],
    fee: { model: "Fixed fee for uncontested matters; otherwise discussed at the first meeting", from: 2500 },
    steps: ["A confidential first conversation", "We explain your options and what each costs", "We prepare and file what's needed", "We keep you updated until it's settled"],
    timeline: "From a few months for uncontested matters; longer when it goes to court. Every matter is different.",
  },
  criminal: {
    id: "criminal",
    title: "Criminal defence",
    slug: "criminal-defence",
    short: "Clear, calm help when you or someone close to you is facing charges.",
    who: "People who have been arrested, charged or asked to give a statement — and their families.",
    matters: ["Criminal defence", "Bail applications", "Traffic offences"],
    fee: { model: "Discussed at the first meeting", from: null },
    steps: ["Call us — we tell you what to do now", "We meet, in person or by video", "We prepare your defence", "We represent you in court"],
    timeline: "Depends on the charge and the court's schedule.",
  },
  business: {
    id: "business",
    title: "Business and contracts",
    slug: "business-and-contracts",
    short: "Company formation, contracts and disputes for growing businesses.",
    who: "Founders, owners and companies that need contracts done right the first time.",
    matters: ["Company formation", "Contracts", "Shareholder agreements", "Business disputes"],
    fee: { model: "Fixed fees for contracts and company formation; retainers for ongoing support", from: 1500 },
    steps: ["Tell us what you need", "We send a fee proposal with scope and timeline", "We draft and review with you", "We stay on hand for what comes next"],
    timeline: "Most contracts within one to two weeks.",
  },
  property: {
    id: "property",
    title: "Property",
    slug: "property",
    short: "Buying, selling and leasing, with every step explained.",
    who: "Buyers, sellers, landlords and tenants.",
    matters: ["Buying and selling", "Leases", "Landlord and tenant disputes"],
    fee: { model: "Fixed fees for most transactions, set by the property value", from: 2000 },
    steps: ["Send us the details of the property", "We check the title and the agreement", "We handle the paperwork and stamping", "We complete and hand over"],
    timeline: "Usually two to four months for a sale.",
  },
  immigration: {
    id: "immigration",
    title: "Immigration",
    slug: "immigration",
    short: "Work visas, family visas and residency, step by step.",
    who: "People moving for work or family, and employers hiring from abroad.",
    matters: ["Work visas", "Family visas", "Permanent residency", "Citizenship"],
    fee: { model: "Fixed fee per application", from: 3000 },
    steps: ["We check which visa fits", "You get a document checklist", "We prepare a thorough application", "We follow it until the decision"],
    timeline: "Depends on the visa and the authority's processing times — we never promise a decision.",
  },
  injury: {
    id: "injury",
    title: "Personal injury",
    slug: "personal-injury",
    short: "Accident and workplace injury claims, starting with a free case evaluation.",
    who: "People injured in an accident or at work.",
    matters: ["Accident claims", "Workplace injury"],
    fee: { model: "Explained at the case evaluation, as local rules allow", from: null },
    steps: ["A free case evaluation call", "We gather records and evidence", "We negotiate with the other side", "We go to court if we must"],
    timeline: "Often a year or more. Every claim is different.",
  },
  estates: {
    id: "estates",
    title: "Wills and estates",
    slug: "wills-and-estates",
    short: "Wills, inheritance and probate, explained gently.",
    who: "Anyone planning ahead, and families dealing with an estate.",
    matters: ["Wills", "Inheritance", "Probate"],
    fee: { model: "Fixed fee for a will; estates discussed at the first meeting", from: 800 },
    steps: ["A first conversation about your wishes", "We draft your will", "We go through it with you", "You sign, and we keep it safe"],
    timeline: "A will usually takes two to three weeks.",
  },
}

const GENERAL = ["family", "property", "business", "estates"]

export const areasFor = (st: Pick<PlaybookState, "answers">): PracticeArea[] => {
  const ids = (st.answers.focus?.value ?? "general").split(",").flatMap((a) => (a === "general" ? GENERAL : [a]))
  return [...new Set(ids)].map((id) => AREAS[id]).filter(Boolean)
}

const CURRENCY: Record<string, string> = { my: "RM", sg: "S$", id: "Rp", uk: "£", au: "A$", unsure: "$" }
export const currencyOf = (jurisdiction?: string) => CURRENCY[jurisdiction ?? "unsure"] ?? "$"

export function feeText(a: PracticeArea, mode: string, jurisdiction?: string) {
  if (mode === "ask" || a.fee.from === null) return "Discussed at the first meeting"
  const amount = `${currencyOf(jurisdiction)} ${(jurisdiction === "id" ? a.fee.from * 10000 : a.fee.from).toLocaleString("en")}`
  return mode === "exact" ? amount : `From ${amount}`
}

/* ---------------- sitemap (§5, §6.1) ---------------- */

const page = (id: string, title: string, slug: string, purpose: string, sections: string[], children?: PageNode[]): PageNode => ({ id, title, slug, purpose, sections, children })

export function lawyerSitemap(st: PlaybookState): PageNode {
  const has = (m: string) => st.decisions[m] === "added"
  const areas = areasFor(st).map((a) =>
    page(`a-${a.id}`, a.title, a.slug, a.short, ["The problem in plain words", "Who we help", "What we can do", "The process", "What to bring", "Fees", "What we can't promise", "FAQ", "Book or request a fee proposal"]),
  )
  const children: PageNode[] = [
    page("areas", "Practice areas", "practice-areas", "Every area, with a line on each and how fees work", ["Page header", "Areas by category", "General information note"], areas),
    page("lawyers", "Our lawyers", "our-lawyers", "Who clients will speak to, their admission and registration", ["Page header", "Lawyer profiles", "Book with a lawyer"]),
    page("how", "How we work", "how-we-work", "The first meeting, fees, confidentiality and timelines", ["Page header", "First meeting", "How fees work", "Confidentiality", "How long things take"]),
    page("fees", "Fees", "fees", "Starting fees or fee models, and what affects the fee", ["Page header", "Fees by area", "What affects the fee", "Estimate note"]),
    page("contact", "Contact and location", "contact", "Address, hours, phone, WhatsApp and a discreet contact option", ["Page header", "Map and hours", "Phone and WhatsApp", "Discreet contact", "Contact form"]),
    page("faq", "FAQ", "faq", "Cost, confidentiality, timelines and the first meeting", ["Page header", "Questions and answers"]),
  ]
  if (has("consultations")) children.splice(1, 0, page("book", "Book a consultation", "book", "Pick a meeting type and a time; the firm confirms after a conflict check", ["Page header", "Meeting type", "Time", "Your details", "What happens next"]))
  if (has("case-enquiries")) children.splice(1, 0, page("enquiry", "Tell us about your matter", "enquiry", "A short, confidential enquiry form", ["Page header", "Enquiry form", "Confidentiality note", "What happens next"]))
  if (has("fee-proposals")) children.splice(1, 0, page("fee-proposal", "Request a fee proposal", "fee-proposal", "Businesses describe the work and get a proposal", ["Page header", "Request form", "What a proposal covers"]))
  if (has("urgent-line")) children.splice(1, 0, page("urgent", "Urgent help", "urgent", "Call or WhatsApp now, the urgent call-back form and the safety notice", ["Safety notice", "Call and WhatsApp", "Urgent call-back", "What to do now (general information)"]))
  if (has("articles")) children.push(page("articles", "Articles", "articles", "General legal information, reviewed by the lawyer", ["Page header", "Articles", "Not legal advice note"]))
  if (has("lawyers")) children.push(page("offices", "Our offices", "offices", "A page for each office, with its lawyers and hours", ["Page header", "Offices", "Lawyers at each office"]))
  children.push(
    page("privacy", "Privacy Policy", "privacy", `How enquiries are handled (${jurisdictionOf(st.answers.jurisdiction?.value).dataLaw})`, ["Page header", "Legal sections"]),
    page("terms", "Terms and Disclaimer", "terms", "Website terms, the not-legal-advice disclaimer and the lawyer-client relationship note", ["Page header", "Legal sections"]),
  )
  return page("home", "Homepage", "", "A specific promise, the main button and how a first meeting works", homeSections(st), children)
}

function homeSections(st: PlaybookState) {
  const has = (m: string) => st.decisions[m] === "added"
  return [
    "Hero with the main button",
    "Trust strip",
    ...(has("urgent-line") ? ["Urgent banner"] : []),
    "Practice areas",
    "How a first meeting works",
    ...(has("legal-reviews") ? ["Reviews"] : []),
    "Our lawyers",
    "Confidentiality note",
    "Hours and location",
    "FAQ",
  ]
}

/** which pages a plan builds first (Starter builds five) */
export function lawyerPriority(st: PlaybookState): string[] {
  const has = (m: string) => st.decisions[m] === "added"
  const first = has("urgent-line") ? "urgent" : has("case-enquiries") && st.goals[0] === "LG2" ? "enquiry" : has("fee-proposals") && st.goals[0] === "LG5" ? "fee-proposal" : has("consultations") ? "book" : null
  return ["home", ...(first ? [first] : []), "areas", "how", "contact", "lawyers", "fees", "faq", ...areasFor(st).map((a) => `a-${a.id}`), "book", "enquiry", "fee-proposal", "urgent", "articles", "offices", "privacy", "terms"]
}

/* ---------------- brief ---------------- */

const SCALE_TEXT: Record<string, string> = { solo: "one lawyer", lawyers: "several lawyers at one office", branches: "several offices" }
const CLIENT_TEXT: Record<string, string> = { individuals: "individuals and families", businesses: "businesses", both: "individuals and businesses" }
const FEE_TEXT: Record<string, string> = {
  exact: "Fees shown for fixed-fee work, with “every matter is different” and how fees work",
  from: "Starting fees for fixed-fee work, “discussed at the first meeting” for everything else, with a note on how fees work",
  range: "Fee ranges for fixed-fee work, with a note on how fees work",
  ask: "No fees on the site — they're discussed at the first meeting. The FAQ still answers “how much will it cost?”",
}
const MEETING_TEXT: Record<string, string> = {
  paid: "A paid initial consultation (30 to 60 minutes) — the fee shows once you add it",
  free: "A free first meeting (30 minutes)",
  evaluation: "A free case evaluation call (15 to 20 minutes) first",
  fixed: "A fixed-fee package, described on each practice area",
}

const guess = (v: string, source?: string) => (source === "owner" || source === "prompt" ? v : `[${v}]`)

function teamItems(st: PlaybookState, demo: boolean) {
  const reg = jurisdictionOf(st.answers.jurisdiction?.value).registration
  const team = st.team
  if (team?.file) return [item(`Lawyers and ${reg}s: from your file “${team.file.name}”`)]
  const people = (team?.people ?? []).filter((p) => p.name.trim())
  if (people.length) {
    const missing = people.filter((p) => !p.reg?.trim()).length
    return [
      item(`Lawyers: ${people.map((p) => `${p.name.trim()}${p.branch?.trim() ? ` (${p.branch.trim()})` : ""}`).join(", ")}`),
      missing
        ? item(`Registration: ${people.filter((p) => p.reg?.trim()).map((p) => `${p.name.trim()} — ${p.reg!.trim()}`).join("; ")}${people.length > missing ? "; " : ""}[${reg} for ${missing === people.length ? "each lawyer" : `the other ${missing}`} — you'll add these; I never make them up]`)
        : item(`Registration: ${people.map((p) => `${p.name.trim()} — ${p.reg!.trim()}`).join("; ")}`),
    ]
  }
  return [
    item(demo ? `Lawyers: [${LAW_DEMO.lawyers.join(" and ")}]` : "Lawyers: [names, roles and the jurisdictions they're admitted in — you'll add these]"),
    item(`Registration: each lawyer's ${reg}, where the rules require it — [you'll add these; I never make them up]`),
  ]
}

export function lawyerBrief(st: PlaybookState): BriefSection[] {
  const a = st.answers
  const demo = isDemoFirm(st)
  const name = st.business ?? "[Your firm name]"
  const place = st.place ?? (demo ? LAW_DEMO.place : null)
  const kept = added(st).filter((m) => !m.core)
  const later = addLater(st)
  const btn = mainButton(st)
  const total = monthlyTotal(st)
  const sc = scenariosOf(st)
  const jv = a.jurisdiction?.value ?? "unsure"
  const j = jurisdictionOf(jv)
  const strict = jv === "unsure"
  const reviews = !restriction(st, "legal-reviews")
  const areas = areasFor(st)

  return [
    {
      id: "about",
      title: "About the practice",
      items: [
        item(`Name: ${name}`),
        item(`What it is: a ${guess(`${joinAnd(areas.map((x) => x.title.toLowerCase()))} practice`, a.focus?.source)}${place ? ` in ${guess(place, st.place ? "prompt" : undefined)}` : " in [your city]"}`),
        item(`Size: ${guess(SCALE_TEXT[a.scale?.value ?? "solo"] ?? "one lawyer", a.scale?.source === "search" ? undefined : a.scale?.source)}${a.scale?.source === "search" ? " — found online" : ""}`),
        item(`Clients: ${guess(CLIENT_TEXT[a.clients?.value ?? "individuals"], a.clients?.source)}`),
        ...teamItems(st, demo),
        item(demo ? `Opening hours: [${LAW_DEMO.hours}]` : "Opening hours: [Call for opening hours] until you add them"),
        ...(demo && reviews ? [item(`Reviews: ${LAW_DEMO.rating} — only real, attributable reviews are shown`)] : []),
      ],
    },
    {
      id: "rules",
      title: "Rules the site follows",
      items: [
        item(strict ? "Rules followed: the strictest defaults — I don't know where you practice yet" : `Rules followed: ${j.label}, regulated by ${j.regulator}`),
        item(reviews ? "Reviews: real, attributable reviews only, with consent" : "Reviews, testimonials, promotions and case results: off"),
        item("Every page says: “This page is general information, not legal advice.”"),
        item("Beside every form and booking: “Contacting us doesn't create a lawyer-client relationship until we confirm in writing.”"),
        item(`Check these with ${j.regulator} before you publish — I apply common rules, not legal advice`),
      ],
    },
    {
      id: "goals",
      title: "Goals and main button",
      items: [
        item(`Main goal: ${goalLabel(st.goals[0])}`),
        ...st.goals.slice(1).map((g) => item(`Also: ${goalLabel(g)}`)),
        item(`Main button: “${btn.label}”${btn.fallback ? ` (because ${btn.module?.name} isn't added yet)` : ""}. Second button: call or message on WhatsApp`),
        ...(st.unsupported.length ? [item(`Not in this release: ${st.unsupported.join(", ")} — the site can link to the tool you already use`)] : []),
      ],
    },
    {
      id: "audience",
      title: "Who the site is for",
      items: [
        item(a.clients?.value === "businesses" ? "Business owners who want clear advice, a fixed scope and a fee up front" : "People with a legal problem who want to know if you can help, what it costs and that it stays confidential"),
        ...(sc.includes("L2") ? [item("People going through a family matter who need discretion and a calm first conversation")] : []),
        ...(sc.includes("L3") ? [item("People facing charges or an arrest who need to reach someone now")] : []),
        ...(sc.includes("L5") ? [item("People moving for work or family who need to know which documents to prepare")] : []),
        ...(sc.includes("L6") || sc.includes("L10") ? [item("Founders and companies comparing fee proposals")] : []),
        ...(sc.includes("L9") ? [item("Clients choosing a lawyer or an office")] : []),
      ],
    },
    {
      id: "tools",
      title: "Tools on the site",
      items: [
        item("Included free: Practice areas and fees, Contact and Locations, Enquiry inbox"),
        ...kept.map((m) => item(`${m.name}${m.price ? ` — $${m.price}/month` : " — free"}: ${m.included[0].toLowerCase()}`)),
        ...(kept.length ? [item(`Add-ons total: $${total}/month, charged from when you publish`)] : []),
        ...(automationsOf(st).length ? [item(`Automatic messages: ${automationsOf(st).join(", ")} — no case details in any message, and you approve every template`)] : []),
        ...(later.length ? [item(`Suggested after your first build: ${later.filter((m) => !restriction(st, m.id)).map((m) => m.name).join(", ")}`)] : []),
      ],
    },
    {
      id: "areas",
      title: "Practice areas and fees",
      items: [
        item(`Practice areas: [${areas.map((x) => x.title).join(", ")}] — remove any you don't practice; nothing unconfirmed is published`),
        item(`First meeting: ${MEETING_TEXT[a.meeting?.value ?? "paid"]}`),
        item(`Fees: ${FEE_TEXT[a.prices?.value ?? "from"]}`),
        ...(a.prices?.value === "ask"
          ? []
          : st.priceList?.file
            ? [item(`Fee schedule: from your file “${st.priceList.file.name}”`)]
            : st.priceList?.text
              ? [item(`Fee schedule: ${st.priceList.text.split("\n").filter(Boolean).join("; ")}`)]
              : [item("Fee schedule: [I'll draft typical starting fees for fixed-fee work — check them before you publish]")]),
        ...(a.urgent?.value ? [item(`Urgent matters: ${optionLabel("urgent", a.urgent.value, LAWYER)}`)] : []),
      ],
    },
    {
      id: "tone",
      title: "Tone and what the site won't say",
      items: [
        item(sc.includes("L2") || sc.includes("L8") ? "Tone: warm, discreet and gentle — plain words, no legalese" : sc[0] === "L3" || sc[0] === "L4" ? "Tone: direct and reassuring — short lines, the next step first" : "Tone: calm, clear and respectful — plain language, no legalese, no hype"),
        item("No “we always win”, guaranteed outcomes, “best lawyer”, “No. 1” or unverified awards; “specialist” only with a recognized accreditation"),
        item("No legal advice — general information only, and articles are marked for your review"),
        ...st.notes.map((x) => item(x)),
        ...(sc.includes("L2") || sc.includes("L3") || st.decisions["urgent-line"] === "added" ? [item(`Safety notice on urgent, family and contact pages: if you are in immediate danger, call ${j.emergencyNumber}`)] : []),
        item(jv === "id" ? "Languages: [Bahasa Indonesia and English] — translated pages are marked for your review" : jv === "my" ? "Languages: [English and Bahasa Malaysia] — translated pages are marked for your review" : "Languages: [English]"),
      ],
    },
    {
      id: "privacy",
      title: "Forms and confidentiality",
      items: [
        item("Enquiry form: name, phone or WhatsApp, email (optional), area of law, how urgent, preferred contact method, “Is it safe to leave a message on this number?”, a short description (300 characters), the other party's name (optional, for a conflict check)"),
        item("Never on a public form: the facts of a matter, documents or evidence, ID numbers, financial or health details, details about children"),
        item("New clients' bookings are requests you confirm, so you can run a conflict check first"),
        item(`Consent line on every form, in line with the ${j.dataLaw}`),
        ...(sc.includes("L2") ? [item("A discreet contact option: clients choose how and when you may contact them")] : []),
      ],
    },
  ]
}

export function lawyerQuestions(st: PlaybookState): OpenQuestion[] {
  const j = jurisdictionOf(st.answers.jurisdiction?.value)
  const q: OpenQuestion[] = []
  if (!isDemoFirm(st)) q.push({ id: "lq-hours", q: "What are your opening hours?", answer: "" })
  q.push({ id: "lq-reg", q: `Where is each lawyer admitted, and what is their ${j.registration}?`, answer: "" })
  if (st.answers.jurisdiction?.value === "unsure" || !st.answers.jurisdiction) q.push({ id: "lq-rules", q: "Which country's rules do you practice under?", answer: "" })
  q.push({ id: "lq-fees", q: "Which work do you do for a fixed fee, and from how much?", answer: "" })
  q.push({ id: "lq-photos", q: "Do you have photos of the team and the office we can use instead of stock images?", answer: "" })
  return q
}

/** everything the flow needs from the lawyer plan, behind the same shape as other niches */
export const LAWYER_PLAN = {
  brief: lawyerBrief,
  sitemap: lawyerSitemap,
  priority: lawyerPriority,
  questions: lawyerQuestions,
  name: firmName,
  isDemo: isDemoFirm,
  domain: firmDomain,
}

export { JURISDICTIONS }
