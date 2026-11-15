"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Award, CalendarCheck, Heart, MapPin, ShieldCheck, Smile } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { BUSINESS } from "@/lib/bakti/content"
import { CLINIC_PHOTO } from "@/components/site/assets"
import { siteFontVars } from "./site-fonts"
import { themeVars } from "./ui"

/**
 * The hero section the style step previews. The markup reflects the dental practice brief;
 * every style option applies design tokens (palette, fonts, radii) via CSS variables.
 */
export function HeroPreview({ theme, viewport }: { theme: SiteTheme; viewport: number }) {
  return (
    <Scaled width={viewport}>
      <div
        data-theme="light"
        className={cn(siteFontVars, "@container w-full bg-(--s-paper) text-(--s-ink) transition-colors duration-300")}
        style={{ ...themeVars(theme), fontFamily: "var(--s-body)" }}
      >
        {/* header */}
        <div className="flex h-16 items-center gap-6 border-b border-(--s-line) px-5 @3xl:h-18 @3xl:px-10">
          <span className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-(--s-radius) bg-(--s-primary)">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="var(--s-on-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 2C9 2 7 3.5 6 6c-1.5 4-2.5 8-1 12 1 2.5 3 3 4.5 1 1.2-1.6 1.8-2 2.5-2s1.3.4 2.5 2c1.5 2 3.5 1.5 4.5-1 1.5-4 .5-8-1-12-1-2.5-3-4-6-4Z" />
              </svg>
            </span>
            <span className="text-[18px]" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>{BUSINESS.name}</span>
          </span>
          <span className="ml-auto hidden gap-6 text-[15px] text-(--s-muted) @3xl:flex">
            <span>Treatments</span>
            <span>Our Dentists</span>
            <span>Prices</span>
            <span>Contact</span>
          </span>
          <span className="ml-auto inline-flex h-10 items-center rounded-(--s-btn-radius) bg-(--s-primary) px-4 text-[14px] font-semibold text-(--s-on-primary) @3xl:ml-0">
            Book an appointment
          </span>
        </div>

        {/* hero */}
        <div className="grid items-center gap-8 px-5 py-10 @3xl:grid-cols-[1.1fr_1fr] @3xl:gap-12 @3xl:px-10 @3xl:py-16">
          <div className="flex flex-col gap-5">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-(--s-primary) uppercase">General & Family Dentistry · Penang</p>
            <h1 className="text-[36px] leading-[1.06] tracking-tight @3xl:text-[52px]" style={{ fontFamily: "var(--s-heading)", fontWeight: theme.headingWeight }}>
              Clear, caring dental care for your whole family
            </h1>
            <p className="max-w-xl text-[16px] leading-relaxed text-(--s-muted) @3xl:text-[18px]">
              Routine check-ups, teeth cleaning, braces and emergency care in George Town and Bayan Lepas. We explain everything
              before we start, with honest from-prices and no surprises.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex h-12 items-center gap-2 rounded-(--s-btn-radius) bg-(--s-primary) px-5 text-[15px] font-semibold text-(--s-on-primary)">
                <CalendarCheck className="size-[18px]" /> Book an appointment
              </span>
              <span className="inline-flex h-12 items-center rounded-(--s-btn-radius) border border-(--s-line) bg-(--s-card) px-5 text-[15px] font-semibold">
                See treatments & prices
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -right-6 size-40 rounded-full bg-(--s-soft) opacity-50 blur-2xl" aria-hidden />
            <div className="relative aspect-[4/3] overflow-hidden rounded-(--s-radius-lg) bg-(--s-tint) @3xl:aspect-[4/5]">
              <Image src={CLINIC_PHOTO} alt="Comfortable dental surgery" fill sizes="520px" className="object-cover" />
            </div>
            <div className="absolute bottom-5 -left-3 flex items-center gap-3 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-3 shadow-lg @3xl:-left-8">
              <span className="grid size-10 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
                <Heart className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold">Feeling anxious?</span>
                <span className="text-[12px] text-(--s-muted)">Tell us — we pause whenever you need</span>
              </span>
            </div>
          </div>
        </div>

        {/* trust strip (Playbook §6.1) */}
        <div className="grid grid-cols-2 gap-3 border-t border-(--s-line) bg-(--s-card) px-5 py-5 text-[13px] font-medium @3xl:grid-cols-4 @3xl:px-10 @3xl:text-[14px]">
          {[
            { Icon: Award, label: BUSINESS.accreditation },
            { Icon: Smile, label: "Gentle, anxiety-free approach" },
            { Icon: MapPin, label: "2 branches in Penang" },
            { Icon: ShieldCheck, label: `Trusted since ${BUSINESS.established}` },
          ].map(({ Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon className="size-4 shrink-0 text-(--s-primary)" /> {label}
            </span>
          ))}
        </div>
      </div>
    </Scaled>
  )
}

/** Lays content out at a fixed virtual width and scales it down to fit the available width. */
function Scaled({ width, children }: { width: number; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const o = outer.current, i = inner.current
    if (!o || !i) return
    const ro = new ResizeObserver(() => setBox({ w: o.clientWidth, h: i.offsetHeight }))
    ro.observe(o)
    ro.observe(i)
    return () => ro.disconnect()
  }, [])
  const scale = box.w ? Math.min(1, box.w / width) : 1
  return (
    <div ref={outer} className="w-full min-w-0 overflow-hidden" style={{ maxWidth: width, height: box.h ? box.h * scale : undefined }}>
      <div ref={inner} className="origin-top-left" style={{ width, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
