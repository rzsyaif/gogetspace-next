import type { Metadata } from "next"
import { InboxPage } from "@/components/dashboard/pages"

export const metadata: Metadata = { title: "Inbox" }

export default function Page() {
  return <InboxPage />
}
