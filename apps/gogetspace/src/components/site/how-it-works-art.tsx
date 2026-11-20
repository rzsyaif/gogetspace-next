"use client"

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowUp, CircleCheck, FileText, FolderTree, HardDrive, Link2, Plus, Pointer, ShieldCheck, SwatchBook } from "lucide-react"
import { cn } from "@gogetspace/baseplate/cn"
import { getTheme } from "@/lib/bakti/themes"
import { HeroPreview } from "@/components/bakti-site/hero-preview"
import { FONT_STACK } from "@/components/bakti-site/site-fonts"

/**
 * The four "How it works" previews (Figma 190:3583), drawn on a 1200×640 stage that scales to fit. Each plays its
 * appear animation when its step becomes active (`play` changes), and shows the final frame for reduced motion.
 */

const W = 1200
const H = 640
const EASE = [0.22, 1, 0.36, 1] as const

/** scales a fixed 1200×640 artboard into whatever space the panel has, centred */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(Math.min(el.clientWidth / W, el.clientHeight / H))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className={cn("relative size-full overflow-hidden bg-white", className)}>
      <div className="absolute top-1/2 left-1/2" style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

/* ---------------- shared bits ---------------- */

const at = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: "absolute", left: x, top: y, width: w, height: h })

function PromptBox({ children, className, toolbar = true }: { children: ReactNode; className?: string; toolbar?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-[24px] border border-line-strong bg-surface px-5 py-4 shadow-[0_4px_0_0_var(--color-shadow-block)]", className)}>
      {children}
      {toolbar && (
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-md bg-subtle text-fg-primary">
            <Plus className="size-5" />
          </span>
          <span className="flex-1 type-body-sm text-fg-tertiary">Add photos or documents</span>
          <span className="grid size-10 place-items-center rounded-md bg-action-disabled text-fg-disabled">
            <ArrowUp className="size-5" />
          </span>
        </div>
      )}
    </div>
  )
}

/** the generated lab site, as a framed screenshot (live, in the green style) */
function SiteFrame({ style, radius = 24, border = 3 }: { style: CSSProperties; radius?: number; border?: number }) {
  return (
    <div className="overflow-hidden border-line-default bg-white shadow-[0_6px_0_0_var(--color-shadow-block)]" style={{ ...style, borderRadius: radius, borderWidth: border }}>
      <div className="pointer-events-none origin-top-left" style={{ width: 1280, transform: `scale(${(Number(style.width) - border * 2) / 1280})` }}>
        <HeroPreview theme={getTheme("warm-care")} viewport={1280} />
      </div>
    </div>
  )
}

/* ---------------- Step 1: describe your business ---------------- */

const IDEAS = [
  "Online presence for a local law firm in Kuala Lumpur",
  "Website for a pediatric clinic in Johor Bahru",
  "E-commerce site for a boutique pet supply store in Malacca",
  "Landing page for a fitness studio in Ipoh",
  "Website for an artisanal bakery in George Town",
  "Portfolio site for a freelance graphic designer",
  "Website for a wellness center in Kota Kinabalu",
  "Online booking site for a spa in Petaling Jaya",
  "Informational site for a community health organization in Seremban",
  "Website for a travel agency in Langkawi",
]
/** the outer columns sit further back */
const FAINT = new Set([0, 4, 5, 9, 10, 14])
const AVATAR = ["#FFD8B8", "#D7E6FF", "#FFE7A8", "#D1FAE2", "#FFD9CF", "#E6DCFF", "#CDEFF5"]
const PROMPT = "Website for a clinical laboratory named Gold Laboratory in Penang"

export function StepDescribe({ play }: { play: number }) {
  const reduce = useReducedMotion()
  const [typed, setTyped] = useState(reduce ? PROMPT.length : 0)
  // the step remounts (new key) each time it becomes active, so typing starts from the beginning
  useEffect(() => {
    if (reduce || play < 0) return
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setTyped(i)
      if (i >= PROMPT.length) window.clearInterval(id)
    }, 38)
    return () => window.clearInterval(id)
  }, [play, reduce])

  return (
    <>
      <div aria-hidden className="absolute top-1/2 left-1/2 grid w-[1200px] -translate-x-1/2 -translate-y-1/2 grid-cols-5 gap-2 p-2 opacity-50 blur-[2px]">
        {Array.from({ length: 15 }, (_, i) => {
          const base = FAINT.has(i) ? 0.2 : 1
          return (
            <motion.div
              key={i}
              className="flex aspect-square flex-col justify-between rounded-[24px] bg-canvas p-6"
              initial={{ opacity: base }}
              animate={reduce ? { opacity: base } : { opacity: [base, base * 0.45, base] }}
              transition={reduce ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: ((i * 7) % 11) * 0.35 }}
            >
              <span className="grid size-9 place-items-center rounded-full border border-line-default text-[13px] font-semibold text-fg-secondary" style={{ background: AVATAR[i % AVATAR.length] }}>
                {IDEAS[i % IDEAS.length].split(" ").find((w) => /^[A-Z]/.test(w) && w.length > 3)?.[0] ?? "G"}
              </span>
              <p className="type-body-lg text-fg-tertiary">{IDEAS[i % IDEAS.length]}</p>
            </motion.div>
          )
        })}
      </div>
      <div className="absolute top-1/2 left-1/2 w-[588px] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_16px_24px_var(--color-shadow-soft)]">
        <PromptBox>
          <p className="min-h-[84px] type-body-lg text-fg-primary" aria-hidden>
            <span aria-hidden>{PROMPT.slice(0, typed)}</span>
            <motion.span
              aria-hidden
              className="ml-px inline-block h-[22px] w-0.5 translate-y-1 bg-fg-link"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.5, 1] }}
            />
          </p>
        </PromptBox>
      </div>
    </>
  )
}

/* ---------------- Step 2: check your brief ---------------- */

function BriefCard({ title, items, className, style }: { title: string; items: ReactNode[]; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn("flex flex-col gap-2 overflow-hidden rounded-[24px] bg-surface p-6 shadow-[0_16px_48px_-8px_var(--color-shadow-soft)]", className)} style={style}>
      <p className="type-h5 text-fg-primary">{title}</p>
      <ul className="list-disc type-body-md text-fg-secondary">
        {items.map((x, i) => (
          <li key={i} className="ms-6">
            {x}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** appears "from the front": slightly larger, transparent and blurred, settling into place */
function FromFront({ children, order, play, style, blur = 0, opacity = 1 }: { children: ReactNode; order: number; play: number; style: CSSProperties; blur?: number; opacity?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={play}
      style={style}
      initial={reduce ? false : { opacity: 0, scale: 1.12, filter: "blur(24px)" }}
      animate={{ opacity, scale: 1, filter: `blur(${blur}px)` }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.25 + order * 0.16 }}
    >
      {children}
    </motion.div>
  )
}

const hl = (t: string, strong?: boolean) => <span className={cn("border-b border-accent-yellow", strong ? "bg-status-warning-solid text-status-warning-text" : "bg-accent-yellow-subtle")}>{t}</span>

export function StepBrief({ play }: { play: number }) {
  const reduce = useReducedMotion()
  return (
    <>
      <FromFront play={play} order={5} style={at(697, 0, 483, 398)} blur={2} opacity={0.2}>
        <BriefCard
          className="h-full"
          title="Services to feature"
          items={["Routine blood and urine tests: full blood count, glucose, cholesterol, kidney and liver function", "Health screening packages: [Basic, Comprehensive, Women’s, Men’s, Senior]", "Specialist tests: [hormones, allergy panels, tumour markers]", "Pre-employment and corporate screening, including [on-site collection]", "[Home sample collection]", "Online results"]}
        />
      </FromFront>
      <FromFront play={play} order={4} style={at(19, 412, 505)} blur={2} opacity={0.25}>
        <BriefCard title="What the website should achieve" items={["Turn “I need a blood test” into a booked visit or a WhatsApp enquiry.", "Give doctors and HR teams enough confidence to send their work to Gold Lab.", "Cut down repeat phone calls about test preparation, opening hours and results."]} />
      </FromFront>
      <FromFront play={play} order={3} style={at(540, 412, 315)} blur={1} opacity={0.6}>
        <BriefCard title="Who the site is for" items={["Patients who need a blood test or health check, either on their own or with a doctor’s referral.", "Doctors and clinics who send samples to the lab.", "HR teams and companies that need pre-employment or annual staff screening."]} />
      </FromFront>
      <FromFront play={play} order={2} style={at(871, 412, 309)}>
        <div className="flex flex-col rounded-[24px] bg-surface p-6 shadow-[0_16px_48px_-8px_var(--color-shadow-soft)]">
          {["About the business", "Who the site is for", "Services to feature", "What the website should achieve", "Tone & Language", "Must-have features", "Open questions"].map((t, i) => (
            <p key={t} className={cn("border-l py-3 pl-4 type-body-md", i === 0 ? "border-action-primary text-fg-brand" : "border-line-strong text-fg-primary")}>
              {t}
            </p>
          ))}
        </div>
      </FromFront>
      <FromFront play={play} order={1} style={{ ...at(19, 242, 662), transform: "translateY(0)" }} blur={1} opacity={0.5}>
        <BriefCard title="Tone & Language" items={["Tone: reassuring, clear and professional. Plain language for patients and precise detail for doctors.", "Languages: [English and Bahasa Malaysia; Chinese optional]"]} />
      </FromFront>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <PromptBox toolbar={false} className="px-8 py-6">
          <p className="text-center font-heading text-[40px] leading-[48px] font-bold tracking-[-0.6px] whitespace-nowrap text-fg-primary">
            Website for a clinical laboratory named
            <br />
            Gold Laboratory in Penang
          </p>
        </PromptBox>
      </div>

      <FromFront play={play} order={0} style={at(19, 0, 662)}>
        <div className="relative">
          <BriefCard
            title="About the business"
            items={[
              "Name: Gold Laboratory",
              <>What it is: a private clinical laboratory in {hl("George Town", true)}, Penang</>,
              <>Locations: {hl("1 main lab + collection centres in Bayan Lepas and Butterworth")}</>,
              <>Credentials: {hl("MS ISO 15189 accredited; licensed under the Private Healthcare Facilities and Services Act")}</>,
              <>Established: {hl("2008")}</>,
            ]}
          />
          <motion.div
            key={play}
            className="absolute top-[17px] left-[311px] flex flex-col items-center"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 1.5 }}
          >
            <span className="rounded-md border border-line-strong bg-surface px-3 py-2 type-label-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)]">Edit Content</span>
            <Pointer className="mt-1 ml-8 size-6 fill-white text-fg-primary" />
          </motion.div>
        </div>
      </FromFront>
      <div className="pointer-events-none absolute top-[425px] left-0 h-[215px] w-[1200px] bg-gradient-to-b from-white/0 to-white" />
    </>
  )
}

/* ---------------- Step 3: pick a style ---------------- */

const STYLES: { x: number; y: number; head: string; headWeight: number; body: string; colors: string[]; ghost: string; solid: [string, string]; radius: number; tilt?: boolean }[] = [
  { x: 36, y: 36, head: FONT_STACK.bricolage, headWeight: 700, body: FONT_STACK.geist, colors: ["#FFFFFF", "#DCE6FF", "#E4E1DA", "#2F5BFF", "#FFC21F"], ghost: "10px", solid: ["#2F5BFF", "#FFFFFF"], radius: 10 },
  { x: 36, y: 256, head: FONT_STACK.fraunces, headWeight: 600, body: FONT_STACK.geist, colors: ["#FFFFFF", "#D1FAE2", "#E4E1DA", "#34D183", "#FF7558"], ghost: "4px", solid: ["#D1FAE2", "#057647"], radius: 4 },
  { x: 855, y: 172, head: FONT_STACK.dmSerif, headWeight: 400, body: FONT_STACK.dmSans, colors: ["#FFFFFF", "#FBF6F1", "#D1FAE2", "#1F7A5C", "#FF7558"], ghost: "999px", solid: ["#1F7A5C", "#FFFFFF"], radius: 999, tilt: true },
  { x: 855, y: 394, head: FONT_STACK.spaceGrotesk, headWeight: 700, body: FONT_STACK.inter, colors: ["#FFFFFF", "#FFF1EE", "#E4E1DA", "#1E1C19", "#D63F25"], ghost: "0px", solid: ["#1E1C19", "#FFFFFF"], radius: 0 },
]

/** cards fly out from the centre of the artboard to their place */
function FromCenter({ children, order, play, style, delay = 0.35 }: { children: ReactNode; order: number; play: number; style: CSSProperties & { left: number; top: number; width: number; height?: number }; delay?: number }) {
  const reduce = useReducedMotion()
  const cx = W / 2 - (style.left + style.width / 2)
  const cy = H / 2 - (style.top + (style.height ?? 210) / 2)
  return (
    <motion.div
      key={play}
      style={style}
      initial={reduce ? false : { x: cx, y: cy, scale: 0.6, opacity: 0 }}
      animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.75, ease: EASE, delay: delay + order * 0.12 }}
    >
      {children}
    </motion.div>
  )
}

export function StepStyle({ play }: { play: number }) {
  const reduce = useReducedMotion()
  return (
    <>
      <SiteFrame style={{ position: "absolute", left: 212, top: 77, width: 777, height: 486 }} />
      {STYLES.map((s, i) => (
        <FromCenter key={i} order={i} play={play} style={{ position: "absolute", left: s.x, top: s.y, width: 309, height: 210 }}>
          <div className={cn("flex flex-col gap-4 rounded-[16px] border border-line-default bg-surface px-5 py-4", s.tilt && "shadow-[0_16px_24px_var(--color-shadow-soft)]")}>
            <div className="flex flex-col gap-1">
              <p className="text-[32px] leading-10 tracking-[-0.32px] text-fg-primary" style={{ fontFamily: s.head, fontWeight: s.headWeight }}>
                Heading
              </p>
              <p className="text-[16px] leading-6 text-fg-secondary" style={{ fontFamily: s.body }}>
                Paragraph text
              </p>
            </div>
            <div className="flex h-10 gap-0.5 overflow-hidden rounded-[6px]">
              {s.colors.map((c, k) => (
                <span key={k} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <div className="flex gap-2 text-[14px] leading-5 font-semibold" style={{ fontFamily: s.body }}>
              <span className="flex flex-1 justify-center border border-line-strong bg-surface px-3 py-2 text-fg-primary" style={{ borderRadius: s.radius }}>
                Button
              </span>
              <span className="flex flex-1 justify-center px-3 py-2" style={{ borderRadius: s.radius, background: s.solid[0], color: s.solid[1] }}>
                Button
              </span>
            </div>
          </div>
        </FromCenter>
      ))}
      <motion.div
        key={`p${play}`}
        className="absolute top-[284px] left-[1014px]"
        initial={reduce ? false : { opacity: 0, x: 24, y: 24 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 1.2 }}
      >
        <Pointer className="size-16 fill-white text-fg-primary" strokeWidth={1.5} />
      </motion.div>
    </>
  )
}

/* ---------------- Step 4: go live ---------------- */

const LEFT = [
  { y: 209, label: "Project Brief", Icon: FileText },
  { y: 291, label: "Design & Style", Icon: SwatchBook },
  { y: 373, label: "Sitemap Plan", Icon: FolderTree },
]
const RIGHT = [
  { y: 209, label: "Domain", Icon: Link2 },
  { y: 291, label: "Hosting", Icon: HardDrive },
  { y: 373, label: "SSL", Icon: ShieldCheck },
]
/** elbow connectors from each item into the site frame (left edge 306, right edge 895, centre y 320) */
const PATHS = [
  "M210 238 H246 Q258 238 258 250 V308 Q258 320 270 320 H306",
  "M210 320 H306",
  "M210 402 H246 Q258 402 258 390 V332 Q258 320 270 320 H306",
  "M990 238 H954 Q942 238 942 250 V308 Q942 320 930 320 H895",
  "M990 320 H895",
  "M990 402 H954 Q942 402 942 390 V332 Q942 320 930 320 H895",
]

export function StepLive({ play }: { play: number }) {
  const reduce = useReducedMotion()
  // items come out from the centre (from the back), then the lines draw, then light runs along them
  const itemsDone = 0.35 + 5 * 0.1 + 0.7
  return (
    <>
      {[...LEFT.map((x) => ({ ...x, left: 0, muted: true })), ...RIGHT.map((x) => ({ ...x, left: 990, muted: false }))].map((it, i) => (
        <FromCenter key={it.label} order={i} play={play} delay={0.35} style={{ position: "absolute", left: it.left, top: it.y, width: 210, height: 58, zIndex: 0 }}>
          <div className={cn("flex items-center gap-3 rounded-[16px] border border-line-default p-3", it.muted ? "bg-subtle" : "bg-surface")}>
            <it.Icon className="size-8 shrink-0 text-fg-secondary" strokeWidth={1.25} />
            <span className="truncate type-body-md text-fg-secondary">{it.label}</span>
          </div>
        </FromCenter>
      ))}

      <svg className="pointer-events-none absolute inset-0 z-10" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
        <defs>
          <filter id="hiw-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {PATHS.map((d, i) => (
          <motion.path
            key={`${play}-l${i}`}
            d={d}
            stroke="var(--color-line-strong)"
            strokeWidth={1.5}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeInOut", delay: itemsDone + (i % 3) * 0.08 }}
          />
        ))}
        {!reduce &&
          PATHS.map((d, i) => (
            <motion.path
              key={`${play}-g${i}`}
              d={d}
              stroke="#2F5BFF"
              strokeWidth={2.5}
              strokeLinecap="round"
              filter="url(#hiw-glow)"
              initial={{ pathLength: 0.18, pathOffset: 0, opacity: 0 }}
              animate={{ pathOffset: [0, 0.82], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, ease: "easeInOut", times: [0, 0.15, 0.8, 1], repeat: Infinity, repeatDelay: 0.6, delay: itemsDone + 0.7 + (i % 3) * 0.25 }}
            />
          ))}
      </svg>

      <div className="absolute z-20" style={at(305.5, 136, 589, 368)}>
        <SiteFrame style={{ position: "absolute", inset: 0, width: 589, height: 368 }} radius={20} border={2} />
      </div>
      <motion.div
        key={`b${play}`}
        className="absolute top-[477px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line-strong bg-status-info-bg px-5 py-3 shadow-[0_4px_0_0_var(--color-shadow-block)]"
        initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: itemsDone + 0.9 }}
      >
        <CircleCheck className="size-6 text-status-info-text" strokeWidth={1.75} />
        <span className="type-body-lg whitespace-nowrap text-status-info-text">Your website is published!</span>
      </motion.div>
    </>
  )
}
