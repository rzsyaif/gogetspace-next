"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import { motion, useInView, useReducedMotion, type Transition, type Variants } from "motion/react"
import {
  CalendarCheck,
  Check,
  Cloud,
  CreditCard,
  Ellipsis,
  FileText,
  Globe,
  Inbox,
  KeyRound,
  Link2,
  Lock,
  MapPin,
  MousePointer2,
  PencilLine,
  RefreshCw,
  Server,
  Star,
  Upload,
  type LucideIcon,
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
  fit,
  className,
}: {
  title?: string
  desc: string
  media: ReactNode
  mediaFirst?: boolean
  body?: ReactNode
  /** decoration behind the whole card */
  backdrop?: ReactNode
  /** shrink the 400px stage on narrow phones, for art that has to be seen whole */
  fit?: boolean
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
        <div className={cn("absolute inset-y-0 left-1/2 w-[400px] -translate-x-1/2", fit && "max-[440px]:origin-top max-[440px]:scale-[0.8]")}>{media}</div>
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
    <div className="flex w-max flex-col gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-soft-md">
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
    <div className="contents">
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

      <motion.div variants={{ rest: { left: -288, top: 132 }, hover: { left: 8, top: 132 } }} transition={SPRING} className="absolute">
        <EditMenu
          title="Text"
          items={[
            { label: "Edit text", Icon: PencilLine },
            { label: "Regenerate text", Icon: RefreshCw },
          ]}
        />
      </motion.div>
      {/* both menus sit inside the 400px stage, so neither is cut off at the card's edge */}
      <motion.div variants={{ rest: { left: 201, top: 335 }, hover: { left: 201, top: 165 } }} transition={SPRING} className="absolute">
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

/** soft brand-colour glows circling the window on a flattened orbit, so they pass behind it and round the icons */
const ORBIT_GLOWS = [
  { color: "#2F5BFF", size: 150, angle: 0 },
  { color: "#3BF498", size: 120, angle: 120 },
  { color: "#FFC21F", size: 110, angle: 240 },
]
const ORBIT_R = 170

function OrbitGlows() {
  return (
    <motion.div
      variants={{ rest: { opacity: 0, scale: 0.6 }, hover: { opacity: 1, scale: 1 } }}
      transition={SPRING}
      className="pointer-events-none absolute top-[140px] left-[200px] size-0"
    >
      {/* flatten the circle into an ellipse, then spin inside it */}
      <div className="scale-y-[0.55]">
        <div className="animate-[spin_7s_linear_infinite] motion-reduce:animate-none">
          {ORBIT_GLOWS.map((g) => {
            const r = (g.angle * Math.PI) / 180
            return (
              <span
                key={g.color}
                className="absolute rounded-full blur-[34px]"
                style={{
                  width: g.size,
                  height: g.size,
                  left: Math.cos(r) * ORBIT_R - g.size / 2,
                  top: Math.sin(r) * ORBIT_R - g.size / 2,
                  backgroundColor: g.color,
                  opacity: 0.9,
                }}
              />
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

const SERVICES = [
  { Icon: Cloud, rest: { left: 19, top: 62, scale: 1 }, hover: { left: 11.3, top: 104, scale: 0.8 } },
  { Icon: Server, rest: { left: 254, top: 20, scale: 1 }, hover: { left: 255.3, top: 124, scale: 1 } },
  { Icon: Link2, rest: { left: 309, top: 145, scale: 1 }, hover: { left: 323.7, top: 104, scale: 0.8 } },
  { Icon: KeyRound, rest: { left: 80, top: 189, scale: 1 }, hover: { left: 79.8, top: 124, scale: 1 } },
]

function HostingMedia() {
  return (
    <>
      <OrbitGlows />
      <motion.div
        variants={{ rest: { opacity: 1 }, hover: { opacity: 0.85 } }}
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
            rest: { ...rest, backgroundColor: "#48443E", color: "#A8A39A", boxShadow: "0 0 0px 0px rgba(255,255,255,0)" },
            hover: { ...hover, backgroundColor: "#FFFFFF", color: "#1E1C19", boxShadow: "0 0 28px 2px rgba(255,255,255,0.35)" },
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

/* ---------------- 5. Plug-in modules ---------------- */

/** the baseplate: 8 studs wide, sitting at the bottom of the stage */
const PLATE = { left: 28, top: 250, width: 344, height: 18 }
const PITCH = PLATE.width / 8
const BRICK = { width: PITCH * 2 - 2, height: 54 }
/** where a brick sits once clicked on: `col` in studs from the plate's left edge, `row` 0 = on the plate */
const seat = (col: number, row: number) => ({ left: PLATE.left + col * PITCH + 1, top: PLATE.top - BRICK.height * (row + 1), rotate: 0 })

const MODULES: { Icon: LucideIcon; label: string; color: string; ink: string; lip: string; rest: { left: number; top: number; rotate: number }; seat: ReturnType<typeof seat> }[] = [
  { Icon: CalendarCheck, label: "Booking", color: "#2F5BFF", ink: "#FFFFFF", lip: "#172E8C", rest: { left: -18, top: 26, rotate: -14 }, seat: seat(0, 0) },
  { Icon: CreditCard, label: "Payments", color: "#FFC21F", ink: "#3E2302", lip: "#A86600", rest: { left: 158, top: -8, rotate: 9 }, seat: seat(2, 0) },
  { Icon: Inbox, label: "Enquiries", color: "#12B76A", ink: "#032B1B", lip: "#057647", rest: { left: 318, top: 34, rotate: 16 }, seat: seat(4, 0) },
  { Icon: FileText, label: "Estimates", color: "#F2553A", ink: "#FFFFFF", lip: "#B0311C", rest: { left: 22, top: 150, rotate: 8 }, seat: seat(6, 0) },
  { Icon: Star, label: "Reviews", color: "#FFC1B3", ink: "#3D110A", lip: "#D63F25", rest: { left: 296, top: 160, rotate: -11 }, seat: seat(1, 1) },
  { Icon: MapPin, label: "Locations", color: "#8EABFF", ink: "#0C173D", lip: "#1F45E0", rest: { left: 166, top: 92, rotate: -5 }, seat: seat(5, 1) },
  // the website itself sits in the middle: everything plugs into one place
  { Icon: Globe, label: "Your website", color: "#FFFFFF", ink: "#1E1C19", lip: "#A8A39A", rest: { left: 150, top: 172, rotate: 7 }, seat: seat(3, 1) },
]

/** the stud on top of a brick or the plate, in the same colour with a lighter cap */
function Stud({ color, left, top, w = 18 }: { color: string; left: number; top: number; w?: number }) {
  return <span className="absolute h-[7px] rounded-t-[4px]" style={{ left, top, width: w, backgroundColor: color, boxShadow: "inset 0 2px 0 rgba(255,255,255,0.25)" }} />
}

function ModulesMedia() {
  return (
    <>
      {/* baseplate */}
      <motion.div
        variants={{ rest: { opacity: 0.55, y: 6 }, hover: { opacity: 1, y: 0 } }}
        transition={SPRING}
        className="absolute rounded-[4px]"
        style={{ ...PLATE, backgroundColor: "#605B53", boxShadow: "0 5px 0 #302D29" }}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <Stud key={i} color="#605B53" left={i * (PITCH / 2) + (PITCH / 2 - 14) / 2} top={-7} w={14} />
        ))}
      </motion.div>

      {/* bricks: floating, then clicked onto the plate (bottom row first, then the second layer) */}
      {MODULES.map(({ Icon, label, color, ink, lip, rest, seat: to }, i) => (
        <motion.div
          key={label}
          variants={{
            rest: { ...rest, scale: 1.04, boxShadow: `inset 0 -5px 0 ${lip}, 0 22px 24px rgba(0,0,0,0.45)`, transition: SPRING },
            hover: {
              ...to,
              scale: 1,
              boxShadow: `inset 0 -5px 0 ${lip}, 0 2px 0 rgba(0,0,0,0.35)`,
              transition: { type: "spring", stiffness: 420, damping: 26, mass: 0.9, delay: Math.round((PLATE.top - to.top) / BRICK.height - 1) * 0.2 + (i % 4) * 0.05 },
            },
          }}
          className="absolute flex flex-col items-center justify-center gap-0.5 rounded-[5px] pb-1"
          style={{ ...BRICK, backgroundColor: color, color: ink }}
        >
          <Stud color={color} left={(PITCH - 18) / 2} top={-7} />
          <Stud color={color} left={PITCH + (PITCH - 18) / 2} top={-7} />
          <Icon className="size-5" strokeWidth={2} />
          <span className="text-[10px] leading-3 font-semibold">{label}</span>
        </motion.div>
      ))}
    </>
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
  // the sample sites' typefaces load only once the grid is close; until then nothing on the page uses them
  const ref = useRef<HTMLElement>(null)
  const near = useInView(ref, { margin: "800px 0px", once: true })
  return (
    <section
      ref={ref}
      id="features"
      aria-label="Features"
      className="relative z-20 -mt-[100svh] flex w-full max-w-[1400px] flex-col items-center justify-center overflow-clip rounded-[32px] bg-neutral-900 px-4 py-12 min-[810px]:rounded-[40px] min-[810px]:px-8 min-[810px]:py-16 min-[1440px]:min-h-[1080px] min-[1440px]:rounded-[48px] min-[1440px]:px-[100px] min-[1440px]:py-24"
    >
      <div id="features-grid" className={cn(near && demoFontVars, "grid w-full grid-cols-1 gap-px overflow-clip rounded-xl border border-neutral-700 bg-neutral-700 min-[810px]:grid-cols-2 min-[1100px]:grid-cols-3")}>
        <FeatureCard
          mediaFirst
          media={null}
          backdrop={<AllSetUpGlows />}
          body={
            <>
              <h3 className="mb-2 type-h2 whitespace-pre-line text-neutral-50">{"Type.\nRefine.\nPublish."}</h3>
            </>
          }
          desc="You run your practice. We build the website, host it and keep it running."
        />
        <FeatureCard
          title="Built from your words"
          desc="The agent plans your pages and builds a first version straight away. Check the brief whenever you like."
          media={<PlanMedia />}
        />
        <FeatureCard
          title="Edit at your fingertips"
          desc="Want to change text, images, or layout? Edit them directly on the platform with no coding required."
          media={<EditMedia />}
          fit
        />
        <FeatureCard
          title="Hosting? Server? Handled"
          desc="You don’t need to know all those terms. All you need to know is that your website is published."
          media={<HostingMedia />}
        />
        <FeatureCard
          title="Plug in what you need"
          desc="Bookings, payments, enquiries and more, all in one place. Snap a module on and it works. No plugins to hunt for."
          media={<ModulesMedia />}
          fit
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
