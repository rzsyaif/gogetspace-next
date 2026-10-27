import localFont from "next/font/local"
import type { FontKey } from "@/lib/bakti/themes"
import { dmSans, dmSerif, inter } from "@/components/site/demo-fonts"

// Fonts the style options use (all SIL Open Font License, self-hosted).
const jakarta = localFont({ variable: "--font-jakarta", display: "swap", weight: "200 800", src: "../../fonts/plus-jakarta-sans-latin-wght-normal.woff2" })
const fraunces = localFont({ variable: "--font-fraunces", display: "swap", weight: "100 900", src: "../../fonts/fraunces-latin-wght-normal.woff2" })
const spaceGrotesk = localFont({ variable: "--font-space-grotesk", display: "swap", weight: "300 700", src: "../../fonts/space-grotesk-latin-wght-normal.woff2" })
const plexSans = localFont({ variable: "--font-plex-sans", display: "swap", weight: "100 700", src: "../../fonts/ibm-plex-sans-latin-wght-normal.woff2" })
const sourceSans = localFont({ variable: "--font-source-sans", display: "swap", weight: "200 900", src: "../../fonts/source-sans-3-latin-wght-normal.woff2" })

export const siteFontVars = [jakarta, fraunces, spaceGrotesk, plexSans, sourceSans, dmSans, dmSerif, inter].map((f) => f.variable).join(" ")

/** CSS font-family value for a theme font (Bricolage and Geist come from the root layout) */
export const FONT_STACK: Record<FontKey, string> = {
  jakarta: "var(--font-jakarta), system-ui, sans-serif",
  inter: "var(--font-inter), system-ui, sans-serif",
  fraunces: "var(--font-fraunces), Georgia, serif",
  dmSans: "var(--font-dm-sans), system-ui, sans-serif",
  spaceGrotesk: "var(--font-space-grotesk), system-ui, sans-serif",
  plexSans: "var(--font-plex-sans), system-ui, sans-serif",
  dmSerif: "var(--font-dm-serif), Georgia, serif",
  sourceSans: "var(--font-source-sans), system-ui, sans-serif",
  bricolage: "var(--font-bricolage), system-ui, sans-serif",
  geist: "var(--font-geist), system-ui, sans-serif",
}
