import { mainButton, presetOf, withDefaults } from "@/lib/playbooks/engine"
import { configFromPb, dentalPreviewUrl } from "@/lib/playbooks/site-config"
import type { GenState } from "./state"

/** the preview URL of a page of the site being built: the dental site for a dentist plan, Bakti Analisa otherwise */
export function previewUrl(s: Pick<GenState, "pb" | "styleId">, slug = ""): string {
  if (s.pb) return dentalPreviewUrl(s.styleId ?? presetOf(s.pb), slug, configFromPb(s.pb))
  return `/preview/${s.styleId ?? "clinical-clarity"}${slug ? `/${slug}` : ""}`
}

/** label of the site's main button (for previews drawn outside the site) */
export const mainCtaLabel = (s: Pick<GenState, "pb">) => (s.pb ? mainButton(withDefaults(s.pb)).label : "Book a test")
