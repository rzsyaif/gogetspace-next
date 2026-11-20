import type { Metadata } from "next"
import { SITES } from "@/lib/account/data"
import { PLAYBOOKS } from "@/lib/playbooks/engine"
import { ModuleApp } from "@/components/playbook/module-app"

export const metadata: Metadata = { title: "Module", robots: { index: false } }

const MODULES = ["enquiries", ...new Set(Object.values(PLAYBOOKS).flatMap((b) => b.modules.filter((m) => !m.core).map((m) => m.id)))]

export function generateStaticParams() {
  // "new-site" is the website still in /generate
  return [...SITES.map((s) => s.id), "new-site"].flatMap((siteId) => MODULES.map((module) => ({ siteId, module })))
}

/** A module's own app (Manage on the Modules page). Modules are separate environments; this stands in for them. */
export default async function ModuleAppPage({ params }: { params: Promise<{ siteId: string; module: string }> }) {
  const { siteId, module } = await params
  return <ModuleApp siteId={siteId} module={module} />
}
