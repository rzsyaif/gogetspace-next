"use client"

import { useRef, useState, type Ref } from "react"
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react"
import { cn } from "@/lib/cn"
import { Stage, StepBrief, StepDescribe, StepLive, StepStyle } from "./how-it-works-art"

const STEPS = [
  { title: "Describe your business", caption: "A sentence or two is enough. Add your name, city, goal, style or logo if you have them." },
  { title: "Watch it build", caption: "We plan the pages and build a first version straight away. No forms to fill in first." },
  { title: "Make it yours", caption: "Answer a few quick questions, check the brief, and change any text, photo or colour." },
  { title: "Go live", caption: "Publish on a free address or your own domain. Hosting and security are already set up." },
]
/** the preview for each step (Figma 190:3583) */
const ART = [StepDescribe, StepBrief, StepStyle, StepLive]
/** scroll length in viewport heights: one per step, plus extra for the last step and the hand-off to Features */
const SEGMENTS = 6

/**
 * Sticky "How it works" panel. Each 100vh of scroll moves to the next step; the bar above each step
 * fills with real scroll progress (the last bar fills over the remaining length).
 */
export function HowItWorks({ ref }: { ref?: Ref<HTMLElement> }) {
  const targetRef = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] })
  const seg = useTransform(scrollYProgress, (p) => p * SEGMENTS)
  const scale = useTransform(seg, [SEGMENTS - 1, SEGMENTS], [1, reduce ? 1 : 0.95])
  const [active, setActive] = useState(0)
  const [plays, setPlays] = useState(0)
  useMotionValueEvent(seg, "change", (s) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, Math.floor(s)))
    if (next !== active) {
      setActive(next)
      setPlays((n) => n + 1)
    }
  })

  const setRefs = (el: HTMLElement | null) => {
    targetRef.current = el
    if (typeof ref === "function") ref(el)
    else if (ref) ref.current = el
  }

  return (
    <section
      ref={setRefs}
      id="how-it-works"
      aria-labelledby="how-title"
      className="relative z-10 w-full max-w-[1400px]"
      style={{ height: `${(SEGMENTS + 1) * 100}svh` }}
    >
      <motion.div style={{ scale }} className="sticky top-0 h-svh min-h-[640px] origin-top">
        <div className="flex h-full flex-col gap-8 overflow-clip rounded-[32px] border border-neutral-200 bg-white px-5 pt-12 min-[810px]:gap-9 min-[810px]:rounded-[40px] min-[810px]:px-8 min-[810px]:pt-16 min-[1440px]:rounded-[48px] min-[1440px]:px-[100px] min-[1440px]:pt-24">
          <div className="flex flex-col gap-3">
            <p className="type-label-sm text-blue-500">HOW IT WORKS</p>
            <h2 id="how-title" className="type-h2 text-neutral-900">From a sentence to a live website</h2>
            <p className="max-w-[640px] type-body-lg text-neutral-600">
              Describe your business in plain words. We build the first version right away, then you make it yours.
            </p>
          </div>

          <ol className="grid grid-cols-4 gap-3 lg:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} aria-current={i === active ? "step" : undefined} className="flex flex-col gap-3 lg:gap-4">
                <ProgressBar seg={seg} index={i} />
                <div className="hidden flex-col gap-1 lg:flex">
                  <span className={cn("type-label-md transition-colors", i === active ? "text-blue-500" : "text-neutral-500")}>
                    {s.title}
                  </span>
                  <span className="type-body-sm text-neutral-500">{s.caption}</span>
                </div>
                <span className="sr-only lg:hidden">{s.title}</span>
              </li>
            ))}
          </ol>
          {/* compact: only the active step's copy */}
          <div className="-mt-4 grid lg:hidden" aria-hidden>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={false}
                animate={{ opacity: i === active ? 1 : 0, y: i === active ? 0 : 8 }}
                transition={{ duration: 0.25 }}
                className="col-start-1 row-start-1 flex flex-col gap-1"
              >
                <span className="type-label-md text-blue-500">
                  {i + 1}. {s.title}
                </span>
                <span className="type-body-sm text-neutral-500">{s.caption}</span>
              </motion.div>
            ))}
          </div>

          <div className="relative min-h-0 flex-1 overflow-clip rounded-t-xl border border-b-0 border-neutral-200 bg-white">
            {STEPS.map((s, i) => {
              const Art = ART[i]
              return (
                <motion.div
                  key={s.title}
                  initial={false}
                  animate={{ y: i <= active ? 0 : 24, opacity: i <= active ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 34 }}
                  className="absolute inset-0"
                  aria-hidden={i !== active}
                >
                  {/* each preview replays its appear animation whenever its step becomes the active one */}
                  <Stage>{Math.abs(i - active) <= 1 && <Art key={i === active ? plays : -1} play={i === active ? plays : -1} />}</Stage>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function ProgressBar({ seg, index }: { seg: MotionValue<number>; index: number }) {
  const last = index === STEPS.length - 1
  const fill = useTransform(seg, (s) => {
    const p = last ? (s - index) / (SEGMENTS - 1 - index) : s - index
    return Math.max(0, Math.min(1, p))
  })
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-neutral-200">
      <motion.div style={{ scaleX: fill }} className="h-full origin-left bg-blue-500" />
    </div>
  )
}
