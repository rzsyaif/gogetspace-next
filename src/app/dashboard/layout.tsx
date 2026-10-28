import type { ReactNode } from "react"
import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard/shell"

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · GoGetSpace" } }

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
