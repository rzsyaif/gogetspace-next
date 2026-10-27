import type { Metadata } from "next"
import { bricolage, geist, geistMono } from "./fonts"
import { ThemeScript } from "@/components/theme"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "GoGetSpace", template: "%s · GoGetSpace" },
  description: "Your business, online today. Build a dream space for your business.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
