"use client"

import { useRef, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/cn"
import { Tooltip } from "./tooltip"

export interface SegmentedOption<T extends string | number | boolean> {
  value: T
  label: string
  icon?: ReactNode
  /** extra hint on hover; icon-only options show their label instead */
  tooltip?: ReactNode
}

/**
 * Pill switch between a few options (plan, device size, theme, view). Acts as a radio group by default, or as tabs
 * with `as="tablist"`. Arrow keys move the selection.
 *
 * - `look="subtle"` sits on a surface (grey track, white thumb)
 * - `look="floating"` floats over content (white bar with border, dark thumb) — e.g. Preview / Edit Mode
 */
export function SegmentedControl<T extends string | number | boolean>({
  value,
  onChange,
  options,
  label,
  size = "md",
  look = "subtle",
  iconOnly,
  fill,
  as = "radiogroup",
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  /** accessible name of the group */
  label: string
  size?: "sm" | "md"
  look?: "subtle" | "floating"
  iconOnly?: boolean
  /** stretch options to fill the width */
  fill?: boolean
  as?: "radiogroup" | "tablist"
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = options.findIndex((o) => o.value === value)

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role={as}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex gap-1 rounded-full p-1",
        look === "subtle" ? "bg-subtle" : "border border-line-default bg-surface shadow-soft-md",
        fill && "flex w-full",
        className,
      )}
    >
      {options.map((o, i) => {
        const selected = o.value === value
        const button = (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role={as === "tablist" ? "tab" : "radio"}
            aria-checked={as === "radiogroup" ? selected : undefined}
            aria-selected={as === "tablist" ? selected : undefined}
            aria-label={iconOnly ? o.label : undefined}
            tabIndex={selected || (index < 0 && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
              "focus-visible:outline-none focus-visible:focus-ring [&_svg]:size-4 [&_svg]:shrink-0",
              iconOnly ? (size === "sm" ? "size-8" : "size-9") : cn(size === "sm" ? "h-7 px-3" : "h-9 px-4", "type-label-md"),
              fill && "flex-1",
              selected
                ? look === "subtle"
                  ? "bg-surface text-fg-primary shadow-block-sm"
                  : "bg-inverse text-fg-inverse"
                : "text-fg-secondary hover:text-fg-primary",
            )}
          >
            {o.icon}
            {!iconOnly && o.label}
          </button>
        )
        const tip = o.tooltip ?? (iconOnly ? o.label : null)
        return tip ? (
          <Tooltip key={String(o.value)} content={tip}>
            {button}
          </Tooltip>
        ) : (
          button
        )
      })}
    </div>
  )
}
