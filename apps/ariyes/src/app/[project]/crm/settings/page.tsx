import type { Metadata } from "next"
import { CrmSettingsPage } from "@/components/crm/settings"

export const metadata: Metadata = { title: "Settings · CRM" }

export default function Page() {
  return <CrmSettingsPage />
}
