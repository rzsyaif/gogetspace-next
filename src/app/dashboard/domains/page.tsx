import { Suspense } from "react"
import type { Metadata } from "next"
import { DomainsPage } from "@/components/dashboard/pages"

export const metadata: Metadata = { title: "Domains" }

export default function Page() {
  return (
    <Suspense>
      <DomainsPage />
    </Suspense>
  )
}
