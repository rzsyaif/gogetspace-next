/** The page plan the agent proposes (matches the Figma "Sitemap Plan"). */

export interface PageNode {
  id: string
  title: string
  /** URL path under the site root; "" is the homepage */
  slug: string
  /** short purpose shown in the list view */
  purpose: string
  children?: PageNode[]
  /** added by the person in the sitemap step (built with a generic layout) */
  custom?: boolean
}

export const SITEMAP: PageNode = {
  id: "home",
  title: "Homepage",
  slug: "",
  purpose: "What the lab does, popular tests, locations and booking",
  children: [
    {
      id: "services",
      title: "Services",
      slug: "services",
      purpose: "Overview of everything the lab offers",
      children: [
        { id: "tests", title: "Tests & Packages", slug: "tests-and-packages", purpose: "Searchable test list and screening packages with prices" },
        { id: "doctors", title: "For Doctors & Clinics", slug: "for-doctors", purpose: "Referrals, courier pick-up and e-reports" },
        { id: "corporate", title: "Corporate Screening", slug: "corporate-screening", purpose: "Pre-employment and annual staff screening" },
        { id: "prepare", title: "Prepare for Your Test", slug: "prepare-for-your-test", purpose: "Fasting and preparation instructions" },
      ],
    },
    { id: "about", title: "About Us", slug: "about", purpose: "Story, accreditation and team" },
    { id: "locations", title: "Locations & Contact", slug: "locations", purpose: "Three centres with hours, map and contact form" },
    { id: "terms", title: "Terms and Conditions", slug: "terms", purpose: "Terms of service" },
    { id: "privacy", title: "Privacy Policy", slug: "privacy", purpose: "How patient data is handled (PDPA 2010)" },
    { id: "faq", title: "FAQ", slug: "faq", purpose: "Answers to common questions" },
  ],
}

/** Which pages each plan builds, most important first (Starter builds up to 5). */
export const PAGE_PRIORITY = ["home", "tests", "locations", "services", "prepare", "doctors", "corporate", "about", "faq", "terms", "privacy"]

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

export const KNOWN_SLUGS = flatten(SITEMAP).map((p) => p.slug)
