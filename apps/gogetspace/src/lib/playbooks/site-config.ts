/**
 * What the generated dental site needs to know about the plan, carried in the preview URL's query string so one
 * prerendered page per style and slug can show any clinic: name, place, answers, goals and the modules added.
 */
import { withDefaults, type PlaybookState } from "./engine"
import { RAHMA, TREATMENTS, clinicName, isDemoClinic, treatmentsFor, type Treatment } from "./dentist-plan"

export interface DentalConfig {
  name: string
  place: string | null
  focus: string
  scale: string
  prices: string
  emergency: string
  insurance: string
  goals: string[]
  modules: string[]
  consent: boolean
  demo: boolean
  /** dentists the owner typed on the size question */
  team?: { name: string; reg?: string }[]
}

export const DEFAULT_CONFIG: DentalConfig = {
  name: RAHMA.name,
  place: RAHMA.place,
  focus: "general",
  scale: "dentists",
  prices: "from",
  emergency: "call",
  insurance: "none",
  goals: ["G1", "G6"],
  modules: ["appointments", "reviews"],
  consent: false,
  demo: true,
}

export function configFromPb(pb: PlaybookState): DentalConfig {
  const st = withDefaults(pb)
  const a = st.answers
  return {
    name: clinicName(st),
    place: st.place ?? (isDemoClinic(st) ? RAHMA.place : null),
    focus: a.focus!.value,
    scale: a.scale!.value,
    prices: a.prices!.value,
    emergency: a.emergency!.value,
    insurance: a.insurance!.value,
    goals: st.goals,
    modules: Object.entries(st.decisions)
      .filter(([, d]) => d === "added")
      .map(([id]) => id),
    consent: st.consent.includes("gallery"),
    demo: isDemoClinic(st),
    team: (st.team?.people ?? []).filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), reg: p.reg?.trim() || undefined })),
  }
}

export function encodeConfig(c: DentalConfig): string {
  const q = new URLSearchParams({
    n: c.name,
    f: c.focus,
    sc: c.scale,
    pr: c.prices,
    em: c.emergency,
    in: c.insurance,
    g: c.goals.join(","),
    m: c.modules.join(","),
  })
  if (c.place) q.set("p", c.place)
  if (c.consent) q.set("c", "1")
  if (c.team?.length) {
    q.set("dn", c.team.map((p) => p.name).join("|"))
    q.set("dr", c.team.map((p) => p.reg ?? "").join("|"))
  }
  return q.toString()
}

export function decodeConfig(q: URLSearchParams): DentalConfig {
  if (!q.get("n")) return DEFAULT_CONFIG
  const list = (k: string) => (q.get(k) ?? "").split(",").filter(Boolean)
  const name = q.get("n")!
  return {
    name,
    place: q.get("p"),
    focus: q.get("f") ?? "general",
    scale: q.get("sc") ?? "solo",
    prices: q.get("pr") ?? "from",
    emergency: q.get("em") ?? "call",
    insurance: q.get("in") ?? "none",
    goals: list("g").length ? list("g") : ["G1"],
    modules: list("m"),
    consent: q.get("c") === "1",
    demo: /rahma/i.test(name),
    team: q.get("dn") ? q.get("dn")!.split("|").map((n, i) => ({ name: n, reg: (q.get("dr") ?? "").split("|")[i] || undefined })) : undefined,
  }
}

/** the treatments the site lists, as the plan would */
export const siteTreatments = (c: DentalConfig): Treatment[] => treatmentsFor({ answers: { focus: { value: c.focus, source: "owner" } } } as PlaybookState)

/** URL of a page of the dental preview site */
export const dentalPreviewUrl = (style: string, slug: string, c: DentalConfig) => `/preview/dental/${style}${slug ? `/${slug}` : ""}?${encodeConfig(c)}`

/** every page slug the dental site knows (prerendered in each dental style) */
export const DENTAL_SLUGS = [
  "",
  "treatments",
  "our-dentists",
  "new-patients",
  "prices",
  "contact",
  "faq",
  "book",
  "consultation",
  "emergency",
  "branches",
  "before-and-after",
  "kids",
  "privacy",
  "terms",
  ...Object.values(TREATMENTS).map((t) => t.slug),
]
