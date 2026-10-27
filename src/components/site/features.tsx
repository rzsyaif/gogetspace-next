"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import { motion, useInView, useReducedMotion, type Transition, type Variants } from "motion/react"
import {
  Check,
  Cloud,
  Ellipsis,
  Globe,
  KeyRound,
  Link2,
  Lock,
  MousePointer2,
  PencilLine,
  RefreshCw,
  Server,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { CLINIC_PHOTO } from "./assets"
import { demoFontVars } from "./demo-fonts"

/*
 * Six dark feature cards. Hovering a card (or scrolling it into view on touch screens) plays its
 * illustration. Geometry is the Figma frame's, in a 400px-wide coordinate space.
 */

const SPRING: Transition = { type: "spring", stiffness: 100, damping: 15, mass: 1 }

/**
 * Figma reports a rotated layer's x/y at its rotated top-left corner, rotating counter-clockwise.
 * CSS rotates clockwise around the centre, so move the box to where its centre really is.
 */
function rot(x: number, y: number, width: number, height: number, deg: number) {
  const r = (deg * Math.PI) / 180
  const cx = x + (width / 2) * Math.cos(r) + (height / 2) * Math.sin(r)
  const cy = y - (width / 2) * Math.sin(r) + (height / 2) * Math.cos(r)
  return { left: cx - width / 2, top: cy - height / 2, width, height, rotate: -deg }
}

/** true on touch screens while the card is mostly on screen, so the animation still gets seen */
function useTouchPlay(ref: React.RefObject<HTMLElement | null>) {
  const inView = useInView(ref, { amount: 0.6 })
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)")
    const update = () => setTouch(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return touch && inView
}

function FeatureCard({
  title,
  desc,
  media,
  mediaFirst,
  body,
  backdrop,
  className,
}: {
  title?: string
  desc: string
  media: ReactNode
  mediaFirst?: boolean
  body?: ReactNode
  /** decoration behind the whole card */
  backdrop?: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const play = useTouchPlay(ref)
  const reduce = useReducedMotion()
  return (
    <motion.article
      ref={ref}
      initial="rest"
      animate={play ? "hover" : "rest"}
      whileHover={reduce ? undefined : "hover"}
      variants={{ rest: { backgroundColor: "#1E1C19" }, hover: { backgroundColor: "#302D29" } }}
      transition={SPRING}
      className={cn("relative isolate flex h-[457px] flex-col overflow-clip", mediaFirst ? "" : "flex-col-reverse", className)}
    >
      {backdrop}
      <div className="relative min-h-0 flex-1 overflow-clip" aria-hidden>
        <div className="absolute inset-y-0 left-1/2 w-[400px] -translate-x-1/2">{media}</div>
      </div>
      <div className="relative z-10 flex flex-col gap-2 p-8">
        {body}
        {title && <h3 className="type-h5 text-neutral-50">{title}</h3>}
        <p className="type-body-sm text-neutral-300">{desc}</p>
      </div>
    </motion.article>
  )
}

/* ---------------- 1. All set up ---------------- */

const GLOWS = [
  { color: "#2F5BFF", blur: 60, rest: rot(343, -47.9, 197.6, 111.3, 24.5), hover: rot(50.3, 126.4, 436.9, 246, 24.5), opacity: 0.8 },
  { color: "#302D29", blur: 50, rest: rot(351.9, -50.4, 182.9, 121.3, 41.5), hover: rot(69.9, 120.8, 404.3, 268.2, 41.5), opacity: 1 },
  { color: "#D900FF", blur: 60, rest: rot(408.1, 1.6, 161.4, 138.6, 53.5), hover: rot(194.2, 235.8, 356.9, 306.5, 53.5), opacity: 0.4 },
]

function AllSetUpGlows() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-[400px] -translate-x-1/2">
      {GLOWS.map((g, i) => (
        <motion.div
          key={i}
          variants={{ rest: { ...g.rest, opacity: 0 }, hover: { ...g.hover, opacity: g.opacity } }}
          transition={SPRING}
          className="absolute rounded-full"
          style={{ backgroundColor: g.color, filter: `blur(${g.blur}px)` }}
        />
      ))}
    </div>
  )
}

/* ---------------- 2. Plan your space ---------------- */

const BRIEF_SECTIONS = ["Goals", "Target audience", "Service lines", "Tone of voice", "Key requirements", "Contacts", "Other details"]

function PlanMedia() {
  const brief = rot(107.5, 52, 336, 272, -8.8)
  const menu = rot(-245.6, 387.7, 205, 302, 15)
  return (
    <>
      <motion.div
        variants={{ rest: { ...brief, scale: 1, opacity: 1 }, hover: { left: 40, top: 28.4, rotate: 0, scale: 0.9, opacity: 0.5 } }}
        transition={SPRING}
        style={{ width: brief.width, height: brief.height }}
        className="absolute flex flex-col gap-3 overflow-hidden rounded-lg bg-white p-6"
      >
        <p className="type-h5 text-neutral-900">Penang Clinical Laboratory</p>
        <p className="type-body-sm text-neutral-900">
          Penang Clinical Laboratory is a clinical laboratory serving individual patients, referring doctors and clinics, and
          companies that need employee health screening. The site needs to turn “I need a blood test / a health check” into a
          booked visit or an enquiry, and to give doctors and HR teams enough confidence in the lab’s quality to send work its way.
        </p>
      </motion.div>
      <motion.span
        variants={{ rest: { left: 509 }, hover: { left: 279 } }}
        transition={SPRING}
        className="absolute top-[23px] inline-flex h-9 items-center gap-1 rounded-md bg-blue-500 px-3 type-label-md text-white shadow-[0_2px_0_0_var(--color-blue-800)]"
      >
        <PencilLine className="size-4" />
        Edit Brief
      </motion.span>
      <motion.ul
        variants={{ rest: { left: menu.left, top: menu.top, rotate: menu.rotate }, hover: { left: 20, top: 96, rotate: 0 } }}
        transition={SPRING}
        style={{ width: menu.width }}
        className="absolute flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-soft-md"
      >
        {BRIEF_SECTIONS.map((s, i) => (
          <li
            key={s}
            className={cn(
              "flex h-9 items-center rounded-sm px-2",
              i === 0 ? "bg-blue-50 type-label-md text-blue-600" : "type-body-sm text-neutral-900",
            )}
          >
            {s}
          </li>
        ))}
      </motion.ul>
    </>
  )
}

/* ---------------- 3. Edit your site ---------------- */

const fade: Variants = { rest: { opacity: 0 }, hover: { opacity: 1 } }

function EditMenu({ title, items }: { title: string; items: { label: string; Icon: typeof Check }[] }) {
  return (
    <div className="flex w-[229px] flex-col gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-soft-md">
      <p className="px-3 py-2 type-h6 text-neutral-900">{title}</p>
      {items.map(({ label, Icon }) => (
        <p key={label} className="flex items-center gap-2 rounded-sm px-3 py-2 type-body-md text-neutral-900 first-of-type:bg-neutral-100">
          <Icon className="size-4 text-neutral-600" />
          {label}
        </p>
      ))}
    </div>
  )
}

function Pointer({ rest, hover }: { rest: { left: number; top: number }; hover: { left: number; top: number } }) {
  return (
    <motion.span variants={{ rest, hover }} transition={SPRING} className="absolute size-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <MousePointer2 className="size-6 fill-neutral-900" strokeWidth={1.5} />
    </motion.span>
  )
}

function EditMedia() {
  const handles = [
    [12, 58],
    [234, 58],
    [12, 150],
    [234, 150],
  ]
  return (
    <div className={cn(demoFontVars, "contents")}>
      <motion.div
        variants={{ rest: { left: 16, top: 16, backgroundColor: "#EDEDED" }, hover: { left: 46, top: 1, backgroundColor: "#FFFCF2" } }}
        transition={SPRING}
        className="absolute flex h-[279.5px] w-[443.5px] items-center gap-4 rounded-lg py-1 pr-1 pl-6"
      >
        <div className="flex w-[201.5px] flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-(family-name:--font-dm-sans) text-[8px] leading-3 font-semibold tracking-wider text-neutral-900">LAB YOU CAN TRUST</p>
            <motion.p
              variants={{ rest: { color: "#797979" }, hover: { color: "#057647" } }}
              transition={SPRING}
              className="font-(family-name:--font-dm-serif) text-[24px] leading-[26px]"
            >
              Laboratory results your doctor can act on
            </motion.p>
            <p className="font-(family-name:--font-dm-sans) text-[8px] leading-3 text-neutral-900">
              Penang Clinical Laboratory runs routine and specialist testing for patients, referring clinics and companies — with
              quality control at every step, and a report laid out so your doctor can act on it at a glance.
            </p>
          </div>
          <div className="flex gap-1.5 font-(family-name:--font-dm-sans) text-[9px] leading-3 font-medium">
            <motion.span
              variants={{ rest: { backgroundColor: "#797979" }, hover: { backgroundColor: "#057647" } }}
              transition={SPRING}
              className="rounded-[5px] px-3 py-2 text-white"
            >
              Book a visit
            </motion.span>
            <span className="rounded-[5px] bg-[#797979]/10 px-3 py-2 text-[#797979]">Find your test</span>
          </div>
        </div>
        <div className="relative h-[271.5px] w-[190px] shrink-0 overflow-hidden rounded-md bg-neutral-300">
          <Image src={CLINIC_PHOTO} alt="" fill sizes="190px" className="object-cover" />
        </div>
        {/* selection overlays */}
        <motion.div variants={fade} transition={SPRING} className="pointer-events-none absolute inset-0">
          <span className="absolute h-[92px] w-[221.5px] border border-blue-500/50" style={{ left: 14, top: 59.8 }} />
          <span className="absolute h-[287.5px] w-[206px] border border-blue-500/50" style={{ left: 243.5, top: -4 }} />
          {handles.map(([l, t]) => (
            <span key={`${l}-${t}`} className="absolute size-1 border border-blue-500/50 bg-white" style={{ left: l, top: t }} />
          ))}
        </motion.div>
      </motion.div>

      <motion.div variants={{ rest: { left: -288, top: 132 }, hover: { left: 12, top: 132 } }} transition={SPRING} className="absolute">
        <EditMenu
          title="Text"
          items={[
            { label: "Edit text", Icon: PencilLine },
            { label: "Regenerate text", Icon: RefreshCw },
          ]}
        />
      </motion.div>
      <motion.div variants={{ rest: { left: 272, top: 335 }, hover: { left: 262, top: 165 } }} transition={SPRING} className="absolute">
        <EditMenu
          title="Image"
          items={[
            { label: "Upload image", Icon: Upload },
            { label: "Regenerate image", Icon: RefreshCw },
          ]}
        />
      </motion.div>
      <Pointer rest={{ left: 385, top: -134 }} hover={{ left: 165, top: 118 }} />
      <Pointer rest={{ left: 336, top: -104 }} hover={{ left: 336, top: 156 }} />
    </div>
  )
}

/* ---------------- 4. Hosting handled ---------------- */

const RINGS = [
  { color: "#3BF498", rest: { left: -145.6, top: -111.2, width: 690.7, height: 146.6, rotate: 177 }, hover: rot(407.4, 58.9, 404.9, 85.9, -177), opacity: 1 },
  { color: "#D900FF", rest: { left: -201.1, top: -172.9, width: 830.7, height: 176.3, rotate: -177.8 }, hover: rot(452.8, 60.1, 486.9, 103.3, 177.8), opacity: 0.8 },
  { color: "#2F5BFF", rest: { left: -148, top: 33, width: 711, height: 148, rotate: 0 }, hover: { left: -1, top: 68, width: 417, height: 87, rotate: 0 }, opacity: 1 },
]
const SERVICES = [
  { Icon: Cloud, rest: { left: 19, top: 62, scale: 1 }, hover: { left: 11.3, top: 104, scale: 0.8 } },
  { Icon: Server, rest: { left: 254, top: 20, scale: 1 }, hover: { left: 255.3, top: 124, scale: 1 } },
  { Icon: Link2, rest: { left: 309, top: 145, scale: 1 }, hover: { left: 323.7, top: 104, scale: 0.8 } },
  { Icon: KeyRound, rest: { left: 80, top: 189, scale: 1 }, hover: { left: 79.8, top: 124, scale: 1 } },
]

function HostingMedia() {
  return (
    <>
      {RINGS.map((r) => (
        <motion.span
          key={r.color}
          variants={{ rest: { ...r.rest, opacity: 0 }, hover: { ...r.hover, opacity: r.opacity } }}
          transition={SPRING}
          className="absolute rounded-[50%] border"
          style={{ borderColor: r.color }}
        />
      ))}
      <motion.div
        variants={{ rest: { opacity: 1 }, hover: { opacity: 0.5 } }}
        transition={SPRING}
        className="absolute top-[39.2px] left-[45.2px] flex h-[200.9px] w-[309.6px] flex-col gap-1.5 rounded-[17px] bg-neutral-700 p-[5.76px]"
      >
        <div className="flex h-[26.5px] items-center justify-between gap-2 px-1">
          <div className="flex w-[54.7px] gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-[8.6px] rounded-full bg-neutral-800" />
            ))}
          </div>
          <div className="flex h-[26.5px] w-[177px] items-center gap-1.5 rounded-full bg-neutral-800 px-[17px]">
            <Lock className="size-[11.5px] text-neutral-300" />
            <span className="truncate text-[10px] leading-3 text-neutral-300">yourbusiness.get.space</span>
          </div>
          <div className="flex gap-1">
            <span className="size-[25.9px] rounded-full bg-neutral-800" />
            <span className="grid size-[25.9px] place-items-center rounded-full bg-neutral-800 text-neutral-400">
              <Ellipsis className="size-3" />
            </span>
          </div>
        </div>
        <div className="grid flex-1 place-items-center rounded-[14px] bg-neutral-800 text-neutral-600">
          <Globe className="size-[92px]" strokeWidth={1} />
        </div>
      </motion.div>
      {SERVICES.map(({ Icon, rest, hover }, i) => (
        <motion.span
          key={i}
          variants={{
            rest: { ...rest, backgroundColor: "#48443E", color: "#A8A39A" },
            hover: { ...hover, backgroundColor: "#FFFFFF", color: "#1E1C19" },
          }}
          transition={SPRING}
          className="absolute grid size-16 place-items-center rounded-full"
        >
          <Icon className="size-8" strokeWidth={1.75} />
        </motion.span>
      ))}
      <motion.span
        variants={{ rest: { top: 340 }, hover: { top: 121 } }}
        transition={SPRING}
        className="absolute left-[166px] grid size-[84px] place-items-center rounded-full bg-white text-blue-500 shadow-[0_0_0_8px_rgba(47,91,255,0.25)]"
      >
        <Globe className="size-11" strokeWidth={1.75} />
      </motion.span>
    </>
  )
}

/* ---------------- 5. Choose your style ---------------- */

const STYLES = [
  {
    name: "editorial",
    font: "font-(family-name:--font-dm-serif) text-[24px] leading-7",
    body: "font-(family-name:--font-dm-sans)",
    swatches: ["#FFFFFF", "#FFE0D9", "#E4E1DA", "#1E1C19", "#F2553A"],
    secondary: "rounded-none",
    primary: "rounded-none bg-neutral-900 text-white",
    rest: { left: 45.05, top: 18.95, scale: 0.9025, opacity: 0.3 },
    hover: { left: -276, top: 36.1, scale: 1, opacity: 1 },
  },
  {
    name: "friendly",
    font: "font-(family-name:--font-league-gothic) text-[30px] leading-8 uppercase",
    body: "font-(family-name:--font-inter)",
    swatches: ["#FFFFFF", "#FFF2C7", "#E4E1DA", "#057647", "#FFD24D"],
    secondary: "rounded-full",
    primary: "rounded-full bg-green-700 text-yellow-100",
    rest: { left: 44.95, top: 31, scale: 0.95, opacity: 0.5 },
    hover: { left: 366, top: 36.1, scale: 1, opacity: 1 },
  },
  {
    name: "baseplate",
    font: "font-heading text-[24px] leading-7 font-semibold",
    body: "font-sans",
    swatches: ["#FFFFFF", "#DCE6FF", "#E4E1DA", "#2F5BFF", "#FFC21F"],
    secondary: "rounded-md",
    primary: "rounded-md bg-blue-500 text-white",
    rest: { left: 45, top: 44.9, scale: 1, opacity: 1 },
    hover: { left: 45, top: 36, scale: 1, opacity: 1 },
  },
]

function StyleMedia() {
  return (
    <div className={cn(demoFontVars, "contents")}>
      {STYLES.map((s) => (
        <motion.div
          key={s.name}
          variants={{ rest: s.rest, hover: s.hover }}
          transition={SPRING}
          style={{ originY: 0 }}
          className="absolute flex h-[208px] w-[309px] flex-col gap-3 rounded-lg bg-neutral-50 px-5 py-4"
        >
          <div className="flex flex-col">
            <p className={cn("text-neutral-900", s.font)}>Heading</p>
            <p className={cn("text-sm text-neutral-600", s.body)}>Paragraph text</p>
          </div>
          <div className="flex h-10 overflow-hidden rounded-[6px] border border-neutral-200">
            {s.swatches.map((c) => (
              <span key={c} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className={cn("flex gap-2 text-sm font-medium", s.body)}>
            <span className={cn("grid h-9 flex-1 place-items-center border border-neutral-300 bg-white text-neutral-900", s.secondary)}>
              Button
            </span>
            <span className={cn("grid h-9 flex-1 place-items-center", s.primary)}>Button</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ---------------- 6. Domains ---------------- */

const TLDS = ["tech", "design", "ai", "com", "get.space", "site", "dev", "tech", "design"]
const ROW = 48

function DomainMedia() {
  const tone = (i: number, center: number, highlight: string) => ({
    color: i === center ? highlight : "#7F7A71",
    opacity: Math.max(0.12, 1 - Math.abs(i - center) * 0.3),
  })
  return (
    <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]">
      <div className="relative flex font-heading text-[40px] leading-[48px] font-semibold tracking-tight" style={{ height: TLDS.length * ROW }}>
        <span className="self-center text-neutral-50">business.</span>
        <motion.div variants={{ rest: { y: 0 }, hover: { y: ROW } }} transition={SPRING} className="flex w-[180px] flex-col">
          {TLDS.map((t, i) => (
            <motion.span
              key={i}
              variants={{ rest: tone(i, 4, "#FFD24D"), hover: tone(i, 3, "#8EABFF") }}
              transition={SPRING}
              className="block h-12"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

/* ---------------- section ---------------- */

export function Features() {
  return (
    <section
      id="features"
      aria-label="Features"
      className="relative z-20 -mt-[100svh] flex w-full max-w-[1400px] flex-col items-center justify-center overflow-clip rounded-[32px] bg-neutral-900 px-4 py-12 min-[810px]:rounded-[40px] min-[810px]:px-8 min-[810px]:py-16 min-[1440px]:min-h-[1080px] min-[1440px]:rounded-[48px] min-[1440px]:px-[100px] min-[1440px]:py-24"
    >
      <div className="grid w-full grid-cols-1 gap-px overflow-clip rounded-xl border border-neutral-700 bg-neutral-700 min-[810px]:grid-cols-2 min-[1100px]:grid-cols-3">
        <FeatureCard
          mediaFirst
          media={null}
          backdrop={<AllSetUpGlows />}
          body={
            <>
              <p className="type-label-sm text-yellow-300">ALL SET UP</p>
              <h3 className="mb-2 type-h2 whitespace-pre-line text-neutral-50">{"Type.\nRefine.\nPublish."}</h3>
            </>
          }
          desc="You focus on managing businesses and serving clients in the best way possible."
        />
        <FeatureCard
          title="Plan how your space is built"
          desc="The agent will help you outline the brief for your business website. All you need to do is review and confirm."
          media={<PlanMedia />}
        />
        <FeatureCard
          title="Edit at your fingertips"
          desc="Want to change text, images, or layout? Edit them directly on the platform with no coding required."
          media={<EditMedia />}
        />
        <FeatureCard
          title="Hosting? Server? Handled"
          desc="You don’t need to know all those terms. All you need to know is that your website is published."
          media={<HostingMedia />}
        />
        <FeatureCard
          title="Choose how your space looks"
          desc="Our agent will create multiple design system options for you to choose from in advance."
          media={<StyleMedia />}
        />
        <FeatureCard
          title="Oversee your domains"
          desc="There’s no need to switch platforms to buy and manage your domain."
          media={<DomainMedia />}
        />
      </div>
    </section>
  )
}
