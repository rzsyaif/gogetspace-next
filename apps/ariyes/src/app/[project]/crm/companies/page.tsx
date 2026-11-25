import type { Metadata } from "next"
import { CompaniesPage } from "@/components/crm/pages"

export const metadata: Metadata = { title: "Companies · CRM" }

export default function Page() {
  return <CompaniesPage />
}
