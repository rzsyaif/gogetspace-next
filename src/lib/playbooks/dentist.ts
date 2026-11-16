import type { Playbook } from "./types"

/**
 * Niche playbook: Dentist (v0.3 — goal question first, module offer before the build).
 * Transcribed from "Agent Playbook – Dentist"; section numbers in comments point back to that document.
 * Market overlay: Malaysia (assumed until the owner says otherwise).
 */
export const DENTIST: Playbook = {
  id: "dentist",
  name: "Dentist",
  version: "0.3",
  unit: "dental practice",

  // §1 identity
  signals: /\b(dentists?|dental|dentistry|orthodont\w*|braces|aligners?|invisalign|teeth whitening|whitening|veneers?|dental implants?|root canal|teeth cleaning|scaling|klinik pergigian|pergigian|gigi|doktor gigi)\b/i,
  generic: /\b(dental (lab|laboratory|supply|supplies|school|college)|dental equipment)\b/i,
  directory: /\b(platform|directory|marketplace|listing site|list (of )?(all )?dentists|dentists in my city|many dentists)\b/i,
  otherNiche: /\b(lawyer|law firm|advocates?|solicitors?|notary|legal practice|attorney)\b/i,

  // §3 scenarios
  scenarios: [
    { id: "S1", label: "Solo general dentist", signals: /\b(general dentistry|one dentist|solo)\b/i, mainButton: "Book an appointment", preset: "calm-clinical" },
    { id: "S2", label: "Family clinic", signals: /\b(family|kids and adults|whole family)\b/i, mainButton: "Book an appointment", preset: "calm-clinical", pages: ["kids"] },
    { id: "S3", label: "Pediatric", signals: /\b(kids?'? dentist|children'?s? dent\w*|child(ren)?|paediatric|pediatric|kids)\b/i, mainButton: "Book a first visit", preset: "warm-family", pages: ["first-visit"] },
    { id: "S4", label: "Orthodontics", signals: /\b(orthodont\w*|braces|aligners?|invisalign|retainers?)\b/i, mainButton: "Book a consultation", preset: "calm-clinical" },
    { id: "S5", label: "Cosmetic and implants", signals: /\b(cosmetic|whitening|veneers?|implants?|smile makeover)\b/i, mainButton: "Book a consultation", preset: "modern-premium" },
    { id: "S6", label: "Emergency-oriented", signals: /\b(emergenc\w*|toothache|walk[- ]in|24 ?(hours|h|\/7)|same[- ]day)\b/i, mainButton: "Call now or book a same-day slot", preset: "calm-clinical", pages: ["emergency"] },
    { id: "S7", label: "Several dentists or branches", signals: /\b(branch(es)?|our dentists|multiple locations|\d+[- ]branch|several dentists|two clinics|locations)\b/i, mainButton: "Book with a dentist or branch", preset: "calm-clinical", pages: ["branches"] },
    { id: "S8", label: "Insurance or membership", signals: /\b(insurance|insured|membership|corporate|panel clinic|company panel)\b/i, mainButton: "Check coverage or book", preset: "calm-clinical" },
  ],

  // §4 question bank (Q0 is a gate and doesn't count towards the four)
  questions: [
    { id: "Q0", slot: "build", text: "Is this the website for one dental practice, or a directory of many dentists?", options: [{ id: "one", label: "One practice" }, { id: "directory", label: "A directory" }] },
    { id: "Q1", slot: "goals", text: "What do you most want this website to do for your clinic?", helper: "Pick up to three, then tell me which matters most. I'll set up the right tools for what you pick — you can change this later.", options: [] },
    { id: "Q2", slot: "focus", text: "What kind of dentistry do you mainly do?", options: [{ id: "general", label: "General or family" }, { id: "ortho", label: "Orthodontics" }, { id: "cosmetic", label: "Cosmetic and implants" }, { id: "pediatric", label: "Pediatric" }] },
    { id: "Q3", slot: "scale", text: "Is it one clinic or several?", options: [{ id: "solo", label: "Solo dentist" }, { id: "dentists", label: "Several dentists" }, { id: "branches", label: "Several branches" }] },
    { id: "Q4", slot: "prices", variant: "prices", text: "How would you like prices to appear?", helper: "Most clinics show from-prices for routine care and invite a consultation for bigger treatments.", options: [{ id: "exact", label: "Exact prices" }, { id: "from", label: "From prices" }, { id: "range", label: "Ranges" }, { id: "ask", label: "Ask us for a quote" }] },
    { id: "Q4", slot: "emergency", variant: "emergency", text: "When can emergency patients reach you?", options: [{ id: "daily", label: "Same-day slots every day" }, { id: "hours", label: "Set hours" }, { id: "call", label: "Call only" }] },
    { id: "Q4", slot: "insurance", variant: "insurance", text: "Do you accept insurance?", options: [{ id: "list", label: "I'll list the insurers" }, { id: "none", label: "We don't take insurance" }] },
  ],

  // §4.1 goal catalog and module bundles (fixed mapping — changing it is a version change)
  goals: [
    { id: "G1", label: "Get more patients booking online", chip: "Get more patients booking online", mainButton: "Book an appointment", modules: ["appointments", "reviews"], automations: ["Confirmation", "Reminders", "Review request"], followUp: "prices", fits: ["S1", "S2", "S3", "S6", "S7"] },
    { id: "G2", label: "Get consultation requests for braces, implants or cosmetic work", chip: "Get consultation requests for bigger treatments", mainButton: "Book a consultation", modules: ["estimates", "appointments", "crm", "gallery"], automations: ["Estimate follow-up"], followUp: "prices", fits: ["S4", "S5"] },
    { id: "G3", label: "Handle emergencies and same-day patients", chip: "Handle emergencies and same-day patients", mainButton: "Call now or book same day", modules: ["emergency", "appointments"], automations: ["Reminders"], followUp: "emergency", fits: ["S6"] },
    { id: "G4", label: "Keep patients coming back", chip: "Keep patients coming back", mainButton: "Book your next check-up", modules: ["crm", "appointments", "reviews"], automations: ["Recall", "Reactivation", "Review request"], fits: ["S1", "S2", "S3"] },
    { id: "G5", label: "Take deposits or payments online", chip: "Take deposits online", mainButton: "Book and pay a deposit", modules: ["payments"], automations: ["Payment receipts"], fits: ["S4", "S5"] },
    { id: "G6", label: "Just be found and trusted online", chip: "Just be found and trusted", mainButton: "Call or message us", modules: ["reviews"], automations: [], followUp: "prices", fits: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"] },
    { id: "G7", label: "Run several branches or dentists", chip: "Run several branches or dentists", mainButton: "Book with a dentist or branch", modules: ["branches"], automations: ["Per-branch reminders"], followUp: "scale", fits: ["S7"] },
    { id: "G8", label: "Serve companies or insured patients", chip: "Serve companies or insured patients", mainButton: "Request a quote or check coverage", modules: ["estimates", "insurance", "crm"], automations: ["Estimate follow-up"], followUp: "insurance", fits: ["S8"] },
  ],
  defaultGoal: "G1",
  defaultSecondary: "G6",

  // §8 modules. Prices are placeholders per website per month — set the real ones here.
  modules: [
    { id: "services", name: "Services and Prices", core: true, price: 0, benefit: {}, included: ["Treatment pages with prices or an estimate note", "Treatment catalog you can edit"] },
    { id: "contact", name: "Contact and Locations", core: true, price: 0, benefit: {}, included: ["Address, map, hours, phone and WhatsApp on every page"] },
    { id: "inbox", name: "Enquiry inbox", core: true, price: 0, benefit: {}, included: ["Messages from your contact form in one place"] },
    {
      id: "appointments",
      name: "Appointments",
      price: 12,
      benefit: { G1: "Because you want more patients booking online", G2: "So patients can book a consultation slot", G3: "For same-day slots", G4: "So patients can book their next check-up" },
      included: ["Online booking with instant confirmation", "Reminders 24 hours and 2 hours before", "Same-day slots and a phone fallback"],
      needsAccount: { label: "WhatsApp", testMode: "Reminders go by email until you connect WhatsApp", connect: "Connect WhatsApp" },
      fallback: "Call or message us",
      pages: ["book"],
    },
    {
      id: "reviews",
      name: "Reviews",
      price: 4,
      benefit: { G1: "Real reviews help new patients choose you", G4: "Ask happy patients for a review", G6: "Your real Google reviews build trust" },
      included: ["Shows your real Google reviews", "Asks for a review 24 hours after a visit"],
    },
    {
      id: "estimates",
      name: "Estimates",
      price: 9,
      benefit: { G2: "Because you want consultation requests for bigger treatments", G8: "Companies and insured patients can request a quote" },
      included: ["Consultation and estimate requests", "Statuses from New to Accepted", "Follow-up after 3 and 10 days"],
      fallback: "Call or message us",
      pages: ["consultation"],
    },
    {
      id: "crm",
      name: "Patients and enquiries",
      price: 10,
      benefit: { G2: "Keep track of every consultation request", G4: "Because you want patients to come back", G8: "Keep company and insurance enquiries together" },
      included: ["Patient list with last-visit dates", "Check-up recall every 6 months", "A gentle invitation after 12 months away"],
      sensitive: "Stores names, phone numbers and visit dates",
    },
    {
      id: "payments",
      name: "Payments",
      price: 9,
      dependsOn: ["appointments", "estimates"],
      benefit: { G5: "Because you want to take deposits online" },
      included: ["Deposits when booking or accepting an estimate", "Receipts by email"],
      needsAccount: { label: "payouts", testMode: "Test mode until you connect payouts", connect: "Connect payouts" },
      fallback: "Book an appointment",
    },
    {
      id: "gallery",
      name: "Before and after gallery",
      price: 3,
      benefit: { G2: "Show real results, with your patients' consent" },
      included: ["Photo pairs with a “results vary” note", "Only photos you confirm you have consent for"],
      pages: ["before-after"],
      sensitive: "Needs written patient consent for every photo",
    },
    {
      id: "emergency",
      name: "Emergency page",
      price: 0,
      benefit: { G3: "Because you handle emergencies and same-day patients" },
      included: ["Call and WhatsApp first on phones", "Urgent-care notice", "Same-day slots when Appointments is added"],
      pages: ["emergency"],
    },
    {
      id: "branches",
      name: "Branches and dentists",
      price: 8,
      benefit: { G7: "Because you run several branches or dentists" },
      included: ["A page for each branch", "Book with a specific dentist or branch", "Reminders from the right branch"],
      fallback: "Call or message us",
      pages: ["branches"],
    },
    {
      id: "insurance",
      name: "Insurance and panels",
      price: 0,
      benefit: { G8: "Because you serve companies and insured patients" },
      included: ["List of insurers and company panels you accept", "Coverage questions go to your inbox"],
      pages: ["insurance"],
    },
  ],

  // §9 guardrails
  guardrails: [
    {
      id: "painless",
      area: "Claims",
      match: /\b(painless|pain[- ]free|no pain|doesn'?t hurt|won'?t hurt)\b/i,
      reason: "“Painless” can't be promised to every patient, and it can break advertising rules for dentists.",
      alternative: "A gentle approach — tell us if you feel anxious, and we'll go at your pace.",
      note: "Comfort is described honestly (no “painless”)",
    },
    {
      id: "best",
      area: "Claims",
      match: /\b(the )?(best|no\.? ?1|number one|top[- ]rated|#1)\b[\w\s]{0,20}\b(dentist|dental|clinic|in town)\b/i,
      reason: "“Best” or “No. 1” can't be proven, and the dental regulator doesn't allow it in advertising.",
      alternative: "Caring for families in your area for [X] years — plus your best real Google reviews.",
      note: "Uses provable facts and real reviews instead of “best dentist”",
    },
    {
      id: "guarantee",
      area: "Claims",
      match: /\b(guarantee[sd]?|permanent(ly)?|100 ?%|cure[sd]?|lifetime results?)\b/i,
      reason: "Treatment results can't be guaranteed or called permanent.",
      alternative: "Clear explanations of what to expect, with “results vary” where outcomes are shown.",
      note: "No guarantees; “results vary” where outcomes are shown",
    },
    {
      id: "medical-history",
      area: "Privacy",
      match: /\b(medical history|health history|medications?|allergies|diagnos\w*|illness(es)?)\b/i,
      reason: "Asking for medical history on a public form puts your patients' health data at risk — and people stop filling in long forms.",
      alternative: "A short booking form, and a private pre-visit form later or at the clinic.",
      note: "Booking form stays minimal; medical history is collected privately",
    },
    {
      id: "before-after",
      area: "Before and after",
      match: /\b(before[- ](and[- ]|&[- ]|\/ ?)?after)\b/i,
      reason: "Before-and-after photos need each patient's written consent.",
      alternative: "A before-and-after gallery that only shows photos you have consent for, with a “results vary” note.",
      note: "Before-and-after gallery, consent confirmed",
      confirm: "I have written consent from every patient whose photos I'll show",
    },
    {
      id: "discount",
      area: "Prices",
      match: /\b(\d{1,2} ?% ?(off|discount)|discount banner|huge discount|cheapest)\b/i,
      reason: "A discount banner without real dates and conditions counts as bait pricing.",
      alternative: "A promotion with real start and end dates and its conditions, after you check local advertising rules.",
      note: "Promotions only with real dates and conditions",
    },
    {
      id: "fake-reviews",
      area: "Reviews",
      match: /\b(write|make up|invent|add|create)\b[\w\s]{0,12}\b(fake )?(reviews|testimonials)\b/i,
      reason: "I can't write reviews in patients' voices — they'd read as real.",
      alternative: "Your real Google reviews, with a review request after each visit to get more.",
      note: "Only real, attributable reviews",
    },
  ],
  emergencyNotice:
    "If you have severe facial swelling, trouble breathing or swallowing, bleeding that won't stop, or a serious injury to your face, call 999 or go to the nearest emergency department.",
  market: { country: "Malaysia", regulator: "Malaysian Dental Council (MDC)", registration: "MDC registration number", emergencyNumber: "999", dataLaw: "Personal Data Protection Act 2010 (PDPA)" },

  // §5 defaults (used on "You decide")
  defaults: { focus: "general", scale: "solo", prices: "from", emergency: "call", insurance: "none", style: "calm-clinical" },
}
