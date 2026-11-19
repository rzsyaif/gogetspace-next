import localFont from "next/font/local"

// Fonts shown inside the feature-card illustrations (sample client sites), not part of Baseplate.
// Not preloaded: the browser fetches each one only when text set in it is on the page, so the homepage's first
// load carries just the Baseplate faces.
export const dmSerif = localFont({ variable: "--font-dm-serif", display: "swap", preload: false, weight: "400", src: "../../fonts/dm-serif-display-latin-400-normal.woff2" })
export const dmSans = localFont({ variable: "--font-dm-sans", display: "swap", preload: false, weight: "100 1000", src: "../../fonts/dm-sans-latin-wght-normal.woff2" })
export const leagueGothic = localFont({ variable: "--font-league-gothic", display: "swap", preload: false, weight: "400", src: "../../fonts/league-gothic-latin-400-normal.woff2" })
export const inter = localFont({ variable: "--font-inter", display: "swap", preload: false, weight: "100 900", src: "../../fonts/inter-latin-wght-normal.woff2" })

export const demoFontVars = [dmSerif.variable, dmSans.variable, leagueGothic.variable, inter.variable].join(" ")
