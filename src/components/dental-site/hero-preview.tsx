"use client"

import { CalendarCheck } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import type { DentalConfig } from "@/lib/playbooks/site-config"
import { siteFontVars } from "@/components/bakti-site/site-fonts"
import { themeVars } from "@/components/bakti-site/ui"
import { Scaled } from "@/components/bakti-site/hero-preview"
import { DentalHero, trustItems } from "./hero"
import { ToothMark } from "./shell"

/** the dental homepage hero for the style step: same markup in every option, only the tokens change */
export function DentalHeroPreview({ theme, viewport, c, cta }: { theme: SiteTheme; viewport: number; c: DentalConfig; cta: string }) {
  const pill = "inline-flex h-12 items-center gap-2 rounded-(--s-btn-radius) px-5 text-[15px] font-semibold"
  return (
    <Scaled width={viewport}>
      <div data-theme="light" className={cn(siteFontVars, "@container w-full bg-(--s-paper) text-(--s-ink) transition-colors duration-300")} style={{ ...themeVars(theme), fontFamily: "var(--s-body)" }}>
        <div className="flex h-16 items-center gap-6 border-b border-(--s-line) px-5 @3xl:h-18 @3xl:px-10">
          <span className="flex items-center gap-2.5">
            <ToothMark size="sm" />
            <span className="text-[18px]" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>{c.name}</span>
          </span>
          <span className="ml-auto hidden gap-6 text-[15px] text-(--s-muted) @3xl:flex">
            <span>Treatments</span>
            <span>New patients</span>
            <span>Our dentists</span>
            <span>Prices</span>
          </span>
          <span className="ml-auto inline-flex h-10 items-center rounded-(--s-btn-radius) bg-(--s-primary) px-4 text-[14px] font-semibold text-(--s-on-primary) @3xl:ml-0">{cta}</span>
        </div>
        <div className="px-5 @3xl:px-10">
          <DentalHero
            c={c}
            theme={theme}
            cta={<span className={cn(pill, "bg-(--s-primary) text-(--s-on-primary)")}><CalendarCheck className="size-[18px]" /> {cta}</span>}
            secondary={<span className={cn(pill, "border border-(--s-line) bg-(--s-card)")}>See treatments</span>}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-(--s-line) bg-(--s-card) px-5 py-5 text-[13px] font-medium @3xl:grid-cols-4 @3xl:px-10 @3xl:text-[14px]">
          {trustItems(c).map(({ Icon, label }) => (
            <span key={label} className="flex items-center gap-2"><Icon className="size-4 shrink-0 text-(--s-primary)" /> {label}</span>
          ))}
        </div>
      </div>
    </Scaled>
  )
}
