/**
 * Style options the agent proposes for a dental practice.
 * Three presets align with the Dentist Playbook (§7):
 *   - Calm Clinical   → S1, S2, S4, S6, S7, S8
 *   - Warm Family     → S2, S3 (paediatric / family)
 *   - Modern Premium  → S5 (cosmetic & implants)
 * The first four THEMES form the main offer; ALT_THEMES appear on "Show me different options".
 * "custom" is returned by "Create your own style". All values are read by the site renderer.
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
  /** playbook preset tag for display */
  preset?: "calm-clinical" | "warm-family" | "modern-premium"
}

export const THEMES: SiteTheme[] = [
  // ── Calm Clinical (default; S1, S2, S4, S6, S7, S8) ──────────────────────
  {
    id: "calm-clinical",
    name: "Calm Clinical",
    vibe: "Clean whites, soft blue and a warm accent — trustworthy and approachable",
    heading: "jakarta",
    body: "inter",
    headingWeight: 700,
    palette: ["#0E6DC4", "#C8E3FA", "#F2A541", "#0F1E2E", "#F4F8FB"],
    onPrimary: "#FFFFFF",
    radius: 12,
    buttonRadius: 8,
    hero: "split",
    preset: "calm-clinical",
  },
  // ── Warm Family (S2, S3; paediatric / family dental) ─────────────────────
  {
    id: "warm-family",
    name: "Warm Family",
    vibe: "Warm neutrals, soft green and rounded shapes — friendly and relaxed",
    heading: "fraunces",
    body: "dmSans",
    headingWeight: 600,
    palette: ["#1F7A5C", "#A7D7C5", "#E8875A", "#1C2B26", "#FBF7F1"],
    onPrimary: "#FFFFFF",
    radius: 20,
    buttonRadius: 999,
    hero: "centered",
    preset: "warm-family",
  },
  // ── Modern Premium (S5; cosmetic & implants) ──────────────────────────────
  {
    id: "modern-premium",
    name: "Modern Premium",
    vibe: "Deep neutral and off-white with one restrained accent — refined and confident",
    heading: "dmSerif",
    body: "sourceSans",
    headingWeight: 400,
    palette: ["#1A1A2E", "#E8E4DC", "#C8A96E", "#1A1A2E", "#F9F7F3"],
    onPrimary: "#FFFFFF",
    radius: 4,
    buttonRadius: 2,
    hero: "banner",
    preset: "modern-premium",
  },
  // ── Teal Fresh (calm-clinical variant with a teal primary) ────────────────
  {
    id: "teal-fresh",
    name: "Teal Fresh",
    vibe: "Crisp teal on white — clean, modern and easy to trust",
    heading: "spaceGrotesk",
    body: "plexSans",
    headingWeight: 700,
    palette: ["#0B7A73", "#BFEDE7", "#F97316", "#0D2622", "#F3FBF9"],
    onPrimary: "#FFFFFF",
    radius: 8,
    buttonRadius: 6,
    hero: "split",
    preset: "calm-clinical",
  },
]

export const ALT_THEMES: SiteTheme[] = [
  {
    id: "sky-care",
    name: "Sky Care",
    vibe: "Light blue and white, very airy and approachable",
    heading: "jakarta",
    body: "dmSans",
    headingWeight: 800,
    palette: ["#2563EB", "#DBEAFE", "#F59E0B", "#0C1A3A", "#F0F7FF"],
    onPrimary: "#FFFFFF",
    radius: 16,
    buttonRadius: 999,
    hero: "centered",
    preset: "calm-clinical",
  },
  {
    id: "coral-smile",
    name: "Coral Smile",
    vibe: "Warm coral with rounded shapes — bright and child-friendly",
    heading: "bricolage",
    body: "geist",
    headingWeight: 700,
    palette: ["#D9482B", "#FFD9CF", "#2F5BFF", "#2A1712", "#FFF8F5"],
    onPrimary: "#FFFFFF",
    radius: 20,
    buttonRadius: 999,
    hero: "centered",
    preset: "warm-family",
  },
  {
    id: "slate-gold",
    name: "Slate & Gold",
    vibe: "Deep slate with gold accents — quiet confidence for premium practices",
    heading: "fraunces",
    body: "sourceSans",
    headingWeight: 500,
    palette: ["#1E293B", "#E2E8F0", "#D4A853", "#1E293B", "#FAFAF9"],
    onPrimary: "#FFFFFF",
    radius: 0,
    buttonRadius: 0,
    hero: "split",
    preset: "modern-premium",
  },
  {
    id: "mint-calm",
    name: "Mint Calm",
    vibe: "Soft mint on white — gentle and reassuring",
    heading: "jakarta",
    body: "inter",
    headingWeight: 700,
    palette: ["#059669", "#D1FAE5", "#F59E0B", "#064E3B", "#F0FDF8"],
    onPrimary: "#FFFFFF",
    radius: 12,
    buttonRadius: 8,
    hero: "split",
    preset: "calm-clinical",
  },
]

export const CUSTOM_THEME: SiteTheme = {
  id: "custom",
  name: "Your style",
  vibe: "Made from your description and reference",
  heading: "dmSerif",
  body: "inter",
  headingWeight: 400,
  palette: ["#0E6DC4", "#C8E3FA", "#F2A541", "#0F1E2E", "#F4F8FB"],
  onPrimary: "#FFFFFF",
  radius: 14,
  buttonRadius: 999,
  hero: "split",
}

export const ALL_THEMES = [...THEMES, ...ALT_THEMES, CUSTOM_THEME]

export function getTheme(id: string | undefined | null): SiteTheme {
  return ALL_THEMES.find((t) => t.id === id) ?? THEMES[0]
}
