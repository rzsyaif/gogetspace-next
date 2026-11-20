import { toolForModule } from "@gogetspace/modules"

/**
 * Ariyes Apps is where a published website's tools run (appointments, payments, inbox…). Its project for a site
 * has the site's id. Set NEXT_PUBLIC_ARIYES_URL per environment; the fallbacks are the local dev server and the
 * Ariyes Vercel project.
 */
export const ARIYES_URL =
  process.env.NEXT_PUBLIC_ARIYES_URL ?? (process.env.NODE_ENV === "production" ? "https://gogetspace-ariyes.vercel.app" : "http://localhost:3001")

/** where Manage opens: the module's tool in the site's Ariyes project, or the project home when it has no tool there */
export function ariyesUrl(siteId: string, module?: string) {
  const tool = module ? toolForModule(module) : undefined
  return `${ARIYES_URL}/${siteId}${tool ? `/${tool.id}` : ""}`
}
