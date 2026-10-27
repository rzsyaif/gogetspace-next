import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ALL_THEMES } from "@/lib/bakti/themes"
import { KNOWN_SLUGS } from "@/lib/bakti/sitemap"
import { SitePage, titleFromSlug } from "@/components/bakti-site/site-page"

/** The generated Bakti Analisa site: every page in every style option, prerendered. */
export function generateStaticParams() {
  return ALL_THEMES.flatMap((t) => KNOWN_SLUGS.map((s) => ({ style: t.id, page: s ? [s] : [] })))
}

export async function generateMetadata({ params }: PageProps<"/preview/[style]/[[...page]]">): Promise<Metadata> {
  const { page } = await params
  const slug = page?.[0] ?? ""
  return {
    title: { absolute: slug ? `${titleFromSlug(slug)} · Bakti Analisa` : "Bakti Analisa · Clinical Laboratory, Penang" },
    description: "Blood tests and health screening in George Town, Bayan Lepas and Butterworth.",
    robots: { index: false },
  }
}

export default async function Page({ params }: PageProps<"/preview/[style]/[[...page]]">) {
  const { style, page } = await params
  const theme = ALL_THEMES.find((t) => t.id === style)
  if (!theme || (page && page.length > 1)) notFound()
  return <SitePage theme={theme} slug={page?.[0] ?? ""} />
}
