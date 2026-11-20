import { Suspense } from "react"
import type { Metadata } from "next"
import { PlansAdminPage } from "@/components/admin/settings"

export const metadata: Metadata = { title: "Plans & features" }

export default function Page() {
  return (
    <Suspense>
      <PlansAdminPage />
    </Suspense>
  )
}
