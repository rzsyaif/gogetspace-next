import { Suspense } from "react"
import type { Metadata } from "next"
import { TeamPage } from "@/components/admin/settings"

export const metadata: Metadata = { title: "Team & roles" }

export default function Page() {
  return (
    <Suspense>
      <TeamPage />
    </Suspense>
  )
}
