import { Suspense } from "react"
import type { Metadata } from "next"
import { GenerateApp } from "@/components/generate/generate-app"

export const metadata: Metadata = { title: "Building your website" }

export default function GeneratePage() {
  return (
    <Suspense>
      <GenerateApp />
    </Suspense>
  )
}
