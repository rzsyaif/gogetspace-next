import type { ReactNode } from "react"
import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/shell"

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · GoGetSpace" }, robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
