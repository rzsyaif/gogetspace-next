import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DENTAL_THEMES } from "@/lib/bakti/themes"
import { titleFromSlug } from "@/components/bakti-site/site-page"
import { DENTAL_SLUGS } from "@/lib/playbooks/site-config"
import { DentalSite } from "@/components/dental-site/site"

/** A generated dental practice site (dentist playbook): every page in every dental style, prerendered. */
export function generateStaticParams() {
  return DENTAL_THEMES.flatMap((t) => DENTAL_SLUGS.map((s) => ({ style: t.id, page: s ? [s] : [] })))
}

export async function generateMetadata({ params }: PageProps<"/preview/dental/[style]/[[...page]]">): Promise<Metadata> {
  const { page } = await params
  const slug = page?.[0] ?? ""
  return { title: { absolute: slug ? `${titleFromSlug(slug)} · Dental clinic` : "Dental clinic" }, robots: { index: false } }
}

export default async function Page({ params }: PageProps<"/preview/dental/[style]/[[...page]]">) {
  const { style, page } = await params
  const theme = DENTAL_THEMES.find((t) => t.id === style)
  if (!theme || (page && page.length > 1)) notFound()
  // the clinic and its plan are read from the query string on the client
  return (
    <Suspense fallback={<div className="min-h-svh bg-[#F5F9FC]" />}>
      <DentalSite theme={theme} slug={page?.[0] ?? ""} />
    </Suspense>
  )
}
