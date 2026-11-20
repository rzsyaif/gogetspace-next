"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { Plan } from "@/lib/plans"
import { flatten } from "@/lib/bakti/sitemap"
import type { Site, SiteModule } from "@/lib/account/data"
import { decide, moduleById } from "@/lib/playbooks/engine"
import { accountActions, useSite } from "@/lib/account/store"
import type { PlanUsage } from "@/components/account/plan-panel"
import { useGen } from "./gen-provider"
import { siteName } from "@/lib/generation/state"

/**
 * The website the editor is working on. In the generation flow it's the site being created (plan and status
 * come from the flow); on /sites/[id] it's one of the account's websites (plan and status from the account).
 */
export interface EditorSite {
  mode: "flow" | "site"
  site: Site
  plan: Plan
  setPlan: (p: Plan, charge?: number) => void
  usage: PlanUsage
  /** how plan changes are billed: "site" pays monthly per website; a site still being created pays at publish */
  billing: { billed: boolean; scheduled?: { plan: Plan; on: string }; schedule: (p: Plan) => void; cancelScheduled: () => void }
  /** add-on modules for a playbook site (null for other sites) */
  modules: ModulesApi | null
}

export interface ModulesApi {
  list: SiteModule[]
  add: (id: string) => void
  remove: (id: string) => void
  activate: (id: string) => void
}

const Ctx = createContext<EditorSite | null>(null)

export function useEditorSite() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useEditorSite outside an editor")
  return c
}

/** the editor's site when there is one (chat cards also render outside an editor) */
export const useEditorSiteMaybe = () => useContext(Ctx)

/** the site being created in /generate */
export function FlowSiteProvider({ children }: { children: ReactNode }) {
  const { s, dispatch } = useGen()
  const pages = flatten(s.sitemap)
  const built = Object.values(s.pages).filter((p) => p === "built").length
  const site: Site = {
    id: "new-site",
    name: s.pb ? siteName(s) : "Bakti Analisa Clinical Laboratory Penang",
    status: s.publish.status === "live" ? "live" : "draft",
    plan: s.plan,
    freeDomain: s.publish.domain,
    domain: null,
    themeId: s.styleId,
    built: s.phase === "create",
    prompt: s.prompt,
    lastEdited: "just now",
    pagesBuilt: built,
    pagesPlanned: pages.length,
    creditsUsed: s.credits,
  }
  const pb = s.pb
  const modules: ModulesApi | null = pb
    ? {
        list: Object.entries(pb.decisions)
          .filter(([, d]) => d === "added")
          .map(([id]) => ({ id, status: moduleById(id).needsAccount && !pb.activated.includes(id) ? "test" : "live" })),
        add: (id) => dispatch({ type: "pbDecide", module: id, decision: "added" }),
        remove: (id) => dispatch({ type: "pbDecide", module: id, decision: "later" }),
        activate: (id) => dispatch({ type: "pbActivate", module: id }),
      }
    : null
  return (
    <Ctx.Provider
      value={{
        mode: "flow",
        site,
        plan: s.plan,
        setPlan: (plan) => dispatch({ type: "plan", plan }),
        usage: { pagesBuilt: built, pagesPlanned: pages.length, creditsUsed: s.credits, customDomain: false, domain: null, freeDomain: s.publish.domain },
        billing: { billed: false, schedule: (plan) => dispatch({ type: "plan", plan }), cancelScheduled: () => {} },
        modules,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

/** one of the account's websites, opened from the dashboard */
export function AccountSiteProvider({ siteId, children }: { siteId: string; children: ReactNode }) {
  const site = useSite(siteId)
  const { s, dispatch } = useGen()
  if (!site) return null
  // the account's add-ons are the source of truth; the plan in the editor follows them so the preview matches
  const modules: ModulesApi | null =
    site.modules && s.pb
      ? {
          list: site.modules,
          add: (id) => {
            const decisions = decide(s.pb!.decisions, id, "added", s.pb!.goals)
            for (const [mid, d] of Object.entries(decisions)) if (d === "added") accountActions.addModule(site.id, mid, moduleById(mid).price, moduleById(mid).name, !!moduleById(mid).needsAccount)
            dispatch({ type: "pbDecide", module: id, decision: "added" })
          },
          remove: (id) => {
            accountActions.removeModule(site.id, id)
            for (const m of site.modules!) if (moduleById(m.id).dependsOn?.includes(id) && !moduleById(m.id).dependsOn!.some((d) => d !== id && site.modules!.some((x) => x.id === d))) accountActions.removeModule(site.id, m.id)
            dispatch({ type: "pbDecide", module: id, decision: "later" })
          },
          activate: (id) => {
            accountActions.activateModule(site.id, id)
            dispatch({ type: "pbActivate", module: id })
          },
        }
      : null
  return (
    <Ctx.Provider
      value={{
        mode: "site",
        site,
        plan: site.plan,
        setPlan: (plan, charge) => accountActions.setPlan(site.id, plan, charge),
        usage: { pagesBuilt: site.pagesBuilt, pagesPlanned: site.pagesPlanned, creditsUsed: site.creditsUsed, customDomain: site.domain?.status === "connected", domain: site.domain, freeDomain: site.freeDomain, renews: site.renews },
        billing: {
          billed: true,
          scheduled: site.scheduledPlan,
          schedule: (plan) => accountActions.schedulePlan(site.id, plan),
          cancelScheduled: () => accountActions.cancelScheduledPlan(site.id),
        },
        modules,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
