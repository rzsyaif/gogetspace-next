import type { Metadata } from "next"
import { ThemeScript } from "@gogetspace/baseplate/theme"
import { bricolage, geist } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Ariyes", template: "%s · Ariyes" },
  description: "The tools behind your website: appointments, payments, inbox, contacts and more.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${geist.variable} h-full`}>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
