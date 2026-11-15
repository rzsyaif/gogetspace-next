import type { SiteTheme } from "@/lib/bakti/themes"
import { SiteShell } from "./site-shell"
import { HomePage } from "./page-home"
import { CorporatePage, DoctorsPage, PreparePage, ServicesPage, TestsPage } from "./page-services"
import { AboutPage, FaqPage, GenericPage, LocationsPage, PrivacyPage, TermsPage } from "./page-info"

/** One page of the generated dental practice site, in the given theme. Unknown slugs get a starter layout. */
export function SitePage({ theme, slug }: { theme: SiteTheme; slug: string }) {
  return <SiteShell theme={theme} slug={slug}>{pageFor(theme, slug)}</SiteShell>
}

export function titleFromSlug(slug: string) {
  return decodeURIComponent(slug).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function pageFor(theme: SiteTheme, slug: string) {
  switch (slug) {
    case "": return <HomePage theme={theme} />
    case "treatments":
    case "services": return <ServicesPage />
    case "prices":
    case "tests-and-packages": return <TestsPage />
    case "our-dentists":
    case "about": return <AboutPage />
    case "new-patients":
    case "prepare-for-your-test": return <PreparePage />
    case "locations":
    case "contact": return <LocationsPage />
    case "emergency":
    case "for-doctors": return <DoctorsPage />
    case "corporate":
    case "corporate-screening": return <CorporatePage />
    case "faq": return <FaqPage />
    case "terms": return <TermsPage />
    case "privacy": return <PrivacyPage />
    default: return <GenericPage title={titleFromSlug(slug)} />
  }
}
