"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Mail } from "lucide-react"
import { cn } from "@gogetspace/baseplate/cn"
import type { Showcase } from "@/lib/playbooks/module-showcase"

/**
 * Appointments (and Consultations) "For you": a low-fidelity loop of the real Ariyes Appointments screen, in
 * skeleton, with only what the story needs drawn in full. The loop:
 *   1. someone books on the website (a dashed "waiting" block and a toast)
 *   2. the owner opens it and confirms (a confirmation email goes out)
 *   3. the owner drags another booking to a new time (the client is told)
 *   4. a reminder goes out on its own
 * Layout mirrors Ariyes: top bar, app rail, week calendar with available / booked / unavailable time, settings
 * column. Reduced motion shows the final frame with all four steps listed.
 */

/** the loop's frames: [duration ms, step shown in the caption (0-3)] */
const FRAMES: [number, number][] = [
  [1400, 0], // 0 calendar at rest
  [1800, 0], // 1 new booking arrives
  [900, 1], // 2 cursor to it
  [1300, 1], // 3 details open, cursor to Confirm
  [1500, 1], // 4 confirmed
  [900, 2], // 5 cursor to the booking to move
  [1300, 2], // 6 dragging
  [1500, 2], // 7 dropped, client told
  [2200, 3], // 8 reminder sent
]

// the grid: Mon–Fri, 9am–5pm. Positions are percentages of the grid, so the window can be any width.
const COL = 20
const ROW = 100 / 8
const at = (day: number, hour: number) => ({ left: `${day * COL}%`, top: `${(hour - 9) * ROW}%` })

function usePhase(still: boolean) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (still) return
    const t = setTimeout(() => setF((x) => (x + 1) % FRAMES.length), FRAMES[f][0])
    return () => clearTimeout(t)
  }, [f, still])
  return still ? FRAMES.length - 1 : f
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    // reading the viewer's setting only works in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduce(m.matches)
    const on = () => setReduce(m.matches)
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [])
  return reduce
}

const Bar = ({ w, className }: { w: string; className?: string }) => <span className={cn("block h-1.5 rounded-full bg-neutral-200", className)} style={{ width: w }} />

/** a booking block; skeleton unless it has text */
function Block({ day, hour, h = 1, tone = "booked", name, what, className, style }: { day: number; hour: number; h?: number; tone?: "booked" | "pending" | "ghost"; name?: string; what?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "absolute flex flex-col justify-center gap-0.5 overflow-hidden rounded-[5px] border px-1.5",
        tone === "booked" && "border-blue-200 bg-blue-50",
        tone === "pending" && "border-dashed border-blue-400 bg-white",
        tone === "ghost" && "border-blue-500 bg-blue-50/70 shadow-md",
        className,
      )}
      style={{ ...at(day, hour), width: `calc(${COL}% - 4px)`, marginLeft: 2, height: `calc(${h * ROW}% - 3px)`, marginTop: 1, ...style }}
    >
      {name ? (
        <>
          <span className="truncate text-[9px] leading-tight font-semibold text-neutral-900">{name}</span>
          {what && h >= 1 && <span className="truncate text-[8px] leading-tight text-neutral-500">{what}</span>}
        </>
      ) : (
        <>
          <Bar w="70%" className="bg-blue-200" />
          {h >= 1 && <Bar w="45%" className="bg-blue-100" />}
        </>
      )}
    </div>
  )
}

function Cursor({ x, y, down }: { x: string; y: string; down: boolean }) {
  return (
    <svg
      viewBox="0 0 16 20"
      className="pointer-events-none absolute z-30 h-4 w-3.5 drop-shadow transition-[left,top,scale] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
      style={{ left: x, top: y, scale: down ? 0.85 : 1 }}
    >
      <path d="M1 1l13 10.5-6 .7 3.6 6.4-2.4 1.3-3.6-6.5L1 17z" fill="#111" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

export function BookingOwnerPreview({ sc, who = "patients" }: { sc: Showcase; who?: string }) {
  const reduce = useReducedMotion()
  const f = usePhase(reduce)
  const rows = sc.labels.rows
  const split = (r: string[] | undefined) => ({ name: r?.[0] ?? "", what: r?.[1]?.split(" · ")[1] ?? "" })
  const keep = split(rows[0])
  const mover = split(rows[1])
  const fresh = split(rows[2])
  const remind = split(rows[3])
  const step = FRAMES[f][1]

  // the new booking: Wed 2:30; the one that moves: Tue 11 → Thu 3; the reminder: Thu 10
  const arrived = f >= 1
  const confirmed = f >= 4
  const moved = f >= 7
  const dragging = f === 6
  const cursor =
    f <= 1 ? { x: "72%", y: "96%" } : f === 2 ? { x: "52%", y: "72%" } : f === 3 ? { x: "70%", y: "57%" } : f === 4 ? { x: "70%", y: "57%" } : f === 5 ? { x: "32%", y: "30%" } : f === 6 ? { x: "72%", y: "80%" } : { x: "84%", y: "92%" }
  const toast = f === 1 ? { icon: <Bell className="size-3" />, text: `New booking · ${fresh.name}` } : f === 4 ? { icon: <Mail className="size-3" />, text: "Confirmed · email sent" } : f === 7 ? { icon: <Mail className="size-3" />, text: `Moved · ${mover.name.split(" ")[0]} is told` } : f === 8 ? { icon: <Bell className="size-3" />, text: `Reminder sent to ${remind.name.split(" ")[0]}` } : null
  const cap = who.charAt(0).toUpperCase() + who.slice(1)
  const STEPS = [`${cap} book on your website`, "You confirm in one tap", "Drag to move it; they're told", "Reminders go out on their own"]

  return (
    <div aria-hidden className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
      <div className="flex h-[340px] flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-xl">
        {/* Ariyes top bar */}
        <div className="flex h-7 shrink-0 items-center gap-2 border-b border-neutral-200 px-2.5">
          <span className="text-[9px] font-bold tracking-tight text-neutral-800">ariyes</span>
          <span className="size-3 rounded bg-blue-500" />
          <Bar w="56px" />
          <span className="ml-auto size-4 rounded-full bg-neutral-200" />
        </div>
        <div className="flex min-h-0 flex-1">
          {/* app rail: Home, divider, apps (Appointments active), Settings */}
          <div className="flex w-8 shrink-0 flex-col items-center gap-1.5 border-r border-neutral-200 py-2">
            <span className="size-4 rounded bg-neutral-200" />
            <span className="h-px w-3 bg-neutral-200" />
            <span className="size-4 rounded bg-blue-100 ring-1 ring-blue-300" />
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-4 rounded bg-neutral-100" />
            ))}
            <span className="mt-auto size-4 rounded bg-neutral-100" />
          </div>

          {/* main: header, summary, week grid */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-neutral-200 px-2.5">
              <span className="text-[10px] font-semibold text-neutral-900">Appointments</span>
              <span className="ml-auto h-3.5 w-7 rounded border border-neutral-200" />
              <span className="h-3.5 w-3.5 rounded border border-neutral-200" />
              <span className="h-3.5 w-3.5 rounded border border-neutral-200" />
              <Bar w="40px" />
            </div>
            <div className="flex h-5 shrink-0 items-center gap-2 border-b border-neutral-200 px-2.5">
              <span className="text-[8px] text-neutral-500 tabular-nums">
                <b className="font-semibold text-neutral-800">{arrived ? 9 : 8} booked</b>
                {arrived && !confirmed && " · 1 waiting"}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[7px] text-neutral-500">
                <span className="size-1.5 rounded-sm border border-neutral-300" /> Available
                <span className="size-1.5 rounded-sm bg-blue-200" /> Booked
                <span className="size-1.5 rounded-sm bg-neutral-300" /> Unavailable
              </span>
            </div>
            {/* day headers */}
            <div className="flex shrink-0 border-b border-neutral-200">
              <span className="w-5 shrink-0" />
              {["M", "T", "W", "T", "F"].map((d, i) => (
                <span key={i} className={cn("flex-1 border-l border-neutral-100 py-0.5 text-center text-[8px] font-semibold", i === 2 ? "text-blue-600" : "text-neutral-400")}>
                  {d}
                </span>
              ))}
            </div>
            <div className="flex min-h-0 flex-1">
              <div className="flex w-5 shrink-0 flex-col">
                {[9, 10, 11, 12, 1, 2, 3, 4].map((h) => (
                  <span key={h} className="flex-1 pr-0.5 text-right text-[6px] leading-none text-neutral-400">
                    {h}
                  </span>
                ))}
              </div>
              <div className="relative min-w-0 flex-1 bg-[linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[100%_12.5%]">
                {/* day columns */}
                <div className="absolute inset-0 flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="flex-1 border-l border-neutral-100" />
                  ))}
                </div>
                {/* lunch: unavailable */}
                <div className="absolute inset-x-0 bg-[repeating-linear-gradient(-45deg,transparent_0_4px,#e5e5e5_4px_5px)] bg-neutral-50" style={{ top: `${4 * ROW}%`, height: `${ROW}%` }} />

                {/* everyday bookings, in skeleton */}
                <Block day={0} hour={9} />
                <Block day={0} hour={10.5} h={1.5} />
                <Block day={0} hour={15} />
                <Block day={1} hour={9.5} name={keep.name} what={keep.what} />
                <Block day={2} hour={10} h={1.5} />
                <Block day={4} hour={9} h={1.5} />
                <Block day={4} hour={14} />
                <Block day={3} hour={10} name={remind.name} what={remind.what} className={cn("transition-[box-shadow] duration-300", f === 8 && "ring-2 ring-yellow-400")} />
                {f === 8 && (
                  <span className="absolute z-20 flex items-center gap-0.5 rounded-full bg-yellow-100 px-1 py-px text-[7px] font-semibold text-yellow-900 transition-opacity duration-300 starting:opacity-0" style={{ left: `${3 * COL + 1}%`, top: `${1 * ROW - 6}%` }}>
                    <Bell className="size-2" /> Reminder
                  </span>
                )}

                {/* the one that moves: Tue 11 → Thu 3 */}
                <Block
                  day={moved ? 3 : 1}
                  hour={moved ? 15 : 11}
                  name={mover.name}
                  what={mover.what}
                  className={cn("transition-opacity duration-200", dragging && "opacity-30")}
                />
                {dragging && <Block day={3} hour={15} tone="ghost" name={mover.name} what={mover.what} className="z-20 transition-[opacity,translate] duration-300 starting:-translate-x-[40%] starting:-translate-y-[60%] starting:opacity-0" />}

                {/* the new booking: waiting (dashed), then confirmed */}
                {arrived && (
                  <Block
                    day={2}
                    hour={14.5}
                    tone={confirmed ? "booked" : "pending"}
                    name={fresh.name}
                    what={fresh.what}
                    className={cn("z-10 transition-[opacity,scale,background-color,border-color] duration-300 ease-out starting:scale-90 starting:opacity-0", f === 2 && "ring-2 ring-blue-300")}
                  />
                )}

                {/* the booking's details, with Confirm */}
                {f === 3 && (
                  <div className="absolute z-20 flex w-[46%] flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg transition-[opacity,scale] duration-200 ease-out starting:scale-95 starting:opacity-0" style={{ left: "44%", top: "33%" }}>
                    <span className="text-[9px] font-semibold text-neutral-900">{fresh.name}</span>
                    <span className="text-[8px] text-neutral-500">Wed · 2:30pm · {fresh.what}</span>
                    <span className="rounded bg-yellow-50 px-1 py-0.5 text-[7px] text-yellow-900">Waiting for you to confirm</span>
                    <span className="mt-0.5 flex gap-1">
                      <span className="h-4 flex-1 rounded border border-neutral-200" />
                      <span className="flex h-4 flex-1 items-center justify-center gap-0.5 rounded bg-blue-500 text-[8px] font-semibold text-white">
                        <Check className="size-2.5" /> Confirm
                      </span>
                    </span>
                  </div>
                )}

                {!reduce && <Cursor x={cursor.x} y={cursor.y} down={f === 4 || f === 6} />}

                {/* toast */}
                {toast && (
                  <span key={f} className="absolute bottom-1.5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900 px-2 py-1 text-[8px] whitespace-nowrap text-white shadow-lg transition-[opacity,translate] duration-300 ease-out starting:translate-y-1 starting:opacity-0">
                    {toast.icon} {toast.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* settings column, in skeleton */}
          <div className="flex w-[68px] shrink-0 flex-col border-l border-neutral-200 max-sm:hidden">
            {["Availability", "Booking types", "Reminders", "Rules"].map((s, i) => (
              <div key={s} className={cn("flex flex-col gap-1 border-b border-neutral-100 px-2 py-2", i === 2 && f === 8 && "bg-yellow-50")}>
                <span className="text-[7px] font-semibold text-neutral-600">{s}</span>
                <Bar w="80%" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* the steps, the current one lit */}
      <ol className="grid grid-cols-2 gap-x-3 gap-y-1">
        {STEPS.map((t, i) => (
          <li key={t} className={cn("flex items-center gap-1.5 text-[11px] leading-snug transition-colors duration-300", reduce || step === i ? "text-neutral-900" : "text-neutral-400")}>
            <span className={cn("grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-semibold transition-colors duration-300", reduce || step === i ? "bg-blue-500 text-white" : "bg-neutral-200 text-neutral-500")}>{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
    </div>
  )
}
