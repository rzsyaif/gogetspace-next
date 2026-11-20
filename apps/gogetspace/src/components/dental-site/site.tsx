"use client"

import type { SiteTheme } from "@/lib/bakti/themes"
import { TREATMENTS } from "@/lib/playbooks/dentist-plan"
import { titleFromSlug } from "@/components/bakti-site/site-page"
import { DentalShell } from "./shell"
import {
  BeforeAfterPage,
  BookPage,
  BranchesPage,
  ConsultationPage,
  ContactPage,
  DentalHome,
  DentistsPage,
  EmergencyPage,
  FaqPage,
  GenericDentalPage,
  KidsPage,
  LegalPage,
  NewPatientsPage,
  PricesPage,
  TreatmentPage,
  TreatmentsPage,
} from "./pages"


/** One page of a generated dental practice site; the clinic and its plan come from the URL's query string. */
export function DentalSite({ theme, slug }: { theme: SiteTheme; slug: string }) {
  return (
    <DentalShell theme={theme} slug={slug}>
      <DentalPage slug={slug} />
    </DentalShell>
  )
}

function DentalPage({ slug }: { slug: string }) {
  const t = Object.values(TREATMENTS).find((x) => x.slug === slug)
  if (t) return <TreatmentPage t={t} />
  switch (slug) {
    case "": return <DentalHome />
    case "treatments": return <TreatmentsPage />
    case "our-dentists": return <DentistsPage />
    case "new-patients": return <NewPatientsPage />
    case "prices": return <PricesPage />
    case "contact": return <ContactPage />
    case "faq": return <FaqPage />
    case "book": return <BookPage />
    case "consultation": return <ConsultationPage />
    case "emergency": return <EmergencyPage />
    case "branches": return <BranchesPage />
    case "before-and-after": return <BeforeAfterPage />
    case "kids": return <KidsPage />
    case "privacy":
    case "terms": return <LegalPage kind={slug} />
    default: return <GenericDentalPage title={titleFromSlug(slug)} />
  }
}
