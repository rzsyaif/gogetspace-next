import type { Metadata } from "next"
import { CrmHome } from "@/components/crm/pages"

export const metadata: Metadata = { title: "CRM" }

export default function Page() {
  return <CrmHome />
}
