import type { Metadata } from "next"
import { ClientsPage } from "@/components/crm/pages"

export const metadata: Metadata = { title: "Clients · CRM" }

export default function Page() {
  return <ClientsPage />
}
