/**
 * Style options the agent proposes for Bakti Analisa. The first four match the Figma "Design & Style" step;
 * the second set appears after "Show me different options"; "custom" is what "Create your own style" returns.
 * The generated site reads everything from these values, so a theme fully restyles every page.
 */

export type FontKey = "jakarta" | "inter" | "fraunces" | "dmSans" | "spaceGrotesk" | "plexSans" | "dmSerif" | "sourceSans" | "bricolage" | "geist"

export interface SiteTheme {
  id: string
  name: string
  /** one line on the vibe, shown under the option */
  vibe: string
  heading: FontKey
  body: FontKey
  headingWeight: number
  /** primary, soft tint, accent, ink, paper */
  palette: [string, string, string, string, string]
  /** text colour on the primary colour */
  onPrimary: string
  radius: number
  buttonRadius: number
  /** hero layout flavour */
  hero: "split" | "centered" | "banner"
}

export const THEMES: SiteTheme[] = [
  {
    id: "clinical-clarity",
    name: "Clinical Clarity",
    vibe: "Calm blues, crisp and trustworthy",
    heading: "jakarta",
    body: "inter",
    headingWeight: 700,
    palette: ["#0E5FA8", "#4FB3BF", "#F2A541", "#0F1E2E", "#F4F8FB"],
    onPrimary: "#FFFFFF",
    radius: 12,
    buttonRadius: 8,
    hero: "split",
  },
  {
    id: "warm-care",
    name: "Warm Care",
    vibe: "Soft greens, friendly and reassuring",
    heading: "fraunces",
    body: "dmSans",
    headingWeight: 600,
    palette: ["#1F7A5C", "#A7D7C5", "#E8875A", "#1C2B26", "#FBF7F1"],
    onPrimary: "#FFFFFF",
    radius: 20,
    buttonRadius: 999,
    hero: "centered",
  },
  {
    id: "precision-lab",
    name: "Precision Lab",
    vibe: "Bold indigo, technical and modern",
    heading: "spaceGrotesk",
    body: "plexSans",
    headingWeight: 700,
    palette: ["#3B3FE0", "#8EA2FF", "#19C29B", "#10121A", "#F5F6FA"],
    onPrimary: "#FFFFFF",
    radius: 6,
    buttonRadius: 4,
    hero: "banner",
  },
  {
    id: "penang-heritage",
    name: "Penang Heritage",
    vibe: "Teal and terracotta, local and established",
    heading: "dmSerif",
    body: "sourceSans",
    headingWeight: 400,
    palette: ["#0F6B6B", "#E6C27A", "#C8553D", "#1E2A2A", "#FAF6EE"],
    onPrimary: "#FFFFFF",
    radius: 4,
    buttonRadius: 2,
    hero: "split",
  },
]

export const ALT_THEMES: SiteTheme[] = [
  {
    id: "fresh-mint",
    name: "Fresh Mint",
    vibe: "Light and airy, very approachable",
    heading: "jakarta",
    body: "dmSans",
    headingWeight: 800,
    palette: ["#0B8F7A", "#BFEDE3", "#FFB547", "#0D2622", "#F3FBF8"],
    onPrimary: "#FFFFFF",
    radius: 24,
    buttonRadius: 999,
    hero: "centered",
  },
  {
    id: "night-shift",
    name: "Night Shift",
    vibe: "Deep navy with bright highlights",
    heading: "spaceGrotesk",
    body: "inter",
    headingWeight: 700,
    palette: ["#2563EB", "#BFD3FF", "#F43F5E", "#0B1220", "#EEF2F8"],
    onPrimary: "#FFFFFF",
    radius: 10,
    buttonRadius: 10,
    hero: "banner",
  },
  {
    id: "paper-ink",
    name: "Paper & Ink",
    vibe: "Editorial and quiet, like a printed report",
    heading: "fraunces",
    body: "sourceSans",
    headingWeight: 500,
    palette: ["#1E1C19", "#E4E1DA", "#C8553D", "#1E1C19", "#FBFAF7"],
    onPrimary: "#FFFFFF",
    radius: 0,
    buttonRadius: 0,
    hero: "split",
  },
  {
    id: "coral-health",
    name: "Coral Health",
    vibe: "Warm coral, energetic and caring",
    heading: "bricolage",
    body: "geist",
    headingWeight: 700,
    palette: ["#D9482B", "#FFD9CF", "#2F5BFF", "#2A1712", "#FFF8F5"],
    onPrimary: "#FFFFFF",
    radius: 16,
    buttonRadius: 12,
    hero: "centered",
  },
]

/** Style options for a dental practice (dentist playbook). The first three are the playbook's presets. */
export const DENTAL_THEMES: SiteTheme[] = [
  {
    id: "calm-clinical",
    name: "Calm Clinical",
    vibe: "Soft blues, clean and reassuring",
    heading: "jakarta",
    body: "inter",
    headingWeight: 700,
    palette: ["#1D6FB8", "#BFE0F5", "#2FB5A3", "#10233A", "#F5F9FC"],
    onPrimary: "#FFFFFF",
    radius: 14,
    buttonRadius: 10,
    hero: "split",
  },
  {
    id: "warm-family",
    name: "Warm Family",
    vibe: "Sunny and friendly, made for parents",
    heading: "bricolage",
    body: "dmSans",
    headingWeight: 700,
    palette: ["#D8642E", "#FFE0C4", "#2E9C8F", "#2B1D14", "#FFF9F2"],
    onPrimary: "#FFFFFF",
    radius: 24,
    buttonRadius: 999,
    hero: "centered",
  },
  {
    id: "modern-premium",
    name: "Modern Premium",
    vibe: "Deep and refined, for bigger treatments",
    heading: "dmSerif",
    body: "inter",
    headingWeight: 400,
    palette: ["#1F2A36", "#DCCBA8", "#A9824A", "#141A21", "#F7F4EE"],
    onPrimary: "#FFFFFF",
    radius: 6,
    buttonRadius: 4,
    hero: "split",
  },
  {
    id: "fresh-smile",
    name: "Fresh Smile",
    vibe: "Mint and white, bright and modern",
    heading: "spaceGrotesk",
    body: "geist",
    headingWeight: 700,
    palette: ["#0E9682", "#C7F1E7", "#5B6CFF", "#0D2A26", "#F4FBF9"],
    onPrimary: "#FFFFFF",
    radius: 18,
    buttonRadius: 999,
    hero: "split",
  },
]

export const CUSTOM_THEME: SiteTheme = {
  id: "custom",
  name: "Your style",
  vibe: "Made from your description and reference",
  heading: "dmSerif",
  body: "inter",
  headingWeight: 400,
  palette: ["#6D3FC0", "#DCCEF7", "#F0A23B", "#1B1329", "#FAF8FE"],
  onPrimary: "#FFFFFF",
  radius: 14,
  buttonRadius: 999,
  hero: "split",
}

export const ALL_THEMES = [...THEMES, ...ALT_THEMES, ...DENTAL_THEMES, CUSTOM_THEME]
/** the Bakti Analisa demo site is only prerendered in its own options */
export const LAB_THEMES = [...THEMES, ...ALT_THEMES, CUSTOM_THEME]

export function getTheme(id: string | undefined | null): SiteTheme {
  return ALL_THEMES.find((t) => t.id === id) ?? THEMES[0]
}
