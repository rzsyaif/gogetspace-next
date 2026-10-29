import { Suspense } from "react"
import type { Metadata } from "next"
import { SystemPage } from "@/components/admin/system"

export const metadata: Metadata = { title: "System" }

export default function Page() {
  return (
    <Suspense>
      <SystemPage />
    </Suspense>
  )
}
