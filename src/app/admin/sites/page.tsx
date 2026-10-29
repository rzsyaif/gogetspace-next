import { Suspense } from "react"
import type { Metadata } from "next"
import { SitesPage } from "@/components/admin/sites"

export const metadata: Metadata = { title: "Websites" }

export default function Page() {
  return (
    <Suspense>
      <SitesPage />
    </Suspense>
  )
}
