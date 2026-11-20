import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminOverview } from "@/components/admin/overview"

export const metadata: Metadata = { title: "Overview" }

export default function Page() {
  return (
    <Suspense>
      <AdminOverview />
    </Suspense>
  )
}
