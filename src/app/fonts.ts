import localFont from "next/font/local"

// Self-hosted (SIL Open Font License) so builds never depend on Google Fonts being reachable.
export const bricolage = localFont({
  variable: "--font-bricolage",
  display: "swap",
  weight: "200 800",
  src: [
    { path: "../fonts/bricolage-grotesque-latin-standard-normal.woff2", style: "normal" },
    { path: "../fonts/bricolage-grotesque-latin-ext-standard-normal.woff2", style: "normal" },
  ],
})

export const geist = localFont({
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
  src: [
    { path: "../fonts/geist-latin-wght-normal.woff2", style: "normal" },
    { path: "../fonts/geist-latin-ext-wght-normal.woff2", style: "normal" },
  ],
})

export const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  src: [{ path: "../fonts/geist-mono-latin-wght-normal.woff2", style: "normal" }],
})
