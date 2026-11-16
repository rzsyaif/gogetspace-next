import { DEFAULT_CONFIG, dentalPreviewUrl, type DentalConfig } from "@/lib/playbooks/site-config"
import type { Site } from "./data"

/** a dental (playbook) website's site config, from the account's record */
export const dentalConfigOf = (site: Site): DentalConfig | null => (site.modules ? { ...DEFAULT_CONFIG, name: site.name, modules: site.modules.map((m) => m.id) } : null)

/** where an account website's generated site can be opened */
export function sitePreviewUrl(site: Site): string {
  const c = dentalConfigOf(site)
  return c ? dentalPreviewUrl(site.themeId ?? "calm-clinical", "", c) : `/preview/${site.themeId}`
}
