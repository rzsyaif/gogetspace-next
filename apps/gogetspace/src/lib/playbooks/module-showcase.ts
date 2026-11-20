/**
 * What the install popup shows for each module: a longer description, what the owner can do with it, where they
 * manage it, and the two previews — what their customers see on the site and what they see in the module's app.
 * Previews are drawn from a handful of kinds (booking, form, contacts…) with module-specific wording.
 */

export type PreviewKind = "booking" | "form" | "contacts" | "payments" | "reviews" | "gallery" | "page" | "articles" | "locations"

export interface Showcase {
  kind: PreviewKind
  about: string
  features: string[]
  /** where the owner manages it, after install */
  manage: string
  /** wording the previews use */
  labels: {
    /** the customer-facing title on the site */
    site: string
    /** a line under it */
    siteNote: string
    /** items the preview lists (time slots, form fields, contacts, branches…) */
    items: string[]
    /** the button customers press */
    action: string
    /** the owner's app title */
    app: string
    /** rows in the owner's app: [name, detail, status] */
    rows: [string, string, string][]
  }
}

export const SHOWCASE: Record<string, Showcase> = {
  /* ---------------- dentist ---------------- */
  appointments: {
    kind: "booking",
    about: "Patients book a check-up or treatment from any page, see real free times, and get a confirmation straight away. Reminders go out before the visit, so fewer people forget.",
    features: ["Choose which treatments can be booked, and how long each takes", "Set opening hours, breaks and holidays", "Move or cancel visits — patients are told automatically", "Same-day slots for urgent toothache, with a phone fallback"],
    manage: "the Appointments app — your calendar, booking types and reminder messages",
    labels: {
      site: "Book a visit",
      siteNote: "Check-up and clean · 45 min",
      items: ["Tue 9:30", "Tue 11:00", "Wed 2:30", "Wed 4:00", "Thu 10:00", "Fri 3:30"],
      action: "Confirm booking",
      app: "Appointments · This week",
      rows: [
        ["Aisyah R.", "Tue 9:30 · Check-up", "Confirmed"],
        ["Daniel T.", "Tue 11:00 · Filling", "Confirmed"],
        ["Mei Ling", "Wed 2:30 · Braces consult", "New"],
        ["Ravi K.", "Thu 10:00 · Whitening", "Reminder sent"],
      ],
    },
  },
  reviews: {
    kind: "reviews",
    about: "Your real Google reviews appear on your site, and patients are asked for a review the day after their visit. Only real reviews are shown — never written for you.",
    features: ["Pick which pages show reviews", "Turn the review request on or off", "Skip patients who raised a complaint"],
    manage: "the Reviews app — requests sent, new reviews and where they show",
    labels: {
      site: "4.9 from 212 Google reviews",
      siteNote: "Real reviews from real patients",
      items: ["“Gentle and explained every step.”", "“Booking online took a minute.”"],
      action: "Read all reviews",
      app: "Reviews · Last 30 days",
      rows: [
        ["Request sent", "Aisyah R. · yesterday", "Waiting"],
        ["New review", "★★★★★ Daniel T.", "Showing"],
        ["New review", "★★★★☆ Mei Ling", "Showing"],
      ],
    },
  },
  estimates: {
    kind: "form",
    about: "People thinking about braces, implants or veneers ask for a consultation or estimate. You see every request in one list and follow up before they go elsewhere.",
    features: ["Choose which treatments offer an estimate", "Track each request from New to Accepted", "Automatic follow-ups after 3 and 10 days"],
    manage: "the Estimates app — requests, statuses and follow-ups",
    labels: {
      site: "Get an estimate",
      siteNote: "We reply within one working day",
      items: ["Treatment", "Your name", "Phone or WhatsApp"],
      action: "Request estimate",
      app: "Estimates",
      rows: [
        ["Nurul A.", "Braces", "New"],
        ["Jason W.", "Implant", "Estimate sent"],
        ["Farah Z.", "Veneers", "Accepted"],
      ],
    },
  },
  crm: {
    kind: "contacts",
    about: "Every patient and enquiry in one list, with their last visit. Patients due a check-up get a friendly reminder, and anyone away for a year gets a gentle invitation back.",
    features: ["See who's due a check-up", "Edit the recall and invitation messages", "Notes on each patient — no medical details"],
    manage: "the Patients app — your patient list, recalls and messages",
    labels: {
      site: "Your check-up is due",
      siteNote: "A WhatsApp message from the clinic",
      items: ["Hi Aisyah, it's been 6 months since your last check-up. Book a time that suits you?"],
      action: "Book now",
      app: "Patients",
      rows: [
        ["Aisyah R.", "Last visit 6 months ago", "Recall sent"],
        ["Daniel T.", "Last visit 2 months ago", "—"],
        ["Kumar S.", "Last visit 13 months ago", "Invited back"],
      ],
    },
  },
  payments: {
    kind: "payments",
    about: "Take deposits when patients book or accept an estimate, so fewer appointments are missed. Receipts are sent automatically and money goes to your own account.",
    features: ["Choose which bookings need a deposit, and how much", "Refund in one click", "Payouts to your bank account"],
    manage: "the Payments app — payments, refunds and payouts",
    labels: {
      site: "Pay your deposit",
      siteNote: "Braces consultation · Wed 2:30",
      items: ["Deposit", "RM 50"],
      action: "Pay RM 50",
      app: "Payments",
      rows: [
        ["Mei Ling", "Deposit · RM 50", "Paid"],
        ["Jason W.", "Deposit · RM 200", "Paid"],
        ["Payout", "To Maybank ••42", "Tomorrow"],
      ],
    },
  },
  gallery: {
    kind: "gallery",
    about: "Show before-and-after photos of your work, each with a “results vary” note. Only photos you confirm you have written consent for are published.",
    features: ["Upload photo pairs and pick a treatment for each", "Confirm consent per photo", "Hide any photo at any time"],
    manage: "the Gallery app — photos, consent and captions",
    labels: {
      site: "Before and after",
      siteNote: "Results vary from person to person",
      items: ["Whitening", "Braces", "Veneers"],
      action: "See more",
      app: "Gallery",
      rows: [
        ["Whitening · pair 1", "Consent confirmed", "Showing"],
        ["Braces · pair 2", "Consent confirmed", "Showing"],
        ["Veneers · pair 3", "Waiting for consent", "Hidden"],
      ],
    },
  },
  emergency: {
    kind: "page",
    about: "A page for toothache and emergencies: call and WhatsApp come first on phones, with an urgent-care notice. Same-day slots show up when Appointments is added.",
    features: ["Set the emergency number and hours", "Add after-hours advice", "Show same-day slots"],
    manage: "the Emergency page settings — number, hours and notice",
    labels: {
      site: "Toothache? Call us now",
      siteNote: "Same-day appointments, every day",
      items: ["Call 04-226 1180", "WhatsApp us"],
      action: "Call now",
      app: "Emergency page",
      rows: [
        ["Emergency number", "04-226 1180", "On"],
        ["Hours", "Every day, 9 am – 9 pm", "On"],
        ["Same-day slots", "From Appointments", "On"],
      ],
    },
  },
  branches: {
    kind: "locations",
    about: "A page for each branch and dentist. Patients pick where and who they want to see, and reminders come from the right branch.",
    features: ["Add branches with their own hours", "Add dentists and where they work", "Route bookings to the right branch"],
    manage: "the Branches app — branches, dentists and hours",
    labels: {
      site: "Choose a branch",
      siteNote: "Book with the dentist you prefer",
      items: ["George Town · 3 dentists", "Air Itam · 2 dentists"],
      action: "Book here",
      app: "Branches",
      rows: [
        ["George Town", "Dr. Aisyah, Dr. Wong, Dr. Lim", "Open"],
        ["Air Itam", "Dr. Ravi, Dr. Tan", "Open"],
      ],
    },
  },
  insurance: {
    kind: "form",
    about: "List the insurers and company panels you accept, so patients know before they call. Coverage questions go straight to your inbox.",
    features: ["Keep the list of insurers and panels up to date", "Answer coverage questions in one place"],
    manage: "the Insurance app — insurers, panels and questions",
    labels: {
      site: "Insurance and panels we accept",
      siteNote: "Not sure? Ask us before your visit",
      items: ["AIA", "Great Eastern", "Your company panel"],
      action: "Ask about coverage",
      app: "Insurance and panels",
      rows: [
        ["AIA", "Insurer", "Listed"],
        ["Great Eastern", "Insurer", "Listed"],
        ["Question", "Is scaling covered?", "New"],
      ],
    },
  },

  /* ---------------- lawyer ---------------- */
  consultations: {
    kind: "booking",
    about: "Clients request a consultation from any page — phone, video or in person. You confirm each request after a quick conflict check, and reminders go out before the meeting.",
    features: ["Choose meeting types, length and fees", "Confirm or decline each request", "Video links created automatically", "Reminders 24 hours and 2 hours before"],
    manage: "the Appointments app — consultation requests, your calendar and reminders",
    labels: {
      site: "Request a consultation",
      siteNote: "Initial consultation · 45 min",
      items: ["Tue 10:00", "Tue 3:00", "Wed 11:00", "Wed 4:30", "Thu 9:30", "Fri 2:00"],
      action: "Request consultation",
      app: "Consultations · This week",
      rows: [
        ["S. Rahman", "Tue 10:00 · Family", "Needs conflict check"],
        ["K. Tan", "Wed 11:00 · Property", "Confirmed"],
        ["J. Lee", "Thu 9:30 · Business", "Confirmed"],
      ],
    },
  },
  "case-enquiries": {
    kind: "form",
    about: "A short, confidential enquiry form — no case details. Enquiries that name another party are flagged for a conflict check, and everyone gets an auto-reply with your response time.",
    features: ["See each enquiry's area of law and urgency", "Conflict-check flag when another party is named", "Edit the auto-reply"],
    manage: "the Case enquiries app — enquiries, urgency and the auto-reply",
    labels: {
      site: "Tell us about your matter",
      siteNote: "Please don't include confidential details",
      items: ["Area of law", "How urgent is it?", "Phone or WhatsApp"],
      action: "Send enquiry",
      app: "Case enquiries",
      rows: [
        ["S. Rahman", "Family · within 48 hours", "Conflict check"],
        ["M. Ong", "Property · soon", "New"],
        ["A. Hassan", "Not sure · exploring", "Replied"],
      ],
    },
  },
  "law-clients": {
    kind: "contacts",
    about: "Every client and enquiry in one list, with their matter type and when you last spoke — never case details. Reminders tell you who to follow up.",
    features: ["See who's waiting for a reply", "Follow-up reminders for you", "Matter type and last contact for each client"],
    manage: "the Clients app — your client list and follow-ups",
    labels: {
      site: "We'll be in touch",
      siteNote: "A reply from the firm",
      items: ["Thanks for your enquiry. A lawyer will call you within one working day."],
      action: "Reply",
      app: "Clients and enquiries",
      rows: [
        ["S. Rahman", "Family · last contact today", "Follow up"],
        ["K. Tan", "Property · 3 days ago", "Active"],
        ["J. Lee", "Business · 2 weeks ago", "Active"],
      ],
    },
  },
  "fee-proposals": {
    kind: "form",
    about: "Businesses describe the work they need and get a fee proposal with scope, fee and timeline. You track each one from New to Accepted, with follow-ups if they go quiet.",
    features: ["Track each request from New to Accepted", "Follow-ups after 3 and 10 days", "Proposal validity dates"],
    manage: "the Fee proposals app — requests, proposals and follow-ups",
    labels: {
      site: "Request a fee proposal",
      siteNote: "Scope, fee and timeline within two working days",
      items: ["Type of work", "Company name", "When do you need it?"],
      action: "Request proposal",
      app: "Fee proposals",
      rows: [
        ["Kopi Sudut Sdn Bhd", "Shareholder agreement", "Proposal sent"],
        ["Bloom Studio", "Lease review", "New"],
        ["Move Well", "Monthly retainer", "Accepted"],
      ],
    },
  },
  "legal-payments": {
    kind: "payments",
    about: "Clients pay a consultation fee when they book, or a deposit when they accept a fee proposal. It's for your fees only — client money and retainers stay under your trust account rules.",
    features: ["Set consultation fees and deposits", "Receipts sent automatically", "Payouts to your office account"],
    manage: "the Payments app — payments, receipts and payouts",
    labels: {
      site: "Pay the consultation fee",
      siteNote: "Initial consultation · Tue 10:00",
      items: ["Consultation fee", "RM 300"],
      action: "Pay RM 300",
      app: "Payments",
      rows: [
        ["S. Rahman", "Consultation · RM 300", "Paid"],
        ["Bloom Studio", "Deposit · RM 1,500", "Paid"],
        ["Payout", "To office account ••18", "Tomorrow"],
      ],
    },
  },
  "urgent-line": {
    kind: "page",
    about: "An urgent help page and a banner on every page: call and WhatsApp first on phones, a short call-back form, and a safety notice.",
    features: ["Set the urgent number and hours", "Turn the banner on or off", "Get urgent call-back requests on WhatsApp"],
    manage: "the Urgent line settings — number, hours and call-backs",
    labels: {
      site: "Urgent matter? Call us now",
      siteNote: "A lawyer answers 24 hours a day",
      items: ["Call 03-2283 4410", "WhatsApp us"],
      action: "Call now",
      app: "Urgent line",
      rows: [
        ["Urgent number", "03-2283 4410", "On"],
        ["Banner", "Every page", "On"],
        ["Call-back", "J. Lee · 10:42 pm", "New"],
      ],
    },
  },
  "client-updates": {
    kind: "contacts",
    about: "Reminds you to update each open matter every two weeks, with a ready status message that never carries case details.",
    features: ["Choose how often you're reminded", "Edit the status message", "Mark matters closed"],
    manage: "the Client updates app — open matters and reminders",
    labels: {
      site: "We have an update for you",
      siteNote: "A message from the firm",
      items: ["We have an update on your matter. Reply to arrange a call."],
      action: "Arrange a call",
      app: "Client updates",
      rows: [
        ["S. Rahman", "Updated 13 days ago", "Due"],
        ["K. Tan", "Updated 4 days ago", "OK"],
        ["J. Lee", "Updated today", "OK"],
      ],
    },
  },
  articles: {
    kind: "articles",
    about: "Helpful articles in plain words, each with a “not legal advice” note. Every draft waits for your review before it's published.",
    features: ["Approve every article before it goes live", "Suggested topics from your practice areas", "Link articles from practice-area pages"],
    manage: "the Articles app — drafts, reviews and published articles",
    labels: {
      site: "Legal information, in plain words",
      siteNote: "General information, not legal advice",
      items: ["What happens in an uncontested divorce?", "Buying your first home: the legal steps"],
      action: "Read article",
      app: "Articles",
      rows: [
        ["Uncontested divorce", "Family", "Waiting for review"],
        ["Your first home", "Property", "Published"],
        ["Service contracts", "Business", "Draft"],
      ],
    },
  },
  "legal-reviews": {
    kind: "reviews",
    about: "Your real Google reviews on your site, and a review request after a matter closes — only where your rules allow it, and never for clients who raised a complaint.",
    features: ["Pick which pages show reviews", "Turn the review request on or off", "Skip clients who raised a complaint"],
    manage: "the Reviews app — requests, new reviews and where they show",
    labels: {
      site: "4.9 from 64 Google reviews",
      siteNote: "Real reviews, with consent",
      items: ["“Explained everything in plain words.”", "“Clear about fees from the start.”"],
      action: "Read all reviews",
      app: "Reviews · Last 30 days",
      rows: [
        ["Request sent", "K. Tan · matter closed", "Waiting"],
        ["New review", "★★★★★ J. Lee", "Showing"],
      ],
    },
  },
  lawyers: {
    kind: "locations",
    about: "A profile for each lawyer and a page for each office. Clients book with a specific lawyer, and requests go to whoever handles that area of law.",
    features: ["Add lawyers, their areas and registration numbers", "Add offices with their own hours", "Route requests by area of law"],
    manage: "the Lawyers and offices app — profiles, offices and routing",
    labels: {
      site: "Book with a lawyer",
      siteNote: "Choose who you'd like to speak to",
      items: ["Nadia Aziz · Family, wills", "Marcus Lim · Property, business"],
      action: "Request a time",
      app: "Lawyers and offices",
      rows: [
        ["Nadia Aziz", "Family · Bangsar", "Taking requests"],
        ["Marcus Lim", "Property · Bangsar", "Taking requests"],
      ],
    },
  },
}

/** a fallback for modules without their own showcase */
export function showcaseOf(id: string, name: string, included: string[]): Showcase {
  return (
    SHOWCASE[id] ?? {
      kind: "page",
      about: included.join(". ") + ".",
      features: included,
      manage: `the ${name} app`,
      labels: { site: name, siteNote: "", items: included.slice(0, 2), action: "Open", app: name, rows: included.map((x) => [x, "", "On"] as [string, string, string]) },
    }
  )
}
