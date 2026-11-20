import localFont from "next/font/local"

// Baseplate faces, self-hosted in packages/baseplate/fonts (SIL Open Font License) so builds never depend on Google Fonts.
export const bricolage = localFont({
  variable: "--font-bricolage",
  display: "swap",
  weight: "200 800",
  src: [
    { path: "../../../../packages/baseplate/fonts/bricolage-grotesque-latin-standard-normal.woff2", style: "normal" },
    { path: "../../../../packages/baseplate/fonts/bricolage-grotesque-latin-ext-standard-normal.woff2", style: "normal" },
  ],
})

export const geist = localFont({
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
  src: [
    { path: "../../../../packages/baseplate/fonts/geist-latin-wght-normal.woff2", style: "normal" },
    { path: "../../../../packages/baseplate/fonts/geist-latin-ext-wght-normal.woff2", style: "normal" },
  ],
})

export const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  src: [{ path: "../../../../packages/baseplate/fonts/geist-mono-latin-wght-normal.woff2", style: "normal" }],
})
