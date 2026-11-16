"use client"

import type { SiteTheme } from "@/lib/bakti/themes"
import { configFromPb } from "@/lib/playbooks/site-config"
import { mainCtaLabel } from "@/lib/generation/preview-url"
import { HeroPreview } from "@/components/bakti-site/hero-preview"
import { DentalHeroPreview } from "@/components/dental-site/hero-preview"
import { useGen } from "./gen-provider"

/** the hero the style step previews: the dental practice's for a dentist plan, the lab's otherwise */
export function FlowHero({ theme, viewport }: { theme: SiteTheme; viewport: number }) {
  const { s } = useGen()
  if (s.pb) return <DentalHeroPreview theme={theme} viewport={viewport} c={configFromPb(s.pb)} cta={mainCtaLabel(s)} />
  return <HeroPreview theme={theme} viewport={viewport} />
}
