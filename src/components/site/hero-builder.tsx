"use client"

import { useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, Check, ChevronDown, PenLine, Undo2 } from "lucide-react"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui"
import { cn } from "@/lib/cn"
import { BUSINESSES, GOALS, briefFrom } from "./hero-data"
import { HeroPreview } from "./hero-preview"
import { LaunchOverlay } from "./launch-overlay"
import { PromptInput } from "./prompt-input"
import { emitPromptActive } from "./prompt-events"

const blank =
  "rounded-md bg-blue-50 px-1.5 text-blue-500 underline decoration-blue-300 decoration-dashed decoration-2 underline-offset-[6px] transition-colors outline-none hover:bg-blue-100 focus-visible:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500"

/**
 * The hero's quick start: a sentence with four blanks (kind of business, name, place, goal) instead of an empty
 * box, and a small website beside it that takes each answer as it's given. "Describe it yourself" swaps in the free
 * prompt, carrying the sentence over.
 */
export function HeroBuilder({ flowHref }: { flowHref: string }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [businessId, setBusinessId] = useState(BUSINESSES[0].id)
  const [name, setName] = useState("")
  const [place, setPlace] = useState("")
  const [goalId, setGoalId] = useState<string>(GOALS[0].id)
  const [free, setFree] = useState(false)
  const [launch, setLaunch] = useState<{ rect: DOMRect; text: string; href: string } | null>(null)
  const card = useRef<HTMLFormElement>(null)
  const business = BUSINESSES.find((b) => b.id === businessId)!
  const goal = GOALS.find((g) => g.id === goalId)!
  const brief = briefFrom(business, name, place, goal)

  const start = (e: FormEvent) => {
    e.preventDefault()
    if (launch) return
    const href = `${flowHref}?q=${encodeURIComponent(brief)}`
    try {
      sessionStorage.removeItem("gogetspace-generation")
    } catch {}
    router.prefetch(href)
    if (reduce || !card.current) return router.push(href)
    setLaunch({ rect: card.current.getBoundingClientRect(), text: brief, href })
  }

  return (
    <div className="grid w-full items-center gap-6 min-[1024px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[1024px]:gap-12">
      <HeroPreview business={business} name={name} place={place} goal={goal} className="order-first min-[1024px]:order-last" />

      <div className="flex min-w-0 flex-col gap-4">
        <AnimatePresence mode="wait" initial={false}>
          {free ? (
            <motion.div key="free" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
              <PromptInput flowHref={flowHref} initialText={brief} />
              <button type="button" onClick={() => setFree(false)} className="inline-flex items-center gap-1.5 self-center rounded-sm type-label-md text-fg-link hover:underline focus-visible:outline-none focus-visible:focus-ring min-[1024px]:self-start">
                <Undo2 className="size-4" aria-hidden /> Back to the quick start
              </button>
            </motion.div>
          ) : (
            <motion.div key="sentence" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
              <form
                ref={card}
                onSubmit={start}
                onFocus={() => emitPromptActive(true)}
                aria-label="Tell us about your business"
                className={cn("flex flex-col gap-6 rounded-xl border border-neutral-300 bg-white p-5 shadow-[0_4px_0_0_var(--color-neutral-300)] sm:p-7", launch && "invisible")}
              >
                {launch && <LaunchOverlay from={launch.rect} text={launch.text} onDone={() => router.push(launch.href)} />}
                <p className="font-heading text-[22px] leading-[44px] font-semibold text-neutral-900 sm:text-[28px] sm:leading-[52px]">
                  I run a{" "}
                  <Choice label={business.label} ariaLabel="Kind of business" options={BUSINESSES.map((b) => ({ id: b.id, label: b.label, Icon: b.Icon }))} value={businessId} onChange={setBusinessId} />{" "}
                  called <Blank value={name} onChange={setName} placeholder={business.sampleName} ariaLabel="Business name" focusTarget /> in{" "}
                  <Blank value={place} onChange={setPlace} placeholder={business.samplePlace} ariaLabel="City or area" />, and I want{" "}
                  <Choice label={goal.label} ariaLabel="What the website should do" options={GOALS.map((g) => ({ id: g.id, label: g.label }))} value={goalId} onChange={setGoalId} />.
                </p>
                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-center type-body-sm text-neutral-500 sm:text-left">Tap the blue words to change them</span>
                  <Button type="submit" size="lg" className="max-sm:w-full">
                    Build my website
                    <ArrowRight aria-hidden />
                  </Button>
                </div>
              </form>
              <button type="button" onClick={() => setFree(true)} className="inline-flex items-center gap-1.5 self-center rounded-sm type-label-md text-neutral-600 hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring min-[1024px]:self-start">
                <PenLine className="size-4" aria-hidden /> Rather describe it in your own words?
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** a blank in the sentence you pick from a short list */
function Choice({ label, ariaLabel, options, value, onChange }: { label: string; ariaLabel: string; options: { id: string; label: string; Icon?: React.ComponentType<{ className?: string }> }[]; value: string; onChange: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`${ariaLabel}: ${label}`} className={cn(blank, "inline cursor-pointer [&[data-state=open]>svg]:rotate-180")}>
        {label}
        <ChevronDown aria-hidden className="ml-0.5 inline size-5 align-[-2px] no-underline transition-transform" strokeWidth={2.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {options.map((o) => (
          <DropdownMenuItem key={o.id} onSelect={() => onChange(o.id)} className="gap-3 py-2.5">
            {o.Icon && <o.Icon className="size-4 text-fg-secondary" />}
            <span className="flex-1 first-letter:uppercase">{o.label}</span>
            {o.id === value && <Check aria-hidden className="size-4 text-fg-link" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** a blank in the sentence you type into; it grows with what's typed */
function Blank({ value, onChange, placeholder, ariaLabel, focusTarget }: { value: string; onChange: (v: string) => void; placeholder: string; ariaLabel: string; focusTarget?: boolean }) {
  return (
    <span className={cn(blank, "inline-grid max-w-full align-baseline focus-within:bg-blue-100 focus-within:ring-2 focus-within:ring-blue-500")}>
      <span aria-hidden className="invisible col-start-1 row-start-1 truncate whitespace-pre">
        {value || placeholder}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        data-hero-focus={focusTarget || undefined}
        maxLength={40}
        size={1}
        className="col-start-1 row-start-1 w-full min-w-[2ch] bg-transparent text-blue-500 outline-none placeholder:text-blue-500/55"
      />
    </span>
  )
}
