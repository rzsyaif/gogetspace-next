import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LAW_THEMES } from "@/lib/bakti/themes"
import { titleFromSlug } from "@/components/bakti-site/site-page"
import { LAW_SLUGS } from "@/lib/playbooks/law-site-config"
import { LawSite } from "@/components/law-site/site"

/** A generated law-practice site (lawyer playbook): every page in every law style, prerendered. */
export function generateStaticParams() {
  return LAW_THEMES.flatMap((t) => LAW_SLUGS.map((s) => ({ style: t.id, page: s ? [s] : [] })))
}

export async function generateMetadata({ params }: PageProps<"/preview/law/[style]/[[...page]]">): Promise<Metadata> {
  const { page } = await params
  const slug = page?.[0] ?? ""
  return { title: { absolute: slug ? `${titleFromSlug(slug)} · Law practice` : "Law practice" }, robots: { index: false } }
}

export default async function Page({ params }: PageProps<"/preview/law/[style]/[[...page]]">) {
  const { style, page } = await params
  const theme = LAW_THEMES.find((t) => t.id === style)
  if (!theme || (page && page.length > 1)) notFound()
  // the firm and its plan are read from the query string on the client
  return (
    <Suspense fallback={<div className="min-h-svh bg-[#F7F6F2]" />}>
      <LawSite theme={theme} slug={page?.[0] ?? ""} />
    </Suspense>
  )
}
