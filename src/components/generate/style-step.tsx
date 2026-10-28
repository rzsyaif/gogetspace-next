"use client"

import { useState, type FormEvent } from "react"
import { motion } from "motion/react"
import { ArrowUp, ImageIcon, Loader, Monitor, Plus, RefreshCw, Smartphone, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { ALT_THEMES, CUSTOM_THEME, THEMES, type SiteTheme } from "@/lib/bakti/themes"
import { FONT_STACK, siteFontVars } from "@/components/bakti-site/site-fonts"
import { useGen } from "./gen-provider"
import { HeroPreview } from "@/components/bakti-site/hero-preview"

/**
 * Pick one of the proposed looks (or make your own). The preview is only the hero, in the same layout for every
 * option: the hero is generated once and each option is just a token set, so switching costs no generation.
 */
export function StyleStep() {
  const { s, dispatch } = useGen()
  const [device, setDevice] = useState<"desktop" | "mobile">(() => (typeof window !== "undefined" && window.innerWidth < 640 ? "mobile" : "desktop"))
  const [shuffling, setShuffling] = useState(false)
  const [custom, setCustom] = useState("")
  const [reference, setReference] = useState(false)
  const [making, setMaking] = useState(false)

  const options: SiteTheme[] = [...(s.hasCustom ? [CUSTOM_THEME] : []), ...(s.styleSet === "a" ? THEMES : ALT_THEMES)]

  const shuffle = () => {
    setShuffling(true)
    window.setTimeout(() => {
      dispatch({ type: "styleSet", set: s.styleSet === "a" ? "b" : "a" })
      setShuffling(false)
    }, 1200 / s.speed)
  }
  const makeCustom = (e: FormEvent) => {
    e.preventDefault()
    if (!custom.trim() && !reference) return
    setMaking(true)
    window.setTimeout(() => {
      dispatch({ type: "addCustomStyle" })
      setMaking(false)
      setCustom("")
      setReference(false)
    }, 1800 / s.speed)
  }

  const selected = options.find((t) => t.id === s.styleId) ?? null

  return (
    <div className={cn(siteFontVars, "-mx-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6 lg:mx-0 lg:flex-row lg:gap-9 lg:overflow-visible lg:px-0 lg:pb-0")}>
      {/* hero preview — first on phones so the choice is visible right away */}
      <div className="flex min-w-0 flex-col gap-3 lg:order-last lg:min-h-0 lg:flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="type-label-md text-fg-secondary">{selected ? `Hero preview · ${selected.name}` : "Hero preview"}</p>
          <div className="hidden rounded-full bg-subtle p-1 sm:flex" role="radiogroup" aria-label="Preview size">
            {(["desktop", "mobile"] as const).map((d) => (
              <button key={d} type="button" role="radio" aria-checked={device === d} aria-label={d} onClick={() => setDevice(d)} className={cn("grid size-8 place-items-center rounded-full", device === d ? "bg-surface text-fg-primary shadow-block-sm" : "text-fg-tertiary")}>
                {d === "desktop" ? <Monitor className="size-4" /> : <Smartphone className="size-4" />}
              </button>
            ))}
          </div>
        </div>
        <div className="relative flex max-h-[420px] min-h-[200px] min-w-0 justify-center overflow-hidden rounded-lg border border-line-default bg-canvas p-3 sm:p-6 lg:max-h-none lg:min-h-0 lg:flex-1 lg:items-start lg:overflow-y-auto">
          {/* on small screens the hero is clipped to its top so the options stay in reach */}
          {selected && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-linear-to-t from-canvas to-transparent lg:hidden" aria-hidden />}
          {selected ? (
            <motion.div key={`${selected.id}-${device}`} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className={cn("w-full overflow-hidden rounded-md border border-line-default shadow-soft-md", device === "mobile" && "max-w-[390px]")}>
              <HeroPreview theme={selected} viewport={device === "desktop" ? 1280 : 390} />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Sparkles className="size-7 text-fg-disabled" />
              <p className="type-h5 text-fg-disabled">Pick a style to preview your hero</p>
            </div>
          )}
        </div>
        <p className="type-caption text-fg-tertiary">
          Every option uses the same hero, so you only compare the look. The full site is built after you confirm.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:w-[44%] lg:shrink-0 lg:overflow-y-auto lg:pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="type-body-sm text-fg-secondary">{options.length} options, based on your brief</p>
          <button type="button" onClick={shuffle} disabled={shuffling} className="flex items-center gap-1.5 rounded-sm px-2 py-1 type-label-md text-fg-link hover:bg-action-ghost-hover disabled:opacity-60">
            <RefreshCw className={cn("size-4", shuffling && "animate-spin")} /> <span className="max-sm:hidden">Show me different options</span><span className="sm:hidden">More options</span>
          </button>
        </div>
        <div role="radiogroup" aria-label="Style options" className={cn("-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0", shuffling && "pointer-events-none opacity-50")}>
          {making && (
            <div className="flex min-h-[220px] w-[240px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 p-6 text-center sm:w-auto">
              <Loader className="size-6 animate-spin text-blue-500" />
              <p className="type-label-md text-fg-primary">Creating your style…</p>
              <p className="type-body-sm text-fg-secondary">Reading your description{reference ? " and reference" : ""}</p>
            </div>
          )}
          {options.map((t) => (
            <OptionCard key={t.id} t={t} selected={s.styleId === t.id} onSelect={() => dispatch({ type: "pickStyle", id: t.id })} />
          ))}
        </div>
        <form onSubmit={makeCustom} className="flex flex-col gap-3 rounded-xl border border-line-strong bg-surface px-4 py-3 shadow-[0_4px_0_0_var(--color-shadow-block)] focus-within:border-blue-500 sm:px-5 sm:py-4">
          {reference && (
            <span className="flex items-center gap-2 self-start rounded-md border border-line-default bg-subtle py-1 pr-1 pl-2 type-body-sm">
              <ImageIcon className="size-4 text-fg-tertiary" /> brand-reference.png
              <button type="button" aria-label="Remove reference" onClick={() => setReference(false)} className="grid size-6 place-items-center rounded-sm hover:bg-muted"><X className="size-3.5" /></button>
            </span>
          )}
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Upload a reference" onClick={() => setReference(true)} className="grid size-10 shrink-0 place-items-center rounded-md bg-subtle text-fg-secondary hover:bg-muted">
              <Plus className="size-5" />
            </button>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Create your own style or upload your reference"
              aria-label="Describe your own style"
              className="h-10 min-w-0 flex-1 bg-transparent type-body-md text-fg-primary outline-none placeholder:text-fg-tertiary sm:type-body-lg"
            />
            <button type="submit" aria-label="Create style" disabled={making || (!custom.trim() && !reference)} className="grid size-10 shrink-0 place-items-center rounded-md bg-blue-500 text-white shadow-[0_2px_0_0_var(--color-blue-800)] disabled:bg-action-disabled disabled:text-fg-disabled disabled:shadow-none">
              <ArrowUp className="size-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function OptionCard({ t, selected, onSelect }: { t: SiteTheme; selected: boolean; onSelect: () => void }) {
  const [primary, , , ink, paper] = t.palette
  const btnRadius = Math.min(t.buttonRadius, 18)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border text-left transition-shadow focus-visible:outline-none focus-visible:focus-ring sm:w-auto",
        selected ? "border-blue-500 shadow-[0_0_0_3px_var(--color-blue-100)]" : "border-line-default hover:border-line-strong",
      )}
    >
      <span className="flex w-full items-center gap-3 border-b border-line-default bg-canvas px-5 py-4">
        <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2 bg-surface", selected ? "border-blue-500" : "border-line-strong")}>
          {selected && <span className="size-2.5 rounded-full bg-blue-500" />}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="type-body-md text-fg-primary">{t.name}</span>
          <span className="truncate type-caption text-fg-tertiary">{t.vibe}</span>
        </span>
      </span>
      <span className="flex w-full flex-col gap-4 bg-surface px-5 py-4">
        <span className="flex flex-col gap-1">
          <span className="text-[30px] leading-10 tracking-[-0.01em]" style={{ fontFamily: FONT_STACK[t.heading], fontWeight: t.headingWeight, color: ink }}>
            Heading
          </span>
          <span className="text-[16px] leading-6 text-fg-secondary" style={{ fontFamily: FONT_STACK[t.body] }}>
            Paragraph text
          </span>
        </span>
        <span className="flex h-10 gap-0.5 overflow-hidden rounded-[6px]">
          {t.palette.map((c, i) => (
            <span key={i} className={cn("flex-1", i === 4 && "border border-line-default")} style={{ backgroundColor: c }} />
          ))}
        </span>
        <span className="flex gap-2 text-[14px]" style={{ fontFamily: FONT_STACK[t.body] }}>
          <span className="flex h-9 flex-1 items-center justify-center border border-line-strong" style={{ backgroundColor: paper, color: ink, borderRadius: btnRadius }}>
            Button
          </span>
          <span className="flex h-9 flex-1 items-center justify-center" style={{ backgroundColor: primary, color: t.onPrimary, borderRadius: btnRadius }}>
            Button
          </span>
        </span>
      </span>
    </button>
  )
}
