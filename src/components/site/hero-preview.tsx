"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CalendarCheck, Lock, MessageCircle, Star } from "lucide-react"
import { cn } from "@/lib/cn"
import { slugify, type Business, type Goal } from "./hero-data"

/** the preview is drawn at this size and scaled to fit its column, so it reads as a tiny real website */
const W = 560
const H = 440
const SHORT = 300

/**
 * The hero's live preview: a small website that takes the visitor's answers as they fill the sentence — the
 * business name in the header and address bar, the colors and wording of the kind of business, and a block that
 * matches what they want the site to do.
 */
export function HeroPreview({ business: b, name, place, goal, className }: { business: Business; name: string; place: string; goal: Goal; className?: string }) {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  // stacked above the sentence (narrow screens) it shows only the top of the site, so the sentence stays in view
  const [short, setShort] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientWidth / W))
      setShort(window.innerWidth < 1024)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const shownName = name.trim() || b.sampleName
  const shownPlace = place.trim() || b.samplePlace
  const swap = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 8, filter: "blur(6px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -6, filter: "blur(6px)" } }
  const ease = { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] as const }

  return (
    <div ref={box} className={cn("relative w-full", className)} style={{ height: (short ? SHORT : H) * scale }} aria-label={`Preview of ${shownName}'s website`} role="img">
      <div
        className="absolute top-0 left-0 origin-top-left overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-[0_4px_0_0_var(--color-neutral-300),0_24px_48px_-24px_rgba(23,46,140,0.25)]"
        style={{ width: W, height: short ? SHORT : H, transform: `scale(${scale})`, ["--brand" as string]: b.color.brand, ["--tint" as string]: b.color.tint, ["--deep" as string]: b.color.deep }}
      >
        {/* browser bar */}
        <div className="flex h-10 items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4">
          <span className="flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2.5 rounded-full bg-neutral-300" />
            ))}
          </span>
          <span className="flex h-6 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 text-[11px] text-neutral-600 ring-1 ring-neutral-200">
            <Lock className="size-3 shrink-0 text-neutral-400" aria-hidden />
            <span className="truncate">
              <span className="text-neutral-900">{slugify(shownName)}</span>.get.space
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-500">
            <span className="relative flex size-2">
              {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-60" />}
              <span className="relative size-2 rounded-full bg-blue-500" />
            </span>
            Live preview
          </span>
        </div>

        {/* site header */}
        <div className="flex h-12 items-center gap-2.5 px-5 transition-colors duration-500">
          <span className="grid size-7 shrink-0 place-items-center rounded-md text-white transition-colors duration-500" style={{ background: "var(--brand)" }}>
            <b.Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 truncate text-[13px] font-semibold text-neutral-900">{shownName}</span>
          <span className="ml-auto flex items-center gap-4 text-[11px] text-neutral-500">
            <span>Services</span>
            <span>About</span>
            <span>Contact</span>
          </span>
        </div>

        {/* site hero */}
        <div className="mx-3 flex h-[196px] gap-4 rounded-lg p-5 transition-colors duration-500" style={{ background: "var(--tint)" }}>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase transition-colors duration-500" style={{ color: "var(--brand)" }}>
              {b.label} · {shownPlace}
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={b.id} {...swap} transition={ease} className="flex flex-col gap-2">
                <p className="font-heading text-[24px] leading-[28px] font-semibold tracking-tight text-balance" style={{ color: "var(--deep)" }}>
                  {b.headline}
                </p>
                <p className="text-[11px] leading-4 text-neutral-600">{b.sub}</p>
              </motion.div>
            </AnimatePresence>
            <span className="mt-1 inline-flex h-8 w-fit items-center rounded-md px-3 text-[11px] font-semibold text-white transition-colors duration-500" style={{ background: "var(--brand)" }}>
              {b.cta}
            </span>
          </div>
          {/* a picture-shaped tile in the business's colors */}
          <div className="relative w-[150px] shrink-0 overflow-hidden rounded-md transition-colors duration-500" style={{ background: "var(--brand)" }} aria-hidden>
            <div className="absolute -top-8 -right-8 size-28 rounded-full bg-white/15" />
            <div className="absolute -bottom-10 -left-6 size-32 rounded-full bg-black/10" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={ease} className="absolute inset-0 grid place-items-center">
                <b.Icon className="size-16 text-white" strokeWidth={1.25} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* what the site is for, then services */}
        <div className="grid grid-cols-[1.15fr_1fr] gap-3 p-3">
          <div className="relative h-[136px] overflow-hidden rounded-lg border border-neutral-200 p-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={goal.id} {...swap} transition={ease} className="flex h-full flex-col gap-2">
                <GoalBlock goal={goal} business={b} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-2">
            {b.services.map((s, i) => (
              <AnimatePresence key={i} mode="wait" initial={false}>
                <motion.div
                  key={b.id + s}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...ease, delay: reduce ? 0 : 0.06 * i }}
                  className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 px-3"
                >
                  <span className="size-2 rounded-full transition-colors duration-500" style={{ background: "var(--brand)" }} />
                  <span className="text-[11px] font-medium text-neutral-800">{s}</span>
                </motion.div>
              </AnimatePresence>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GoalBlock({ goal, business: b }: { goal: Goal; business: Business }) {
  const title = "text-[11px] font-semibold text-neutral-900"
  if (goal.id === "bookings")
    return (
      <>
        <span className={cn(title, "flex items-center gap-1.5")}>
          <CalendarCheck className="size-3.5" style={{ color: "var(--brand)" }} aria-hidden /> Next available
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {["9:30", "11:00", "2:30", "3:15", "4:00", "5:30"].map((t, i) => (
            <span
              key={t}
              className={cn("grid h-7 place-items-center rounded-md text-[10px]", i === 2 ? "font-semibold text-white" : "text-neutral-700 ring-1 ring-neutral-200")}
              style={i === 2 ? { background: "var(--brand)" } : undefined}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-neutral-500">Confirmed instantly · reminder the day before</span>
      </>
    )
  if (goal.id === "enquiries")
    return (
      <>
        <span className={cn(title, "flex items-center gap-1.5")}>
          <MessageCircle className="size-3.5" style={{ color: "var(--brand)" }} aria-hidden /> Ask us anything
        </span>
        <span className="h-6 rounded-md ring-1 ring-neutral-200" />
        <span className="h-9 rounded-md ring-1 ring-neutral-200" />
        <span className="grid h-7 place-items-center rounded-md text-[10px] font-semibold text-white" style={{ background: "var(--brand)" }}>
          Send · we reply within a day
        </span>
      </>
    )
  if (goal.id === "trust")
    return (
      <>
        <span className={cn(title, "flex items-center gap-1")}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-3.5" style={{ fill: "#F5A524", color: "#F5A524" }} aria-hidden />
          ))}
          <span className="ml-1">4.9 from 186 reviews</span>
        </span>
        <p className="text-[11px] leading-4 text-neutral-700 italic">&ldquo;Explained everything before we started. I finally feel at ease.&rdquo;</p>
        <span className="mt-auto flex items-center gap-2 text-[10px] text-neutral-500">
          <span className="size-5 rounded-full" style={{ background: "var(--tint)" }} /> Aisyah, Google review
        </span>
      </>
    )
  return (
    <>
      <span className={title}>Prices</span>
      {b.services.map((s, i) => (
        <span key={s} className="flex items-baseline justify-between gap-2 border-b border-dashed border-neutral-200 pb-1 text-[11px] text-neutral-700 last:border-0">
          {s}
          <span className="font-semibold text-neutral-900">from ${[35, 80, 120][i]}</span>
        </span>
      ))}
    </>
  )
}
