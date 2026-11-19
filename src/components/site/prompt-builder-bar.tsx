"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, ImageUp, Plus, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { BUSINESS_TYPES, apply, detailOf, goalChoices, styleChoices, type Reading, type SlotId } from "@/lib/prompt-builder"

/**
 * The blanks under the prompt: what the builder already knows (filled) and what it would still like (open).
 * Picking one opens a tiny question inline — the same idea as the Quick Questions, before anything is built.
 */
export function PromptBuilderBar({
  text,
  reading,
  open,
  setOpen,
  logo,
  setLogo,
  skipped,
  skip,
  onText,
}: {
  text: string
  reading: Reading
  open: SlotId | null
  setOpen: (s: SlotId | null) => void
  logo: boolean
  setLogo: (v: boolean) => void
  skipped: SlotId[]
  skip: (s: SlotId) => void
  onText: (t: string) => void
}) {
  const r = reading
  const detail = detailOf(r.type)
  const slots: { id: SlotId; label: string; value: string | null }[] = [
    { id: "type", label: "Business type", value: r.type?.label ?? null },
    { id: "name", label: "Name", value: r.name },
    { id: "place", label: "City", value: r.place },
    { id: "goal", label: "Main goal", value: r.goal?.label ?? null },
    ...(detail ? [{ id: "detail" as const, label: detail.label, value: r.detail?.label ?? null }] : []),
    { id: "style", label: "Style", value: r.style?.name ?? null },
    { id: "logo", label: "Logo", value: logo ? "Logo.png" : null },
  ]
  const shown = slots.filter((s) => s.value || !skipped.includes(s.id))
  const filled = slots.filter((s) => s.value).length

  const pick = (slot: Exclude<SlotId, "logo">, value: string) => {
    onText(apply(text, slot, value))
    setOpen(null)
  }

  return (
    <div data-prompt-builder className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="type-label-sm text-neutral-500">
          {filled === slots.length ? (
            "Everything the builder needs"
          ) : (
            <>
              Add details<span className="max-sm:hidden"> — the more you add, the fewer questions later</span>
            </>
          )}
        </span>
        <span className="shrink-0 type-label-sm text-neutral-500 tabular-nums">
          {filled}/{slots.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {shown.map((s) =>
          s.value ? (
            <span key={s.id} className="flex h-8 max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-3 type-label-sm text-blue-700">
              <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={2.5} />
              <span className="truncate">
                <span className="sr-only">{s.label}: </span>
                {s.value}
              </span>
              {s.id === "logo" && (
                <button type="button" aria-label="Remove logo" onMouseDown={(e) => e.preventDefault()} onClick={() => setLogo(false)} className="-mr-1 grid size-5 place-items-center rounded-full hover:bg-blue-100">
                  <X aria-hidden className="size-3" />
                </button>
              )}
            </span>
          ) : (
            <button
              key={s.id}
              type="button"
              aria-expanded={open === s.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(open === s.id ? null : s.id)}
              className={cn(
                "flex h-8 items-center gap-1 rounded-full border border-dashed px-3 type-label-sm transition-colors",
                open === s.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900",
              )}
            >
              <Plus aria-hidden className="size-3.5" strokeWidth={2.5} />
              {s.label}
            </button>
          ),
        )}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {open && (
          <motion.div
            key={open}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 rounded-lg bg-neutral-50 p-3">
              {open === "type" && (
                <Question title="What kind of business is it?" onSkip={() => (skip("type"), setOpen(null))}>
                  {BUSINESS_TYPES.map((t) => (
                    <Pill key={t.id} onClick={() => pick("type", t.id)}>
                      {t.label}
                    </Pill>
                  ))}
                </Question>
              )}
              {open === "name" && <TextQuestion title="What's the business called?" placeholder="e.g. Rahma Family Dental" onDone={(v) => pick("name", v)} onSkip={() => (skip("name"), setOpen(null))} />}
              {open === "place" && <TextQuestion title="Which city is it in?" placeholder="e.g. Penang" onDone={(v) => pick("place", v.replace(/^\w/, (c) => c.toUpperCase()))} onSkip={() => (skip("place"), setOpen(null))} />}
              {open === "goal" && (
                <Question title="What should the website do most?" onSkip={() => (skip("goal"), setOpen(null))}>
                  {goalChoices(r.type).map((g) => (
                    <Pill key={g.id} onClick={() => pick("goal", g.phrase)}>
                      {g.label}
                    </Pill>
                  ))}
                </Question>
              )}
              {open === "detail" && detail && (
                <Question title={r.type?.niche === "lawyer" ? "Which area of law, mainly?" : "What kind of dentistry, mainly?"} onSkip={() => (skip("detail"), setOpen(null))}>
                  {detail.choices.map((c) => (
                    <Pill key={c.id} onClick={() => pick("detail", c.phrase)}>
                      {c.label}
                    </Pill>
                  ))}
                </Question>
              )}
              {open === "style" && (
                <Question title="Pick a look — you can change it later" onSkip={() => (skip("style"), setOpen(null))} skipLabel="Let the builder pick">
                  {styleChoices(r.type).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick("style", t.name)}
                      className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white py-1.5 pr-3 pl-1.5 type-label-sm text-neutral-800 hover:border-blue-500"
                    >
                      <span aria-hidden className="flex overflow-hidden rounded-sm">
                        {t.palette.slice(0, 3).map((c) => (
                          <span key={c} className="h-6 w-3" style={{ background: c }} />
                        ))}
                      </span>
                      {t.name}
                    </button>
                  ))}
                </Question>
              )}
              {open === "logo" && (
                <Question title="Got a logo? I'll use its colours too." onSkip={() => (skip("logo"), setOpen(null))} skipLabel="No logo yet">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setLogo(true)
                      setOpen(null)
                    }}
                    className="flex h-9 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 type-label-sm text-neutral-900 hover:border-blue-500"
                  >
                    <ImageUp aria-hidden className="size-4" /> Upload logo
                  </button>
                </Question>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Question({ title, children, onSkip, skipLabel = "Skip" }: { title: string; children: ReactNode; onSkip: () => void; skipLabel?: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="type-label-md text-neutral-900">{title}</p>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onSkip} className="shrink-0 type-label-sm text-neutral-500 hover:text-neutral-900">
          {skipLabel}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </>
  )
}

function Pill({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="h-9 rounded-md border border-neutral-200 bg-white px-3 type-label-sm text-neutral-800 hover:border-blue-500 hover:text-blue-700"
    >
      {children}
    </button>
  )
}

function TextQuestion({ title, placeholder, onDone, onSkip }: { title: string; placeholder: string; onDone: (v: string) => void; onSkip: () => void }) {
  const [v, setV] = useState("")
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])
  const done = () => v.trim() && onDone(v.trim())
  return (
    <Question title={title} onSkip={onSkip}>
      <div className="flex w-full gap-2">
        <input
          ref={ref}
          value={v}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              e.stopPropagation()
              done()
            }
            if (e.key === "Escape") onSkip()
          }}
          className="h-9 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 type-body-sm text-neutral-900 outline-none focus:border-blue-500"
        />
        <button type="button" disabled={!v.trim()} onClick={done} className="h-9 shrink-0 rounded-md bg-neutral-900 px-3 type-label-sm text-white disabled:opacity-40">
          Add
        </button>
      </div>
    </Question>
  )
}
