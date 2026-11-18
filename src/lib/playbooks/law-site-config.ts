/**
 * What the generated law-firm site needs to know about the plan, carried in the preview URL's query string (like
 * the dental site): name, place, the rules followed, answers, goals and the modules added.
 */
import { restriction, withDefaults, type PlaybookState } from "./engine"
import { AREAS, LAW_DEMO, areasFor, firmName, isDemoFirm, type PracticeArea } from "./lawyer-plan"

export interface LawConfig {
  name: string
  place: string | null
  jurisdiction: string
  areas: string[]
  clients: string
  scale: string
  fees: string
  meeting: string
  urgent: string
  goals: string[]
  modules: string[]
  /** reviews are allowed under the rules followed */
  reviews: boolean
  demo: boolean
  team?: { name: string; reg?: string }[]
}

export const DEFAULT_LAW_CONFIG: LawConfig = {
  name: LAW_DEMO.name,
  place: LAW_DEMO.place,
  jurisdiction: "my",
  areas: ["family", "property"],
  clients: "individuals",
  scale: "lawyers",
  fees: "from",
  meeting: "paid",
  urgent: "call",
  goals: ["LG1", "LG7"],
  modules: [],
  reviews: false,
  demo: true,
}

export function lawConfigFromPb(pb: PlaybookState): LawConfig {
  const st = withDefaults(pb)
  const a = st.answers
  return {
    name: firmName(st),
    place: st.place ?? (isDemoFirm(st) ? LAW_DEMO.place : null),
    jurisdiction: a.jurisdiction!.value,
    areas: areasFor(st).map((x) => x.id),
    clients: a.clients!.value,
    scale: a.scale!.value,
    fees: a.prices!.value,
    meeting: a.meeting!.value,
    urgent: a.urgent!.value,
    goals: st.goals,
    modules: Object.entries(st.decisions)
      .filter(([, d]) => d === "added")
      .map(([id]) => id),
    reviews: !restriction(st, "legal-reviews"),
    demo: isDemoFirm(st),
    team: (st.team?.people ?? []).filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), reg: p.reg?.trim() || undefined })),
  }
}

export function encodeLawConfig(c: LawConfig): string {
  const q = new URLSearchParams({
    n: c.name,
    j: c.jurisdiction,
    a: c.areas.join(","),
    cl: c.clients,
    sc: c.scale,
    pr: c.fees,
    mt: c.meeting,
    ur: c.urgent,
    g: c.goals.join(","),
    m: c.modules.join(","),
  })
  if (c.place) q.set("p", c.place)
  if (c.reviews) q.set("rv", "1")
  if (c.team?.length) {
    q.set("dn", c.team.map((p) => p.name).join("|"))
    q.set("dr", c.team.map((p) => p.reg ?? "").join("|"))
  }
  return q.toString()
}

export function decodeLawConfig(q: URLSearchParams): LawConfig {
  if (!q.get("n")) return DEFAULT_LAW_CONFIG
  const list = (k: string) => (q.get(k) ?? "").split(",").filter(Boolean)
  const name = q.get("n")!
  return {
    name,
    place: q.get("p"),
    jurisdiction: q.get("j") ?? "unsure",
    areas: list("a").length ? list("a") : ["family", "property", "business", "estates"],
    clients: q.get("cl") ?? "individuals",
    scale: q.get("sc") ?? "solo",
    fees: q.get("pr") ?? "from",
    meeting: q.get("mt") ?? "paid",
    urgent: q.get("ur") ?? "call",
    goals: list("g").length ? list("g") : ["LG1"],
    modules: list("m"),
    reviews: q.get("rv") === "1",
    demo: /\baziz\b/i.test(name),
    team: q.get("dn") ? q.get("dn")!.split("|").map((n, i) => ({ name: n, reg: (q.get("dr") ?? "").split("|")[i] || undefined })) : undefined,
  }
}

export const siteAreas = (c: LawConfig): PracticeArea[] => c.areas.map((id) => AREAS[id]).filter(Boolean)

/** URL of a page of the law-firm preview site */
export const lawPreviewUrl = (style: string, slug: string, c: LawConfig) => `/preview/law/${style}${slug ? `/${slug}` : ""}?${encodeLawConfig(c)}`

/** every page slug the law site knows (prerendered in each law style) */
export const LAW_SLUGS = ["", "practice-areas", "our-lawyers", "how-we-work", "fees", "contact", "faq", "book", "enquiry", "fee-proposal", "urgent", "articles", "offices", "privacy", "terms", ...Object.values(AREAS).map((a) => a.slug)]
