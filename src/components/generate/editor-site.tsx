"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { Plan } from "@/lib/plans"
import { flatten } from "@/lib/bakti/sitemap"
import type { Site } from "@/lib/account/data"
import { accountActions, useSite } from "@/lib/account/store"
import type { PlanUsage } from "@/components/account/plan-panel"
import { useGen } from "./gen-provider"

/**
 * The website the editor is working on. In the generation flow it's the site being created (plan and status
 * come from the flow); on /sites/[id] it's one of the account's websites (plan and status from the account).
 */
export interface EditorSite {
  mode: "flow" | "site"
  site: Site
  plan: Plan
  setPlan: (p: Plan) => void
  usage: PlanUsage
}

const Ctx = createContext<EditorSite | null>(null)

export function useEditorSite() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useEditorSite outside an editor")
  return c
}

/** the site being created in /generate */
export function FlowSiteProvider({ children }: { children: ReactNode }) {
  const { s, dispatch } = useGen()
  const pages = flatten(s.sitemap)
  const built = Object.values(s.pages).filter((p) => p === "built").length
  const site: Site = {
    id: "new-site",
    name: "Bakti Analisa Clinical Laboratory Penang",
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
  return (
    <Ctx.Provider
      value={{
        mode: "flow",
        site,
        plan: s.plan,
        setPlan: (plan) => dispatch({ type: "plan", plan }),
        usage: { pagesBuilt: built, pagesPlanned: pages.length, creditsUsed: s.credits, customDomain: false, domain: null, freeDomain: s.publish.domain },
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

/** one of the account's websites, opened from the dashboard */
export function AccountSiteProvider({ siteId, children }: { siteId: string; children: ReactNode }) {
  const site = useSite(siteId)
  if (!site) return null
  return (
    <Ctx.Provider
      value={{
        mode: "site",
        site,
        plan: site.plan,
        setPlan: (plan) => accountActions.setPlan(site.id, plan),
        usage: { pagesBuilt: site.pagesBuilt, pagesPlanned: site.pagesPlanned, creditsUsed: site.creditsUsed, customDomain: site.domain?.status === "connected", domain: site.domain, freeDomain: site.freeDomain, renews: site.renews },
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
