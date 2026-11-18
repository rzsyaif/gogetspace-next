/**
 * One switch for everything that differs by niche outside the engine: the plan (brief, page plan, open
 * questions), the business's name, and what the web search finds for each niche's demo business.
 */
import type { BriefSection, OpenQuestion } from "@/lib/generation/brief"
import type { PageNode } from "@/lib/bakti/sitemap"
import { DENTIST_PLAN, RAHMA } from "./dentist-plan"
import { LAWYER_PLAN, LAW_DEMO } from "./lawyer-plan"
import type { PlaybookState } from "./engine"
import type { NicheId } from "./types"

export interface NichePlan {
  brief: (st: PlaybookState) => BriefSection[]
  sitemap: (st: PlaybookState) => PageNode
  priority: (st: PlaybookState) => string[]
  questions: (st: PlaybookState) => OpenQuestion[]
  name: (st: PlaybookState) => string
  isDemo: (st: PlaybookState) => boolean
  domain: (st: PlaybookState) => string
}

const PLANS: Record<NicheId, NichePlan> = { dentist: DENTIST_PLAN, lawyer: LAWYER_PLAN }
export const planOf = (st: Pick<PlaybookState, "niche">): NichePlan => PLANS[st.niche] ?? DENTIST_PLAN

/** what the search finds for a niche's demo business, and what it fills in */
export interface DemoFound {
  name: string
  place: string
  rating: string
  people: string[]
  hours: string
  results: { title: string; site: string }[]
  /** the size the search implies */
  scale: string
}

export function demoOf(niche: NicheId): DemoFound {
  if (niche === "lawyer")
    return {
      name: LAW_DEMO.name,
      place: LAW_DEMO.place,
      rating: LAW_DEMO.rating,
      people: LAW_DEMO.lawyers,
      hours: LAW_DEMO.hours,
      scale: "lawyers",
      results: [
        { title: `${LAW_DEMO.name} — ${LAW_DEMO.rating.replace(" from", " ·")}`, site: "www.google.com/maps" },
        { title: `${LAW_DEMO.name} · ${LAW_DEMO.lawyers.join(" & ")}`, site: "www.linkedin.com" },
        { title: `${LAW_DEMO.lawyers[0]} — advocates and solicitors directory`, site: "www.malaysianbar.org.my" },
      ],
    }
  return {
    name: RAHMA.name,
    place: RAHMA.place,
    rating: RAHMA.rating,
    people: RAHMA.dentists,
    hours: RAHMA.hours,
    scale: "dentists",
    results: [
      { title: `${RAHMA.name} — ${RAHMA.rating.replace(" from", " ·")}`, site: "www.google.com/maps" },
      { title: `${RAHMA.name} · ${RAHMA.dentists.join(" & ")}`, site: "www.facebook.com" },
      { title: `${RAHMA.dentists[0]} — dental practitioner register`, site: "mdc.moh.gov.my" },
    ],
  }
}
