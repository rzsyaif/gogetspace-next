import type { SiteTheme } from "@/lib/bakti/themes"
import { SiteShell } from "./site-shell"
import { HomePage } from "./page-home"
import { CorporatePage, DoctorsPage, PreparePage, ServicesPage, TestsPage } from "./page-services"
import { AboutPage, FaqPage, GenericPage, LocationsPage, PrivacyPage, TermsPage } from "./page-info"

/** One page of the generated Bakti Analisa site, in the given theme. Unknown slugs get a starter layout. */
export function SitePage({ theme, slug }: { theme: SiteTheme; slug: string }) {
  return <SiteShell theme={theme} slug={slug}>{pageFor(theme, slug)}</SiteShell>
}

export function titleFromSlug(slug: string) {
  return decodeURIComponent(slug).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function pageFor(theme: SiteTheme, slug: string) {
  switch (slug) {
    case "": return <HomePage theme={theme} />
    case "services": return <ServicesPage />
    case "tests-and-packages": return <TestsPage />
    case "for-doctors": return <DoctorsPage />
    case "corporate-screening": return <CorporatePage />
    case "prepare-for-your-test": return <PreparePage />
    case "about": return <AboutPage />
    case "locations": return <LocationsPage />
    case "faq": return <FaqPage />
    case "terms": return <TermsPage />
    case "privacy": return <PrivacyPage />
    default: return <GenericPage title={titleFromSlug(slug)} />
  }
}
