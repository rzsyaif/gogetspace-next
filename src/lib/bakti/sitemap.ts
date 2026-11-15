/** The page plan the agent proposes for a dental practice (matches the Figma "Sitemap Plan"). */

export interface PageNode {
  id: string
  title: string
  /** URL path under the site root; "" is the homepage */
  slug: string
  /** short purpose shown in the list view */
  purpose: string
  /** sections the agent plans to generate on this page, top to bottom */
  sections?: string[]
  children?: PageNode[]
  /** added by the person in the sitemap step (built with a generic layout) */
  custom?: boolean
}

export const SITEMAP: PageNode = {
  id: "home",
  sections: ["Hero", "Trust strip", "Popular treatments", "How a first visit works", "Our dentists", "Patient reviews", "Hours & location", "FAQ & booking"],
  title: "Homepage",
  slug: "",
  purpose: "Make the next step obvious — book, call or WhatsApp",
  children: [
    {
      id: "treatments",
      sections: ["Page header", "Treatments by category", "Prices note"],
      title: "Treatments",
      slug: "treatments",
      purpose: "Help patients find the treatment they need",
      children: [
        { id: "general", sections: ["Page header", "What it is", "Who it is for", "Step by step", "Comfort info", "Aftercare", "Price note", "FAQ", "Call to action"], title: "General Dentistry", slug: "treatments/general", purpose: "Check-ups, cleaning, fillings and extractions" },
        { id: "cosmetic", sections: ["Page header", "What it is", "Who it is for", "Step by step", "Comfort info", "Aftercare", "Price note", "FAQ", "Call to action"], title: "Cosmetic Dentistry", slug: "treatments/cosmetic", purpose: "Whitening, veneers and bonding" },
        { id: "orthodontics", sections: ["Page header", "What it is", "Who it is for", "Step by step", "Comfort info", "Aftercare", "Price note", "FAQ", "Call to action"], title: "Orthodontics", slug: "treatments/orthodontics", purpose: "Braces, aligners and retainers" },
        { id: "implants", sections: ["Page header", "What it is", "Who it is for", "Step by step", "Comfort info", "Aftercare", "Price note", "FAQ", "Call to action"], title: "Dental Implants", slug: "treatments/implants", purpose: "Single, multiple and full-arch implants" },
      ],
    },
    {
      id: "dentists",
      sections: ["Page header", "Dentist profiles", "Book with this dentist"],
      title: "Our Dentists",
      slug: "our-dentists",
      purpose: "Build trust with real profiles, credentials and areas of focus",
    },
    {
      id: "new-patients",
      sections: ["Page header", "What to bring", "Step-by-step first visit", "Patient form", "Payment & insurance", "Support for nervous patients"],
      title: "New Patients",
      slug: "new-patients",
      purpose: "Reduce first-visit anxiety with a clear guide",
    },
    {
      id: "prices",
      sections: ["Page header", "Price table with estimate note", "Accepted insurers", "Instalment information"],
      title: "Prices & Insurance",
      slug: "prices",
      purpose: "Remove cost uncertainty with honest from-prices",
    },
    {
      id: "locations",
      sections: ["Page header", "Address, hours & map", "Phone & WhatsApp", "Transport & parking", "Emergency line"],
      title: "Contact & Locations",
      slug: "contact",
      purpose: "Make reaching the clinic effortless",
    },
    {
      id: "faq",
      sections: ["Page header", "Questions & answers"],
      title: "FAQ",
      slug: "faq",
      purpose: "Cost, pain, children, insurance, cancellation and check-up frequency",
    },
    { id: "terms", sections: ["Page header", "Legal sections"], title: "Terms and Conditions", slug: "terms", purpose: "Terms of service" },
    { id: "privacy", sections: ["Page header", "Legal sections"], title: "Privacy Policy", slug: "privacy", purpose: "How patient data is handled" },
  ],
}

/** Which pages each plan builds, most important first (Starter builds up to 5). */
export const PAGE_PRIORITY = ["home", "treatments", "locations", "new-patients", "prices", "general", "dentists", "faq", "cosmetic", "orthodontics", "implants", "terms", "privacy"]

export type Plan = "free" | "starter" | "business"
export const PLAN_PAGE_LIMIT: Record<Plan, number> = { free: 1, starter: 5, business: Infinity }

export function flatten(node: PageNode, depth = 0, out: (PageNode & { depth: number; parentId?: string })[] = [], parentId?: string) {
  out.push({ ...node, depth, parentId })
  node.children?.forEach((c) => flatten(c, depth + 1, out, node.id))
  return out
}

/** ids of the pages the plan includes */
export function unlockedIds(root: PageNode, plan: Plan): Set<string> {
  const all = flatten(root).map((p) => p.id)
  const ordered = [...PAGE_PRIORITY.filter((id) => all.includes(id)), ...all.filter((id) => !PAGE_PRIORITY.includes(id))]
  return new Set(ordered.slice(0, PLAN_PAGE_LIMIT[plan]))
}

/** sections for a page the person added themselves (built with a generic layout) */
export const CUSTOM_SECTIONS = ["Page header", "Overview", "Details", "Next steps"]
export const sectionsOf = (p: PageNode) => p.sections ?? CUSTOM_SECTIONS

export const KNOWN_SLUGS = flatten(SITEMAP).map((p) => p.slug)
