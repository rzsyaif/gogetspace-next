import { Suspense } from "react"
import type { Metadata } from "next"
import { FeedbackPage } from "@/components/admin/feedback"

export const metadata: Metadata = { title: "Feedback" }

export default function Page() {
  return (
    <Suspense>
      <FeedbackPage />
    </Suspense>
  )
}
