import { Suspense } from "react"
import type { Metadata } from "next"
import { AuditPage } from "@/components/admin/settings"

export const metadata: Metadata = { title: "Audit log" }

export default function Page() {
  return (
    <Suspense>
      <AuditPage />
    </Suspense>
  )
}
