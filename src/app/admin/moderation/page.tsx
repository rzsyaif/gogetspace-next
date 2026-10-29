import { Suspense } from "react"
import type { Metadata } from "next"
import { ModerationPage } from "@/components/admin/moderation"

export const metadata: Metadata = { title: "Moderation" }

export default function Page() {
  return (
    <Suspense>
      <ModerationPage />
    </Suspense>
  )
}
