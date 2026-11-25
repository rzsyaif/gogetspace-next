import type { Metadata } from "next"
import { PipelinePage } from "@/components/crm/pages"

export const metadata: Metadata = { title: "Pipeline · CRM" }

export default function Page() {
  return <PipelinePage />
}
