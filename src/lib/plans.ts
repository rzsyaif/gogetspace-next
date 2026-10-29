import type { Plan } from "@/lib/bakti/sitemap"

export type { Plan }

/** The three plans — shown on the marketing pricing section and, per website, in the editor's Plan tab. */
export interface PlanInfo {
  id: Plan
  name: string
  desc: string
  /** USD per month; 0 for Free */
  price: number
  priceLabel: string
  period: string
  cta: string
  features: string[]
  featured?: boolean
  /** pages the plan builds */
  pages: number
  /** how far back analytics go */
  analyticsDays: number
  customDomain: boolean
  /** monthly agent credits for this website */
  credits: number
  contactForm: boolean
  booking: boolean
  prioritySupport: boolean
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    desc: "A simple site to get found online.",
    price: 0,
    priceLabel: "FREE",
    period: "forever",
    cta: "Start for Free",
    features: ["Only homepage", "Hosting and SSL included", "Free .get.space domain"],
    pages: 1,
    analyticsDays: 7,
    customDomain: false,
    credits: 50,
    contactForm: false,
    booking: false,
    prioritySupport: false,
  },
  {
    id: "starter",
    name: "Starter",
    desc: "A full website for a small practice.",
    price: 9,
    priceLabel: "$9",
    period: "/ month",
    cta: "Start with Starter",
    features: ["Everything in Free", "Up to 5 pages", "Connect to custom domain *", "Contact form"],
    pages: 5,
    analyticsDays: 30,
    customDomain: true,
    credits: 200,
    contactForm: true,
    booking: false,
    prioritySupport: false,
  },
  {
    id: "business",
    name: "Business",
    desc: "For practices that take bookings online.",
    price: 19,
    priceLabel: "$19",
    period: "/ month",
    cta: "Start with Business",
    features: ["Everything in Starter", "Unlimited pages", "Appointment booking", "Priority support"],
    featured: true,
    pages: Infinity,
    analyticsDays: 365,
    customDomain: true,
    credits: 500,
    contactForm: true,
    booking: true,
    prioritySupport: true,
  },
]

export const planInfo = (id: Plan) => PLANS.find((p) => p.id === id)!
export const PLAN_RANK: Record<Plan, number> = { free: 0, starter: 1, business: 2 }

const historyLabel = (d: number) => (d >= 365 ? "12 months" : `${d} days`)

/** What each plan includes, row by row — for comparing two plans side by side. */
export const PLAN_ROWS: { key: string; label: string; value: (p: PlanInfo) => string | boolean; rank: (p: PlanInfo) => number }[] = [
  { key: "price", label: "Price", value: (p) => (p.price ? `$${p.price} / month` : "Free"), rank: (p) => p.price },
  { key: "pages", label: "Pages", value: (p) => (p.pages === Infinity ? "Unlimited" : p.pages === 1 ? "Homepage only" : `Up to ${p.pages}`), rank: (p) => p.pages },
  { key: "credits", label: "Agent credits a month", value: (p) => String(p.credits), rank: (p) => p.credits },
  { key: "analytics", label: "Analytics history", value: (p) => historyLabel(p.analyticsDays), rank: (p) => p.analyticsDays },
  { key: "domain", label: "Your own domain", value: (p) => p.customDomain, rank: (p) => Number(p.customDomain) },
  { key: "form", label: "Contact form", value: (p) => p.contactForm, rank: (p) => Number(p.contactForm) },
  { key: "booking", label: "Appointment booking", value: (p) => p.booking, rank: (p) => Number(p.booking) },
  { key: "support", label: "Priority support", value: (p) => p.prioritySupport, rank: (p) => Number(p.prioritySupport) },
  { key: "hosting", label: "Hosting, SSL and .get.space address", value: () => true, rank: () => 1 },
]
