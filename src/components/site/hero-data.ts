import { Coffee, HeartPulse, Scale, Scissors, Activity, Smile, type LucideIcon } from "lucide-react"

/** The kinds of business the hero sentence offers, with what their sample website looks like. */
export interface Business {
  id: string
  /** reads after "I run a…" */
  label: string
  sampleName: string
  samplePlace: string
  headline: string
  sub: string
  cta: string
  services: string[]
  Icon: LucideIcon
  /** the sample site's colors: brand, a soft tint, and a deep shade */
  color: { brand: string; tint: string; deep: string }
}

export const BUSINESSES: Business[] = [
  {
    id: "dental",
    label: "dental clinic",
    sampleName: "Rahma Family Dental",
    samplePlace: "Penang",
    headline: "Gentle dental care for the whole family",
    sub: "Clear prices before any treatment, and reminders so you never miss a check-up.",
    cta: "Book a check-up",
    services: ["Check-ups", "Fillings", "Braces"],
    Icon: Smile,
    color: { brand: "#1F6FD1", tint: "#E3EFFC", deep: "#0E3A73" },
  },
  {
    id: "law",
    label: "law firm",
    sampleName: "Hassan & Partners",
    samplePlace: "Kuala Lumpur",
    headline: "Clear legal advice from the very first call",
    sub: "Family, property and business matters, explained in plain words.",
    cta: "Book a consultation",
    services: ["Family law", "Property", "Contracts"],
    Icon: Scale,
    color: { brand: "#9A7432", tint: "#F4EDE1", deep: "#1E2A44" },
  },
  {
    id: "clinic",
    label: "medical clinic",
    sampleName: "Sehat Medical Clinic",
    samplePlace: "Jakarta",
    headline: "Your neighbourhood doctor, open seven days",
    sub: "Walk in or book ahead. Check-ups, vaccinations and screenings.",
    cta: "Book a visit",
    services: ["Check-ups", "Vaccinations", "Screening"],
    Icon: HeartPulse,
    color: { brand: "#0F7B5F", tint: "#DFF3EC", deep: "#0A3D30" },
  },
  {
    id: "physio",
    label: "physiotherapy practice",
    sampleName: "Move Well Physio",
    samplePlace: "Singapore",
    headline: "Get back to moving without the pain",
    sub: "Hands-on treatment and a plan you can follow at home.",
    cta: "Book a session",
    services: ["Sports injuries", "Back & neck", "Rehab"],
    Icon: Activity,
    color: { brand: "#D9572B", tint: "#FCE9E1", deep: "#5C2210" },
  },
  {
    id: "salon",
    label: "beauty salon",
    sampleName: "Bloom Beauty Studio",
    samplePlace: "Bandung",
    headline: "Look good, feel even better",
    sub: "Hair, nails and facials by a team that listens first.",
    cta: "Book an appointment",
    services: ["Hair", "Nails", "Facials"],
    Icon: Scissors,
    color: { brand: "#B83C72", tint: "#FBE6EF", deep: "#4F1430" },
  },
  {
    id: "cafe",
    label: "café",
    sampleName: "Kopi Sudut",
    samplePlace: "Yogyakarta",
    headline: "Good coffee and slow mornings",
    sub: "Single-origin coffee, breakfast all day and pastries baked here.",
    cta: "See the menu",
    services: ["Coffee", "Breakfast", "Pastries"],
    Icon: Coffee,
    color: { brand: "#7A4A2A", tint: "#F3E9E0", deep: "#33200F" },
  },
]

export interface Goal {
  id: "bookings" | "enquiries" | "trust" | "prices"
  /** reads after "and I want…" */
  label: string
}

export const GOALS: Goal[] = [
  { id: "bookings", label: "more bookings" },
  { id: "enquiries", label: "more enquiries" },
  { id: "trust", label: "people to trust me" },
  { id: "prices", label: "to show my prices" },
]

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "your-business"

/** what the agent receives when the sentence is sent */
export const briefFrom = (b: Business, name: string, place: string, g: Goal) =>
  `Website for ${name.trim() || `my ${b.label}`}, a ${b.label}${place.trim() ? ` in ${place.trim()}` : ""}. Main goal: ${g.label}.`
