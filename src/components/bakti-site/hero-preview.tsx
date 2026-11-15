"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Award, CalendarCheck, Clock, MapPin, ShieldCheck, Smartphone } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { BUSINESS } from "@/lib/bakti/content"
import { CLINIC_PHOTO } from "@/components/site/assets"
import { siteFontVars } from "./site-fonts"
import { themeVars } from "./ui"

/**
 * The hero section the style step previews. The markup is generated once from the brief; every style option is
 * only a set of design tokens (palette, fonts, radii) applied through CSS variables — so trying another style
 * swaps ~15 values instead of generating anything again. The layout stays the same for every option.
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
              <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                <path d="M12 3.5c3 3.6 5.5 6.9 5.5 10a5.5 5.5 0 1 1-11 0c0-3.1 2.5-6.4 5.5-10Z" fill="var(--s-on-primary)" />
              </svg>
            </span>
            <span className="text-[18px]" style={{ fontFamily: "var(--s-heading)", fontWeight: 700 }}>Bakti Analisa</span>
          </span>
          <span className="ml-auto hidden gap-6 text-[15px] text-(--s-muted) @3xl:flex">
            <span>Tests & Packages</span>
            <span>For Doctors</span>
            <span>Locations</span>
            <span>About</span>
          </span>
          <span className="ml-auto inline-flex h-10 items-center rounded-(--s-btn-radius) bg-(--s-primary) px-4 text-[14px] font-semibold text-(--s-on-primary) @3xl:ml-0">
            Book a test
          </span>
        </div>

        {/* hero */}
        <div className="grid items-center gap-8 px-5 py-10 @3xl:grid-cols-[1.1fr_1fr] @3xl:gap-12 @3xl:px-10 @3xl:py-16">
          <div className="flex flex-col gap-5">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-(--s-primary) uppercase">Clinical laboratory · Penang</p>
            <h1 className="text-[36px] leading-[1.06] tracking-tight @3xl:text-[56px]" style={{ fontFamily: "var(--s-heading)", fontWeight: theme.headingWeight }}>
              Lab results you and your doctor can act on
            </h1>
            <p className="max-w-xl text-[16px] leading-relaxed text-(--s-muted) @3xl:text-[18px]">
              Blood tests and health screening in George Town, Bayan Lepas and Butterworth. Book in a minute, walk out in ten, and get your
              results on your phone.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex h-12 items-center gap-2 rounded-(--s-btn-radius) bg-(--s-primary) px-5 text-[15px] font-semibold text-(--s-on-primary)">
                <CalendarCheck className="size-[18px]" /> Book a test
              </span>
              <span className="inline-flex h-12 items-center rounded-(--s-btn-radius) border border-(--s-line) bg-(--s-card) px-5 text-[15px] font-semibold">
                See tests & prices
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -right-6 size-40 rounded-full bg-(--s-soft) opacity-50 blur-2xl" aria-hidden />
            <div className="relative aspect-[4/3] overflow-hidden rounded-(--s-radius-lg) bg-(--s-tint) @3xl:aspect-[4/5]">
              <Image src={CLINIC_PHOTO} alt="" fill sizes="520px" className="object-cover" />
            </div>
            <div className="absolute bottom-5 -left-3 flex items-center gap-3 rounded-(--s-radius) border border-(--s-line) bg-(--s-card) p-3 shadow-lg @3xl:-left-8">
              <span className="grid size-10 place-items-center rounded-full bg-(--s-tint) text-(--s-primary)">
                <Smartphone className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold">Results ready</span>
                <span className="text-[12px] text-(--s-muted)">Sent to your phone · 4:12 pm</span>
              </span>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div className="grid grid-cols-2 gap-3 border-t border-(--s-line) bg-(--s-card) px-5 py-5 text-[13px] font-medium @3xl:grid-cols-4 @3xl:px-10 @3xl:text-[14px]">
          {[
            { Icon: Award, label: `${BUSINESS.accreditation} accredited` },
            { Icon: Clock, label: "Most results the same day" },
            { Icon: MapPin, label: "3 centres across Penang" },
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
