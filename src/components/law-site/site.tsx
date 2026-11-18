"use client"

import type { SiteTheme } from "@/lib/bakti/themes"
import { AREAS } from "@/lib/playbooks/lawyer-plan"
import { titleFromSlug } from "@/components/bakti-site/site-page"
import { LawShell } from "./shell"
import {
  AreaPage,
  ArticlesPage,
  BookPage,
  ContactPage,
  EnquiryPage,
  FaqPage,
  FeeProposalPage,
  FeesPage,
  GenericLawPage,
  HowWeWorkPage,
  LawHome,
  LawLegalPage,
  LawyersPage,
  OfficesPage,
  PracticeAreasPage,
  UrgentPage,
} from "./pages"

/** One page of a generated law-practice site; the firm and its plan come from the URL's query string. */
export function LawSite({ theme, slug }: { theme: SiteTheme; slug: string }) {
  return (
    <LawShell theme={theme} slug={slug}>
      <LawPage slug={slug} />
    </LawShell>
  )
}

function LawPage({ slug }: { slug: string }) {
  const area = Object.values(AREAS).find((a) => a.slug === slug)
  if (area) return <AreaPage a={area} />
  switch (slug) {
    case "": return <LawHome />
    case "practice-areas": return <PracticeAreasPage />
    case "our-lawyers": return <LawyersPage />
    case "how-we-work": return <HowWeWorkPage />
    case "fees": return <FeesPage />
    case "contact": return <ContactPage />
    case "faq": return <FaqPage />
    case "book": return <BookPage />
    case "enquiry": return <EnquiryPage />
    case "fee-proposal": return <FeeProposalPage />
    case "urgent": return <UrgentPage />
    case "articles": return <ArticlesPage />
    case "offices": return <OfficesPage />
    case "privacy":
    case "terms": return <LawLegalPage kind={slug} />
    default: return <GenericLawPage title={titleFromSlug(slug)} />
  }
}
