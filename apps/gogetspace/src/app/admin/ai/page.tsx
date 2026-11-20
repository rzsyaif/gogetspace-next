import { Suspense } from "react"
import type { Metadata } from "next"
import { AIUsagePage } from "@/components/admin/ai"

export const metadata: Metadata = { title: "AI usage" }

export default function Page() {
  return (
    <Suspense>
      <AIUsagePage />
    </Suspense>
  )
}
