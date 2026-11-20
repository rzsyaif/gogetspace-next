import { Suspense } from "react"
import type { Metadata } from "next"
import { ClientsPage } from "@/components/admin/clients"

export const metadata: Metadata = { title: "Clients" }

export default function Page() {
  return (
    <Suspense>
      <ClientsPage />
    </Suspense>
  )
}
