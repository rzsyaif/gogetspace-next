"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Loader, RefreshCw, Sparkles } from "lucide-react"
import { IconButton, RadioDot, Tooltip } from "@/components/ui"
import { cn } from "@/lib/cn"
import type { SiteTheme } from "@/lib/bakti/themes"
import { HeroPreview } from "@/components/bakti-site/hero-preview"

/**
 * Phone version of the style step: each option is one big card (name + its hero) in a swipeable row, and the card
 * in the middle is the choice. The last card makes a style from the person's own description.
 */
export function StyleCarousel({
  options,
  selectedId,
  onPick,
  onShuffle,
  shuffling,
  making,
  customForm,
}: {
  options: SiteTheme[]
  selectedId: string | null
  onPick: (id: string) => void
  onShuffle: () => void
  shuffling: boolean
  making: boolean
  /** the "describe your style" form, shown when the last card is opened */
  customForm: ReactNode
}) {
  const row = useRef<HTMLDivElement>(null)
  const settle = useRef<number | undefined>(undefined)
  const selectedIndex = options.findIndex((o) => o.id === selectedId)
  const [active, setActive] = useState(Math.max(0, selectedIndex))
  const [customOpen, setCustomOpen] = useState(false)
  const total = options.length + 1
  const ids = options.map((o) => o.id).join()
  // a new set of options (or the new custom style) closes the "describe" card
  const [seenIds, setSeenIds] = useState(ids)
  if (ids !== seenIds) {
    setSeenIds(ids)
    setCustomOpen(false)
  }

  const slideWidth = () => {
    const first = row.current?.children[0] as HTMLElement | undefined
    return first ? first.offsetWidth + 12 : 1
  }
  const scrollTo = (i: number, smooth = true) => row.current?.scrollTo({ left: i * slideWidth(), behavior: smooth ? "smooth" : "instant" })

  // the card that settles in the middle becomes the choice
  const onScroll = () => {
    const el = row.current
    if (!el) return
    const i = Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / slideWidth())))
    setActive(i)
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      if (i < options.length && options[i].id !== selectedId) onPick(options[i].id)
    }, 140)
  }

  // nothing picked yet: the first card is the choice; a new set (or a new custom style): jump to the picked card
  useEffect(() => {
    if (selectedIndex < 0) {
      onPick(options[0].id)
      scrollTo(0, false)
    } else scrollTo(selectedIndex, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the set of options or the choice changes from outside
  }, [ids, selectedId])
  useEffect(() => () => window.clearTimeout(settle.current), [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="type-body-sm text-fg-secondary">
          {options.length} options · <span className="text-fg-tertiary">swipe to compare</span>
        </p>
        <Tooltip content="Show me different options">
          <IconButton aria-label="Show me different options" size="lg" shape="round" tone="filled" onClick={onShuffle} disabled={shuffling}>
            <RefreshCw className={cn(shuffling && "animate-spin")} />
          </IconButton>
        </Tooltip>
      </div>

      <div
        ref={row}
        onScroll={onScroll}
        role="radiogroup"
        aria-label="Style options"
        className={cn("-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]", shuffling && "pointer-events-none opacity-50")}
      >
        {options.map((t, i) => {
          const selected = t.id === selectedId
          return (
            <div
              key={t.id}
              role="radio"
              aria-checked={selected}
              aria-label={`${t.name}: ${t.vibe}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => scrollTo(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") scrollTo(Math.min(total - 1, i + 1))
                if (e.key === "ArrowLeft") scrollTo(Math.max(0, i - 1))
              }}
              className={cn(
                "flex w-[86%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-surface transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:focus-ring",
                selected ? "border-line-focus shadow-[0_0_0_3px_var(--color-blue-100)]" : "border-line-default",
              )}
            >
              <div className="flex items-center gap-2.5 border-b border-line-default bg-canvas px-4 py-3">
                <RadioDot checked={selected} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate type-label-md text-fg-primary">{t.name}</span>
                  <span className="truncate type-caption text-fg-tertiary">{t.vibe}</span>
                </span>
                <span className="flex h-5 overflow-hidden rounded-full border border-line-default" aria-hidden>
                  {t.palette.slice(0, 4).map((c) => (
                    <span key={c} className="w-3" style={{ backgroundColor: c }} />
                  ))}
                </span>
              </div>
              <div className="relative h-[min(420px,50svh)] overflow-hidden bg-canvas p-3">
                <div className="overflow-hidden rounded-md border border-line-default shadow-soft-sm">
                  <HeroPreview theme={t} viewport={390} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-canvas to-transparent" aria-hidden />
              </div>
            </div>
          )
        })}

        {/* fifth card: make your own */}
        <div
          className={cn(
            "flex w-[86%] shrink-0 snap-start flex-col rounded-xl border border-dashed p-4",
            active === options.length ? "border-line-focus bg-accent-blue-subtle/40" : "border-line-strong bg-subtle",
          )}
        >
          {making ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Loader className="size-7 animate-spin text-fg-brand" />
              <p className="type-label-lg text-fg-primary">Creating your style…</p>
              <p className="type-body-sm text-fg-secondary">It&apos;ll appear as the first card.</p>
            </div>
          ) : customOpen ? (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="type-label-lg text-fg-primary">Describe your style</p>
                <p className="type-body-sm text-fg-secondary">Colours, mood, a brand you like — or add a reference image.</p>
              </div>
              {customForm}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                scrollTo(options.length)
                setCustomOpen(true)
              }}
              className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg text-center focus-visible:outline-none focus-visible:focus-ring"
            >
              <span className="grid size-14 place-items-center rounded-full bg-surface text-fg-brand shadow-block-sm">
                <Sparkles className="size-6" />
              </span>
              <span className="type-label-lg text-fg-primary">Create your own style</span>
              <span className="max-w-[240px] type-body-sm text-fg-secondary">Describe a look or upload a reference, and I&apos;ll make it into an option.</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => scrollTo(i)}
            className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-fg-primary" : "w-1.5 bg-line-strong", i === options.length && i !== active && "bg-blue-300")}
          />
        ))}
      </div>
    </div>
  )
}
