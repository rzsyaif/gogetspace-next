import type { Metadata } from "next"
import { SettingsPage } from "@/components/dashboard/pages"

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return <SettingsPage />
}
