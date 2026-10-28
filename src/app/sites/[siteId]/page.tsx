import { Suspense } from "react"
import type { Metadata } from "next"
import { SITES } from "@/lib/account/data"
import { SiteEditor } from "@/components/generate/site-editor"

export const metadata: Metadata = { title: "Editor" }

export function generateStaticParams() {
  return SITES.map((s) => ({ siteId: s.id }))
}

/** The editor for one of the account's websites, on its own (outside the generation flow). */
export default async function SitePage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  return (
    <Suspense>
      <SiteEditor siteId={siteId} />
    </Suspense>
  )
}
