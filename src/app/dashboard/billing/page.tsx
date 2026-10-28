import type { Metadata } from "next"
import { BillingPage } from "@/components/dashboard/pages"

export const metadata: Metadata = { title: "Billings" }

export default function Page() {
  return <BillingPage />
}
