import { Suspense } from "react"
import type { Metadata } from "next"
import { CLIENTS } from "@/lib/admin/data"
import { ClientDetail } from "@/components/admin/clients"

export const metadata: Metadata = { title: "Client" }

export function generateStaticParams() {
  return CLIENTS.map((c) => ({ clientId: c.id }))
}

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  return (
    <Suspense>
      <ClientDetail id={clientId} />
    </Suspense>
  )
}
