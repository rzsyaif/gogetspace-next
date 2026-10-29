import { Suspense } from "react"
import type { Metadata } from "next"
import { DomainsAdminPage } from "@/components/admin/domains"

export const metadata: Metadata = { title: "Domains" }

export default function Page() {
  return (
    <Suspense>
      <DomainsAdminPage />
    </Suspense>
  )
}
