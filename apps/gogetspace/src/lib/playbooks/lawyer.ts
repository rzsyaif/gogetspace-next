import type { Market, Playbook } from "./types"
import { CONTACT_MODULE, INBOX_MODULE } from "./shared"

/**
 * Niche playbook: Lawyer (v0.1). Transcribed from "Agent Playbook – Lawyer", adjusted to the flow the dentist
 * playbook runs on today: the goal question comes first after the jurisdiction gate, the site is built with the
 * free parts, and the goals' modules are suggested after the first build (Modules, to-do list) — not offered
 * before it. Section numbers in comments point back to the document.
 *
 * What differs from the dentist playbook: a jurisdiction gate (QJ) before anything about fees, reviews or claims;
 * request-to-confirm consultations (conflict check); confidentiality-first intake; a trust-funds notice on
 * Payments; no legal advice anywhere; and no client portal, secure documents or e-signature in this release.
 */

/**
 * The rules the site follows, by where the lawyer practices. Prototype data — every brief tells the owner to
 * verify with the local bar or regulator. Unknown ("I'm not sure") gets the strictest defaults: no reviews,
 * promotions or case results.
 */
export const JURISDICTIONS: Record<string, Market & { label: string; reviews: boolean }> = {
  my: { label: "Malaysia", country: "Malaysia", regulator: "the Malaysian Bar", registration: "Advocate & Solicitor admission number", emergencyNumber: "999", dataLaw: "Personal Data Protection Act 2010 (PDPA)", reviews: false },
  sg: { label: "Singapore", country: "Singapore", regulator: "the Law Society of Singapore", registration: "practising certificate number", emergencyNumber: "999", dataLaw: "Personal Data Protection Act 2012 (PDPA)", reviews: false },
  id: { label: "Indonesia", country: "Indonesia", regulator: "PERADI", registration: "PERADI membership number", emergencyNumber: "112", dataLaw: "Personal Data Protection Law 2022 (UU PDP)", reviews: false },
  uk: { label: "England and Wales", country: "United Kingdom", regulator: "the Solicitors Regulation Authority (SRA)", registration: "SRA number", emergencyNumber: "999", dataLaw: "UK GDPR and the Data Protection Act 2018", reviews: true },
  au: { label: "Australia", country: "Australia", regulator: "your state's law society", registration: "practising certificate number", emergencyNumber: "000", dataLaw: "Privacy Act 1988", reviews: false },
  unsure: { label: "The strictest defaults", country: "", regulator: "your local bar or regulator", registration: "registration number", emergencyNumber: "your local emergency number", dataLaw: "your local data protection law", reviews: false },
}
export const jurisdictionOf = (value: string | undefined) => JURISDICTIONS[value ?? "unsure"] ?? JURISDICTIONS.unsure

/** practice areas that are mostly individuals' or mostly businesses' matters (settles the clients question) */
const PERSONAL = ["family", "criminal", "immigration", "injury", "estates"]
const BUSINESS = ["business"]

export const LAWYER: Playbook = {
  id: "lawyer",
  name: "Lawyer",
  version: "0.1",
  unit: "law practice",

  // §1 identity
  signals: /\b(lawyers?|attorneys?|advocates?|solicitors?|barristers?|law firm|law office|law practice|legal practice|legal consultant|litigation|contract review|criminal defen[cs]e|conveyancing|(family|criminal|immigration|property|employment|corporate) law|peguam|firma guaman|advokat|pengacara|kantor hukum)\b/i,
  generic: /\b(legal ?tech|legal (software|publisher|publishing)|law school|legal aid portal|law (students?|college))\b/i,
  directory: /\b(platform|directory|marketplace|listing site|list (of )?(all )?lawyers|lawyers in my city|many lawyers|find a lawyer)\b/i,
  otherNiche: /\b(dentists?|dental|clinic|doctor|restaurant|caf[eé])\b/i,

  // §3 scenarios
  scenarios: [
    { id: "L1", label: "Solo general practitioner", signals: /\b(general practice|my law practice|various matters)\b/i, mainButton: "Book a consultation", preset: "professional-calm" },
    { id: "L2", label: "Family law", signals: /\b(divorce|custody|child support|family)\b/i, mainButton: "Book a confidential consultation", preset: "warm-discreet" },
    { id: "L3", label: "Criminal defense and urgent matters", signals: /\b(criminal|arrest|bail|urgent)\b/i, mainButton: "Call now", preset: "direct-clear", pages: ["urgent"] },
    { id: "L4", label: "Personal injury", signals: /\b(accident|injury|no win no fee)\b/i, mainButton: "Get a free case evaluation", preset: "direct-clear" },
    { id: "L5", label: "Immigration", signals: /\b(visas?|residency|citizenship|immigration)\b/i, mainButton: "Book a consultation", preset: "professional-calm" },
    { id: "L6", label: "Business and corporate", signals: /\b(contracts?|company formation|startups?|corporate)\b/i, mainButton: "Request a fee proposal", preset: "professional-calm" },
    { id: "L7", label: "Property and real estate", signals: /\b(property|conveyancing|leases?|landlord)\b/i, mainButton: "Request a fee proposal or book", preset: "professional-calm" },
    { id: "L8", label: "Wills and estates", signals: /\b(wills|inheritance|probate|estate planning)\b/i, mainButton: "Book a consultation", preset: "warm-discreet" },
    { id: "L9", label: "Several lawyers or offices", signals: /\b(partners|our lawyers|offices|branches)\b/i, mainButton: "Book with a lawyer or office", preset: "professional-calm" },
    { id: "L10", label: "Retainer for small businesses", signals: /\b(retainer|monthly legal support|smes?)\b/i, mainButton: "Request a fee proposal", preset: "professional-calm" },
  ],

  // §4 question bank: Q0 and QJ are gates and don't count towards the four
  questions: [
    { id: "Q0", slot: "build", text: "Is this the website for one law practice, or a directory of lawyers?", options: [{ id: "one", label: "One practice" }, { id: "directory", label: "A directory" }] },
    {
      id: "QJ",
      slot: "jurisdiction",
      text: "Which country's rules should I follow for legal advertising and confidentiality?",
      helper: "If you're not sure, I'll use the strictest defaults and you can relax them later.",
      decideLabel: "I'm not sure",
      options: [
        { id: "my", label: "Malaysia" },
        { id: "sg", label: "Singapore" },
        { id: "id", label: "Indonesia" },
        { id: "uk", label: "England and Wales" },
        { id: "au", label: "Australia" },
        { id: "unsure", label: "The strictest defaults" },
      ],
    },
    { id: "Q1", slot: "goals", text: "What do you most want this website to do for your practice?", helper: "Pick up to three, then tell me which matters most. I'll suggest the right tools for what you pick — you can change this later.", options: [] },
    {
      id: "Q2",
      slot: "focus",
      text: "Which areas of law do you mainly work in?",
      helper: "Pick up to three.",
      multi: 3,
      options: [
        { id: "family", label: "Family" },
        { id: "criminal", label: "Criminal" },
        { id: "business", label: "Business and contracts" },
        { id: "property", label: "Property" },
        { id: "immigration", label: "Immigration" },
        { id: "injury", label: "Personal injury" },
        { id: "estates", label: "Wills and estates" },
        { id: "general", label: "General practice" },
      ],
    },
    { id: "Q3", slot: "clients", variant: "clients", text: "Who are your main clients?", options: [{ id: "individuals", label: "Individuals" }, { id: "businesses", label: "Businesses" }, { id: "both", label: "Both" }] },
    { id: "Q3", slot: "scale", variant: "scale", text: "Is it just you, or several lawyers?", options: [{ id: "solo", label: "Just me" }, { id: "lawyers", label: "Several lawyers" }, { id: "branches", label: "Several offices" }] },
    {
      id: "Q4",
      slot: "meeting",
      variant: "meeting",
      text: "How do you handle the first meeting?",
      options: [
        { id: "paid", label: "Paid consultation" },
        { id: "free", label: "Free first meeting" },
        { id: "evaluation", label: "Case evaluation first" },
        { id: "fixed", label: "Fixed-fee package" },
      ],
    },
    { id: "Q4", slot: "urgent", variant: "urgent", text: "When can urgent callers reach you?", options: [{ id: "always", label: "Available 24 hours" }, { id: "hours", label: "Set hours" }, { id: "call", label: "Call only" }] },
    {
      id: "Q4",
      slot: "prices",
      variant: "fees",
      text: "How would you like fees to appear?",
      helper: "Many firms show starting fees for fixed-fee work and discuss the rest at the first meeting.",
      options: [
        { id: "exact", label: "Show fees" },
        { id: "from", label: "Show starting fees" },
        { id: "ask", label: "Discuss on a call" },
      ],
    },
  ],

  // §4.1 goal catalog and module bundles (fixed mapping — changing it is a version change). Core modules are
  // always included and not listed; Reviews is offered only where the rules followed allow it.
  goals: [
    { id: "LG1", label: "Get more consultations booked online", chip: "Get more consultations booked online", mainButton: "Book a consultation", modules: ["consultations", "legal-reviews"], automations: ["Confirmation", "Reminders", "Consultation follow-up"], followUp: "meeting", fits: ["L1", "L2", "L5", "L7", "L8", "L9"] },
    { id: "LG2", label: "Get qualified case enquiries", chip: "Get qualified case enquiries", mainButton: "Tell us about your matter", modules: ["case-enquiries", "law-clients", "articles"], automations: ["Enquiry auto-reply", "Enquiry follow-up"], followUp: "meeting", fits: ["L2", "L3", "L4", "L5"] },
    { id: "LG3", label: "Handle urgent matters", chip: "Handle urgent matters", mainButton: "Call now", modules: ["urgent-line", "consultations"], automations: ["Urgent call-back confirmation"], followUp: "urgent", fits: ["L3"] },
    { id: "LG4", label: "Take consultation fees or retainer deposits online", chip: "Take fees or deposits online", mainButton: "Book and pay", modules: ["legal-payments"], automations: ["Payment receipts"], fits: ["L6", "L7", "L10"] },
    { id: "LG5", label: "Win business clients and retainers", chip: "Win business clients", mainButton: "Request a fee proposal", modules: ["fee-proposals", "law-clients", "articles"], automations: ["Proposal follow-up"], followUp: "fees", fits: ["L6", "L7", "L10"] },
    { id: "LG6", label: "Keep clients informed during their matter", chip: "Keep clients informed", mainButton: "Contact us", modules: ["client-updates", "law-clients"], automations: ["Update reminders"], fits: ["L1", "L2", "L6"] },
    { id: "LG7", label: "Just be found and trusted online", chip: "Just be found and trusted", mainButton: "Call or message us", modules: ["articles", "legal-reviews"], automations: [], followUp: "fees", fits: ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10"] },
    { id: "LG8", label: "Run several lawyers or offices", chip: "Run several lawyers or offices", mainButton: "Book with a lawyer or office", modules: ["lawyers"], automations: ["Per-lawyer reminders"], followUp: "scale", fits: ["L9"] },
  ],
  defaultGoal: "LG1",
  defaultSecondary: "LG7",

  // §8 modules. Prices are placeholders per website per month — set the real ones here.
  modules: [
    { id: "practice-areas", name: "Practice areas and fees", core: true, price: 0, benefit: {}, included: ["A page for each practice area, with how fees work", "A practice-area catalog you can edit"] },
    CONTACT_MODULE,
    INBOX_MODULE,
    {
      id: "consultations",
      name: "Appointments",
      price: 12,
      benefit: { LG1: "Because you want more consultations booked online", LG3: "For urgent call-backs the same day", LG4: "Clients pay the consultation fee when they book", LG8: "Clients book with a specific lawyer" },
      included: ["Consultation requests you confirm first, so you can run a conflict check", "Reminders 24 hours and 2 hours before", "A video link for online meetings"],
      needsAccount: { label: "WhatsApp", testMode: "Reminders go by email until you connect WhatsApp", connect: "Connect WhatsApp" },
      fallback: "Call or message us",
      pages: ["book"],
    },
    {
      id: "case-enquiries",
      name: "Case enquiries",
      price: 6,
      benefit: { LG2: "Because you want qualified case enquiries" },
      included: ["A short, confidential enquiry form — no case details", "Flags enquiries that need a conflict check", "An auto-reply with your response time"],
      fallback: "Call or message us",
      pages: ["enquiry"],
      sensitive: "Stores names, contact details and the area of law — never case details",
    },
    {
      id: "law-clients",
      name: "Clients and enquiries",
      price: 10,
      benefit: { LG2: "Follow up every enquiry", LG5: "Keep track of every business lead", LG6: "Because you want to keep clients informed" },
      included: ["A contact list with matter type and last-contact date — no case details", "Follow-up reminders for you"],
      sensitive: "Stores names, contact details and matter types",
    },
    {
      id: "fee-proposals",
      name: "Fee proposals",
      price: 9,
      benefit: { LG5: "Because you want business clients and retainers", LG4: "Clients can pay a deposit when they accept" },
      included: ["Fee proposal requests from businesses", "Statuses from New to Accepted", "Follow-up after 3 and 10 days"],
      fallback: "Call or message us",
      pages: ["fee-proposal"],
    },
    {
      id: "legal-payments",
      name: "Payments",
      price: 9,
      dependsOn: ["consultations", "fee-proposals"],
      benefit: { LG4: "Because you want to take consultation fees or deposits online" },
      included: ["Consultation fees or deposits when booking or accepting a proposal", "Receipts by email"],
      needsAccount: { label: "payouts", testMode: "Test mode until you connect payouts", connect: "Connect payouts" },
      fallback: "Book a consultation",
      notice: "Payments is for your fees. Client money and retainers may have to be held under trust account rules where you practice — the website doesn't handle client funds.",
      confirm: "I'll handle client funds separately, under my local rules",
    },
    {
      id: "urgent-line",
      name: "Urgent line",
      price: 0,
      benefit: { LG3: "Because you handle urgent matters" },
      included: ["Call and WhatsApp first on phones", "A short urgent call-back form", "A safety notice on urgent pages"],
      pages: ["urgent"],
    },
    {
      id: "client-updates",
      name: "Client updates (lite)",
      price: 5,
      dependsOn: ["law-clients"],
      benefit: { LG6: "Because you want to keep clients informed" },
      included: ["Reminds you to update each open matter every 14 days", "Status messages that never carry case details"],
    },
    {
      id: "articles",
      name: "Articles",
      price: 4,
      benefit: { LG2: "Helpful articles bring people with the right problem", LG5: "Show businesses you know their world", LG7: "Helpful legal information builds trust" },
      included: ["General legal information, marked for your review", "A “not legal advice” note on every article"],
      pages: ["articles"],
    },
    {
      id: "legal-reviews",
      name: "Reviews",
      price: 4,
      benefit: { LG1: "Real reviews help new clients choose you", LG7: "Your real reviews build trust" },
      included: ["Shows your real Google reviews", "Asks for a review after a matter closes"],
      restrictedBy: "reviews",
    },
    {
      id: "lawyers",
      name: "Lawyers and offices",
      price: 8,
      benefit: { LG8: "Because you run several lawyers or offices" },
      included: ["A profile for each lawyer", "Book with a specific lawyer or office", "Routing by practice area"],
      fallback: "Call or message us",
      pages: ["offices"],
    },
  ],

  // §9 guardrails
  guardrails: [
    {
      id: "win",
      area: "Claims",
      match: /\b(always win|never lose|win every|we win|guarantee[sd]? (a |the |your )?(win|outcome|result|approval)s?|guaranteed (to be )?(approv\w+|outcomes?|results?|wins?)|(applications?|cases?) (are|is) guaranteed)\b/i,
      reason: "Outcomes can't be promised, and legal advertising rules restrict it almost everywhere.",
      alternative: "Focused on [your practice areas], practicing since [year] — and we explain every step.",
      note: "No promised outcomes; process-based wording instead",
    },
    {
      id: "best",
      area: "Claims",
      match: /\b(the )?(best|no\.? ?1|number one|top[- ]rated|#1|top)\b[\w\s]{0,20}\b(lawyers?|attorneys?|advocates?|solicitors?|law firm|firm|in town)\b/i,
      reason: "“Best”, “No. 1” or “top” can't be proven, and legal advertising rules don't allow it.",
      alternative: "Focused on [your practice areas], practicing since [year].",
      note: "Uses provable facts instead of “best lawyer”",
    },
    {
      id: "expert",
      area: "Claims",
      match: /\b(experts?|specialists?) (in|on|for)\b/i,
      reason: "“Expert” and “specialist” are only allowed with a recognized accreditation under local rules.",
      alternative: "Focused on [area] — or “specialist” once you tell me the accreditation that allows it.",
      note: "“Focused on” instead of “expert” or “specialist”",
    },
    {
      id: "case-results",
      area: "Case results",
      match: /\b(past case results|case results|client names|cases we('ve)? won|our wins|won cases|winning cases)\b/i,
      reason: "Case results and client names need the client's consent, and many places don't allow them at all.",
      alternative: "A description of the kinds of matters you handle. Results are added only if your rules allow it and the client consents.",
      note: "Describes the kinds of matters handled; no case results or client names",
    },
    {
      id: "whole-case",
      area: "Confidentiality",
      match: /\b(whole case|full (story|details|facts)|all the details|describe (their|your|the) (whole )?case|upload (documents|evidence|files)|send (us )?(documents|evidence))\b/i,
      reason: "A public form is no place for confidential details — and long forms make people give up.",
      alternative: "A short description (300 characters) with a warning not to send confidential details, and the rest discussed on a call.",
      note: "Intake stays short; details are discussed on a call",
    },
    {
      id: "discount",
      area: "Fees",
      match: /\b(\d{1,2} ?% ?(off|discount)|discount banner|huge discount|cheapest)\b/i,
      reason: "A discount banner without real dates and conditions counts as bait pricing, and legal advertising rules may restrict promotions.",
      alternative: "A promotion with real dates and conditions, after you check your local advertising rules.",
      note: "Promotions only with real dates and conditions, where the rules allow",
    },
    {
      id: "legal-advice",
      area: "Legal advice",
      match: /\b(give|offer|provide) (free )?legal advice\b|\banswer (people'?s |their )?legal questions\b|\bchat ?bot\b/i,
      reason: "The website can't give legal advice — only general information, with a note that it isn't advice.",
      alternative: "General legal information with a “not legal advice” note, and a clear way to book a consultation.",
      note: "General information only; every page says it isn't legal advice",
    },
    {
      id: "fake-reviews",
      area: "Reviews",
      match: /\b(write|make up|invent|add|create)\b[\w\s]{0,12}\b(fake )?(reviews|testimonials)\b/i,
      reason: "I can't write reviews in clients' voices — they'd read as real, and testimonials are restricted in many places.",
      alternative: "Your real reviews, only where your rules allow them.",
      note: "Only real, attributable reviews, where allowed",
    },
  ],
  emergencyNotice: "If you are in immediate danger, contact your local emergency services.",
  market: JURISDICTIONS.unsure,

  // §5 defaults (used on "You decide")
  defaults: { jurisdiction: "unsure", focus: "general", clients: "individuals", scale: "solo", meeting: "paid", urgent: "call", prices: "from", style: "professional-calm" },

  copy: {
    unitShort: "law practice",
    customers: "clients",
    member: "lawyer",
    defaultName: "Your Law Firm",
    searchHint: "law firm",
    opening: "I'll build a website for a single law practice. A few quick questions first — I'll look you up online meanwhile.",
    justBuild:
      "Sure. I'll assume your main goal is getting more consultations booked online, and I'll apply the strictest advertising and confidentiality defaults until you tell me where you practice. Every assumption is listed so you can change it.",
    decideGoal: "I chose getting more consultations booked online, with being found and trusted as a second goal — that's where most practices start.",
    decideReason: {
      jurisdiction: "with no rules to go on, the strictest defaults keep you safe — reviews, promotions and case results stay off until you tell me where you practice",
      focus: "it covers most practices",
      clients: "most practices start with individuals",
      scale: "it's the simplest setup — adding lawyers later is easy",
      meeting: "a paid first consultation is the most common model",
      urgent: "callers reaching you by phone first is the safest default",
      prices: "many firms show starting fees for fixed-fee work and discuss the rest at the first meeting",
    },
    planLines: [
      { slot: "jurisdiction", label: "Rules followed" },
      { slot: "focus", label: "Practice areas" },
      { slot: "clients", label: "Clients" },
      { slot: "scale", label: "Size" },
      { slot: "meeting", label: "First meeting" },
      { slot: "prices", label: "Fees" },
      { slot: "urgent", label: "Urgent matters" },
    ],
    presets: { "professional-calm": "Professional calm", "warm-discreet": "Warm and discreet", "direct-clear": "Direct and clear" },
  },

  logic: {
    read(p, set) {
      const j = JURISDICTION_SIGNALS.find(([, re]) => re.test(p))
      if (j) set("jurisdiction", j[0])
      const areas = AREAS.filter(([, re]) => re.test(p)).map(([id]) => id)
      if (areas.length) set("focus", areas.slice(0, 3).join(","))
      if (/\b(several|multiple|\d+|two|three|four|five) offices\b|\bbranches\b/i.test(p)) set("scale", "branches")
      else if (/\b(several|multiple|team of|\d+|two|three|four|five) (lawyers|partners|advocates|solicitors)\b|\bour lawyers\b|\bpartners\b/i.test(p)) set("scale", "lawyers")
      else if (/\b(solo|just me|one lawyer|sole practi\w+)\b/i.test(p)) set("scale", "solo")
      if (/\b(businesses|companies|corporate clients|smes?|startups?)\b/i.test(p) && /\b(individuals|families|people)\b/i.test(p)) set("clients", "both")
      else if (/\b(businesses|companies|corporate clients|smes?|startups?)\b/i.test(p)) set("clients", "businesses")
      if (/\b(24 ?(hours|h|\/7)|any ?time|day or night|around the clock)\b/i.test(p)) set("urgent", "always")
      if (/\bfree (first )?(consultation|meeting)\b/i.test(p)) set("meeting", "free")
      else if (/\b(case evaluation|no win,? no fee)\b/i.test(p)) set("meeting", "evaluation")
      else if (/\bfixed[- ]fee\b/i.test(p)) set("meeting", "fixed")
      if (/\b(don'?t (show|list) (fees|prices)|no (fees|prices) on)\b/i.test(p)) set("prices", "ask")
    },
    goalSignals: [
      ["LG1", /\b(book(ing)?s? (a |their )?(confidential )?consultations?|consultations? online|online (booking|consultations?)|(clients?|people) (should|can|to|could) book|appointments?|get reminders|bookings)\b/i],
      ["LG2", /\b(case enquir\w+|enquir(y|ies)|inquir(y|ies)|intake|qualified (leads|enquiries)|case evaluations?|tell us about (their|your) matter)\b/i],
      ["LG3", /\b(urgent|arrests?|bail|24 ?(hours|h|\/7)|any ?time|after[- ]hours|emergenc\w*|call-?backs?)\b/i],
      ["LG4", /\b(payments?|pay online|deposits?|retainers? online|consultation fees? online|take (fees|payment))\b/i],
      ["LG5", /\b(business clients|retainers?|fee proposals?|quotes?|companies|corporate clients|smes?)\b/i],
      ["LG6", /\b(keep (my |our )?clients (informed|updated)|client updates|updated on (their )?matters|status updates|keep clients updated)\b/i],
      ["LG7", /\b(be found|found online|get found|trusted online|online presence|just (want )?(a )?(simple )?(website|site|page))\b/i],
      ["LG8", /\b((several|multiple|\d+|two|three|four|five) (lawyers|offices|partners)|our lawyers|branches)\b/i],
    ],
    refineGoals(goals, p) {
      // "take retainers online" is the payments goal, not the business-client goal
      if (goals.includes("LG4") && goals.includes("LG5") && !/\b(business clients|fee proposals?|companies|corporate clients|smes?)\b/i.test(p)) goals = goals.filter((g) => g !== "LG5")
      // the main goal is the highest-intent one: urgent, then case evaluation, then consultation, then fee proposal (§3)
      const order = ["LG3", "LG2", "LG1", "LG5"]
      const rank = (g: string) => (order.indexOf(g) === -1 ? 9 : order.indexOf(g))
      return [...goals].sort((a, b) => rank(a) - rank(b))
    },
    unsupported(p) {
      const out: string[] = []
      if (/\b(client portal|portal)\b/i.test(p)) out.push("A client portal")
      if (/\b(upload (documents|files|evidence)|document (sharing|exchange|upload)|secure documents?)\b/i.test(p)) out.push("Secure document sharing")
      if (/\b(e-?signatures?|sign (documents|contracts) online)\b/i.test(p)) out.push("E-signature")
      if (/\b(time tracking|billing|invoic\w+|trust accounting)\b/i.test(p)) out.push("Time tracking and billing")
      return out
    },
    vague: /\bmore (clients|customers|cases|work|business)\b/i,
    next(st, pb, ask) {
      const q = (id: string, variant?: string) => pb.questions.find((x) => x.id === id && (!variant || x.variant === variant))
      if (!st.answers.focus) {
        const asked = ask(q("Q2"))
        if (asked) return asked
      }
      // Q3: the firm's size when the goals are about several lawyers, otherwise who the clients are — unless the
      // practice areas already settle it
      const main = st.goals[0]
      if (main === "LG8" || st.answers.scale?.source === "prompt") {
        if (!st.answers.scale) {
          const asked = ask(q("Q3", "scale"))
          if (asked) return asked
        }
      } else if (!st.answers.clients) {
        const areas = (st.answers.focus?.value ?? "").split(",").filter(Boolean)
        const settled = areas.length > 0 && (areas.every((a) => PERSONAL.includes(a)) || areas.every((a) => BUSINESS.includes(a)))
        if (!settled) {
          const asked = ask(q("Q3", "clients"))
          if (asked) return asked
        }
      }
      // Q4: the one follow-up that belongs to the main goal
      const v = pb.goals.find((g) => g.id === main)?.followUp
      const q4 = v && v !== "scale" ? q("Q4", v) : undefined
      if (q4 && !st.answers[q4.slot as "meeting"]) return ask(q4)
      return null
    },
    scenarios(st) {
      const areas = (st.answers.focus?.value ?? "").split(",")
      const out: string[] = []
      if (st.goals.includes("LG3") || areas.includes("criminal")) out.push("L3")
      if (areas.includes("injury")) out.push("L4")
      if (areas.includes("family")) out.push("L2")
      if (areas.includes("immigration")) out.push("L5")
      if (areas.includes("business")) out.push(st.goals.includes("LG5") && st.answers.clients?.value === "businesses" ? "L10" : "L6")
      if (areas.includes("property")) out.push("L7")
      if (areas.includes("estates")) out.push("L8")
      if (st.goals.includes("LG8") || (st.answers.scale && st.answers.scale.value !== "solo")) out.push("L9")
      if (!out.length) out.push("L1")
      return out
    },
    preset(st) {
      const sc = LAWYER.logic.scenarios(st)
      // the highest-intent scenario sets the look: urgent first, then sensitive matters
      if (sc[0] === "L3" || sc[0] === "L4") return "direct-clear"
      if (sc.includes("L2") || sc.includes("L8")) return "warm-discreet"
      return "professional-calm"
    },
    keyModule: { LG1: "consultations", LG2: "case-enquiries", LG4: "legal-payments", LG5: "fee-proposals", LG8: "lawyers" },
    automations(has, st) {
      const out: string[] = []
      if (has("consultations")) out.push("Booking received and confirmed", "Reminders")
      if (has("consultations") && st.goals.includes("LG1")) out.push("Consultation follow-up")
      if (has("case-enquiries")) out.push("Enquiry auto-reply")
      if (has("fee-proposals")) out.push("Proposal follow-up")
      if (has("client-updates")) out.push("Update reminders to you")
      if (has("legal-payments")) out.push("Payment receipts")
      if (has("legal-reviews")) out.push("Review request")
      if (has("lawyers") && has("consultations")) out.push("Per-lawyer reminders")
      if (has("urgent-line")) out.push("Urgent call-back confirmation")
      return out
    },
    goalOrder: ["LG1", "LG2", "LG5", "LG7", "LG3", "LG4", "LG6", "LG8"],
    gate: "jurisdiction",
    restricted(st, m) {
      if (m.restrictedBy !== "reviews") return null
      const j = jurisdictionOf(st.answers.jurisdiction?.value)
      if (j.reviews) return null
      return st.answers.jurisdiction?.value && st.answers.jurisdiction.value !== "unsure"
        ? `Off under the rules for ${j.label} — reviews and testimonials are restricted there`
        : "Off until you tell me where you practice — reviews are restricted in many places"
    },
    titledName: /\b([A-Z][\w’']+(?:\s+(?:&|and)\s+[A-Z][\w’']+)?\s+(?:Law(?:\s+(?:Firm|Office|Chambers|Group))?|Legal|Advocates(?:\s+&\s+Solicitors)?|Solicitors|Chambers|Partners|Associates|LLP))\b/,
  },
}

const JURISDICTION_SIGNALS: [string, RegExp][] = [
  ["my", /\b(malaysia|kuala lumpur|\bKL\b|penang|johor|selangor|petaling jaya|ipoh|melaka|sabah|sarawak)\b/i],
  ["sg", /\bsingapore\b/i],
  ["id", /\b(indonesia|jakarta|bandung|surabaya|bali|medan|yogyakarta)\b/i],
  ["uk", /\b(england|wales|london|manchester|birmingham|united kingdom|\bUK\b)\b/i],
  ["au", /\b(australia|sydney|melbourne|brisbane|perth|adelaide)\b/i],
]

const AREAS: [string, RegExp][] = [
  ["family", /\b(family|divorce|custody|child support|prenup\w*)\b/i],
  ["criminal", /\b(criminal|arrests?|bail|defen[cs]e lawyer)\b/i],
  ["business", /\b(business|corporate|contracts?|company formation|startups?|commercial)\b/i],
  ["property", /\b(property|conveyancing|real estate|leases?|landlord|tenan\w+)\b/i],
  ["immigration", /\b(immigration|visas?|residency|citizenship)\b/i],
  ["injury", /\b(personal injury|accidents?|injur\w+|no win,? no fee)\b/i],
  ["estates", /\b(wills|will[- ]writing|wills and estates|estate planning|probate|inheritance)\b/i],
]
