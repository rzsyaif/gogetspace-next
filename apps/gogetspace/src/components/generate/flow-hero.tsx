"use client"

import type { SiteTheme } from "@/lib/bakti/themes"
import { configFromPb } from "@/lib/playbooks/site-config"
import { mainCtaLabel } from "@/lib/generation/preview-url"
import { HeroPreview } from "@/components/bakti-site/hero-preview"
import { DentalHeroPreview } from "@/components/dental-site/hero-preview"
import { LawHeroPreview } from "@/components/law-site/hero-preview"
import { lawConfigFromPb } from "@/lib/playbooks/law-site-config"
import { useGen } from "./gen-provider"

/** the hero the style step previews: the practice's own for a playbook plan, the lab's otherwise */
export function FlowHero({ theme, viewport }: { theme: SiteTheme; viewport: number }) {
  const { s } = useGen()
  if (s.pb?.niche === "lawyer") return <LawHeroPreview theme={theme} viewport={viewport} c={lawConfigFromPb(s.pb)} cta={mainCtaLabel(s)} />
  if (s.pb) return <DentalHeroPreview theme={theme} viewport={viewport} c={configFromPb(s.pb)} cta={mainCtaLabel(s)} />
  return <HeroPreview theme={theme} viewport={viewport} />
}
