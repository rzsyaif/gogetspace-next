"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button, TooltipProvider } from "@gogetspace/baseplate"
import { ACCOUNT, siteUrl } from "@/lib/account/data"
import { useSite } from "@/lib/account/store"
import { siteState } from "@/lib/generation/state"
import { GenProvider } from "./gen-provider"
import { AccountSiteProvider } from "./editor-site"
import { Shell } from "./generate-app"
import type { Tab } from "./workspace"

const TABS: Tab[] = ["agent", "analytics", "plan", "modules", "domain", "settings"]

/** /sites/[id] — the editor for an existing website; `?tab=` opens Analytics, Plan, Modules… directly (Manage on a module opens it in Ariyes Apps). */
export function SiteEditor({ siteId }: { siteId: string }) {
  const site = useSite(siteId)
  const raw = useSearchParams().get("tab")
  // Enquiries now live inside Modules (older links still open them)
  const tab = (raw === "enquiries" ? "modules" : raw) as Tab | null
  if (!site)
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="type-h4">We couldn&apos;t find that website</p>
        <Button asChild>
          <Link href="/dashboard">Back to the dashboard</Link>
        </Button>
      </main>
    )
  return (
    <TooltipProvider>
      <GenProvider
        key={site.id}
        prompt={null}
        storageKey={`gogetspace-site-${site.id}`}
        initial={() =>
          siteState({
            prompt: site.prompt,
            plan: site.plan,
            live: site.status === "live",
            built: site.built,
            account: { name: ACCOUNT.name, email: ACCOUNT.email },
            domain: siteUrl(site),
            credits: site.creditsUsed,
            styleId: site.themeId,
            modules: site.modules,
          })
        }
      >
        <AccountSiteProvider siteId={site.id}>
          <Shell initialTab={tab && TABS.includes(tab) ? tab : "agent"} />
        </AccountSiteProvider>
      </GenProvider>
    </TooltipProvider>
  )
}
