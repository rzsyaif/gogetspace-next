import localFont from "next/font/local"

// Fonts shown inside the feature-card illustrations (sample client sites), not part of Baseplate.
export const dmSerif = localFont({ variable: "--font-dm-serif", display: "swap", weight: "400", src: "../../fonts/dm-serif-display-latin-400-normal.woff2" })
export const dmSans = localFont({ variable: "--font-dm-sans", display: "swap", weight: "100 1000", src: "../../fonts/dm-sans-latin-wght-normal.woff2" })
export const leagueGothic = localFont({ variable: "--font-league-gothic", display: "swap", weight: "400", src: "../../fonts/league-gothic-latin-400-normal.woff2" })
export const inter = localFont({ variable: "--font-inter", display: "swap", weight: "100 900", src: "../../fonts/inter-latin-wght-normal.woff2" })

export const demoFontVars = [dmSerif.variable, dmSans.variable, leagueGothic.variable, inter.variable].join(" ")
