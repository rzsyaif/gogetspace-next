import type { Metadata } from "next"
import { WebsitesPage } from "@/components/dashboard/pages"

export const metadata: Metadata = { title: "Websites" }

export default function Page() {
  return <WebsitesPage />
}
