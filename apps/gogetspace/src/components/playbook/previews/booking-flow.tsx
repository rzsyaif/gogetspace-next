"use client"

import { useEffect, useState } from "react"
import { Bell, CalendarCheck, CalendarClock, Check, Mail } from "lucide-react"
import { cn } from "@gogetspace/baseplate/cn"
import type { Showcase } from "@/lib/playbooks/module-showcase"

/**
 * Appointments (and Consultations), both sides in one low-fidelity loop: a patient's phone on the website, and the
 * owner's Ariyes Appointments screen in skeleton (only what the story needs is drawn in full). One booking, start
 * to finish:
 *   1. the patient picks a time on the website and books; it lands in Ariyes as "waiting"
 *   2. the owner confirms in one tap; the patient gets the confirmation
 *   3. the owner drags it to another time; the patient is told
 *   4. a reminder goes out on its own
 * Reduced motion shows the last frame with every step listed.
 */

/** the loop's frames: [duration ms, step lit in the caption (0-3)] */
const FRAMES: [number, number][] = [
  [1300, 0], // 0 at rest: the website's free times
  [900, 0], // 1 the patient taps a time
  [1700, 0], // 2 books: phone says sent; Ariyes gets it, waiting
  [900, 1], // 3 owner's cursor to it
  [1300, 1], // 4 details open, cursor on Confirm
  [1800, 1], // 5 confirmed: phone gets the confirmation
  [900, 2], // 6 cursor back to the booking
  [1300, 2], // 7 dragging it to Thursday 3pm
  [1800, 2], // 8 dropped: phone is told
  [2300, 3], // 9 reminder goes out
]

// the calendar: Mon–Fri, 9am–5pm, in percentages of the grid so the window can be any width
const COL = 20
const ROW = 100 / 8
const at = (day: number, hour: number) => ({ left: `${day * COL}%`, top: `${(hour - 9) * ROW}%` })

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    // the viewer's setting only exists in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduce(m.matches)
    const on = () => setReduce(m.matches)
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [])
  return reduce
}

function useFrame(still: boolean) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (still) return
    const t = setTimeout(() => setF((x) => (x + 1) % FRAMES.length), FRAMES[f][0])
    return () => clearTimeout(t)
  }, [f, still])
  return still ? FRAMES.length - 1 : f
}

const Bar = ({ w, className }: { w: string; className?: string }) => <span className={cn("block h-1.5 shrink-0 rounded-full bg-neutral-200", className)} style={{ width: w }} />

function Block({ day, hour, h = 1, tone = "booked", name, what, className }: { day: number; hour: number; h?: number; tone?: "booked" | "pending" | "ghost"; name?: string; what?: string; className?: string }) {
  return (
    <div
      className={cn(
        "absolute flex flex-col justify-center gap-0.5 overflow-hidden rounded-[5px] border px-1.5",
        tone === "booked" && "border-blue-200 bg-blue-50",
        tone === "pending" && "border-dashed border-blue-400 bg-white",
        tone === "ghost" && "border-blue-500 bg-blue-50/80 shadow-md",
        className,
      )}
      style={{ ...at(day, hour), width: `calc(${COL}% - 4px)`, marginLeft: 2, height: `calc(${h * ROW}% - 3px)`, marginTop: 1 }}
    >
      {name ? (
        <>
          <span className="truncate text-[9px] leading-tight font-semibold text-neutral-900">{name}</span>
          {what && <span className="truncate text-[8px] leading-tight text-neutral-500">{what}</span>}
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
    <svg viewBox="0 0 16 20" className="pointer-events-none absolute z-30 h-4 w-3.5 drop-shadow transition-[left,top,scale] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]" style={{ left: x, top: y, scale: down ? 0.85 : 1 }}>
      <path d="M1 1l13 10.5-6 .7 3.6 6.4-2.4 1.3-3.6-6.5L1 17z" fill="#111" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

/** a notification sliding down over the phone's screen */
function Banner({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="absolute inset-x-1.5 top-1.5 z-20 flex items-start gap-1.5 rounded-xl bg-white/95 p-1.5 shadow-lg ring-1 ring-black/5 transition-[opacity,translate] duration-300 ease-out starting:-translate-y-3 starting:opacity-0">
      <span className="grid size-4 shrink-0 place-items-center rounded-md bg-blue-500 text-white">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[7.5px] font-semibold text-neutral-900">{title}</span>
        <span className="text-[7px] leading-tight text-neutral-600">{text}</span>
      </span>
    </div>
  )
}

export function BookingFlowPreview({ sc, who = "patients" }: { sc: Showcase; who?: string }) {
  const reduce = useReducedMotion()
  const f = useFrame(reduce)
  const l = sc.labels
  const split = (r: string[] | undefined) => ({ name: r?.[0] ?? "", what: r?.[1]?.split(" · ")[1] ?? "" })
  const keep = split(l.rows[0])
  const other = split(l.rows[1])
  const me = split(l.rows[2])
  const step = FRAMES[f][1]
  const first = me.name.split(" ")[0]
  // the slot the patient picks, as the website shows it ("Wed 2:30")
  const slot = l.items[2] ?? "Wed 2:30"

  const booked = f >= 2
  const confirmed = f >= 5
  const moved = f >= 8
  const dragging = f === 7
  const cursor =
    f <= 2 ? { x: "62%", y: "96%" } : f === 3 ? { x: "50%", y: "74%" } : f <= 5 ? { x: "56%", y: "57%" } : f === 6 ? { x: "50%", y: "74%" } : f === 7 ? { x: "70%", y: "80%" } : { x: "80%", y: "94%" }
  const toast = f === 2 ? { icon: <Bell className="size-3" />, text: `New booking · ${me.name}` } : f === 5 ? { icon: <Mail className="size-3" />, text: "Confirmed · email sent" } : f === 8 ? { icon: <Mail className="size-3" />, text: `Moved · ${first} is told` } : f === 9 ? { icon: <Bell className="size-3" />, text: `Reminder sent to ${first}` } : null
  const banner =
    f === 5
      ? { icon: <Check className="size-2.5" />, title: "Booking confirmed", text: `${slot.replace(" ", " at ")}pm · ${l.siteNote?.split(" · ")[0] ?? me.what}` }
      : f === 8
        ? { icon: <CalendarClock className="size-2.5" />, title: "Your visit moved", text: "Now Thu at 3:00pm. Reply if that doesn't suit you." }
        : f === 9
          ? { icon: <Bell className="size-2.5" />, title: "Reminder", text: "See you tomorrow at 3:00pm" }
          : null
  const cap = who.charAt(0).toUpperCase() + who.slice(1)
  const STEPS = [`${cap} book on your website`, "You confirm; they get an email", "Drag to move it; they're told", "Reminders go out on their own"]

  return (
    <div aria-hidden className="mx-auto flex w-full max-w-[440px] flex-col gap-3">
      <div className="relative pb-4">
        {/* the owner: Ariyes › Appointments */}
        <div className="mr-20 flex h-[320px] flex-col overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-xl">
          <div className="flex h-7 shrink-0 items-center gap-2 border-b border-neutral-200 px-2.5">
            <span className="text-[9px] font-bold tracking-tight text-neutral-800">ariyes</span>
            <span className="size-3 rounded bg-blue-500" />
            <Bar w="56px" />
            <span className="ml-auto size-4 rounded-full bg-neutral-200" />
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="flex w-8 shrink-0 flex-col items-center gap-1.5 border-r border-neutral-200 py-2">
              <span className="size-4 rounded bg-neutral-200" />
              <span className="h-px w-3 bg-neutral-200" />
              <span className="size-4 rounded bg-blue-100 ring-1 ring-blue-300" />
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-4 rounded bg-neutral-100" />
              ))}
              <span className="mt-auto size-4 rounded bg-neutral-100" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-neutral-200 px-2.5">
                <span className="text-[10px] font-semibold text-neutral-900">Appointments</span>
                <span className="ml-auto h-3.5 w-7 rounded border border-neutral-200" />
                <span className="size-3.5 rounded border border-neutral-200" />
                <span className="size-3.5 rounded border border-neutral-200" />
              </div>
              <div className="flex h-5 shrink-0 items-center gap-2 border-b border-neutral-200 px-2.5">
                <span className="text-[8px] text-neutral-500 tabular-nums">
                  <b className="font-semibold text-neutral-800">{booked ? 9 : 8} booked</b>
                  {booked && !confirmed && " · 1 waiting"}
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[7px] text-neutral-500 max-[420px]:hidden">
                  <span className="size-1.5 rounded-sm border border-neutral-300" /> Available
                  <span className="size-1.5 rounded-sm bg-blue-200" /> Booked
                  <span className="size-1.5 rounded-sm bg-neutral-300" /> Unavailable
                </span>
              </div>
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
                  <div className="absolute inset-0 flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="flex-1 border-l border-neutral-100" />
                    ))}
                  </div>
                  {/* lunch: unavailable */}
                  <div className="absolute inset-x-0 bg-neutral-50 bg-[repeating-linear-gradient(-45deg,transparent_0_4px,#e5e5e5_4px_5px)]" style={{ top: `${4 * ROW}%`, height: `${ROW}%` }} />

                  {/* the rest of the week, in skeleton */}
                  <Block day={0} hour={9} />
                  <Block day={0} hour={10.5} h={1.5} />
                  <Block day={0} hour={15} />
                  <Block day={1} hour={9.5} name={keep.name} what={keep.what} />
                  <Block day={1} hour={11} name={other.name} what={other.what} />
                  <Block day={2} hour={10} h={1.5} />
                  <Block day={3} hour={10} />
                  <Block day={4} hour={9} h={1.5} />
                  <Block day={4} hour={14} />

                  {/* the booking this story follows: Wed 2:30 (waiting → confirmed), then Thu 3:00 */}
                  {booked && (
                    <Block
                      day={moved ? 3 : 2}
                      hour={moved ? 15 : 14.5}
                      tone={confirmed ? "booked" : "pending"}
                      name={me.name}
                      what={me.what}
                      className={cn(
                        "z-10 transition-[opacity,scale,background-color,border-color,box-shadow] duration-300 ease-out starting:scale-90 starting:opacity-0",
                        (f === 3 || f === 6) && "ring-2 ring-blue-300",
                        dragging && "opacity-30",
                        f === 9 && "ring-2 ring-yellow-400",
                      )}
                    />
                  )}
                  {dragging && <Block day={3} hour={15} tone="ghost" name={me.name} what={me.what} className="z-20 transition-[opacity,translate] duration-500 ease-out starting:-translate-x-full starting:-translate-y-[40%] starting:opacity-0" />}
                  {f === 9 && (
                    <span className="absolute z-20 flex items-center gap-0.5 rounded-full bg-yellow-100 px-1 py-px text-[7px] font-semibold text-yellow-900 transition-opacity duration-300 starting:opacity-0" style={{ left: `${3 * COL + 1}%`, top: `${6 * ROW - 7}%` }}>
                      <Bell className="size-2" /> Reminder
                    </span>
                  )}

                  {/* its details, with Confirm */}
                  {f === 4 && (
                    <div className="absolute z-20 flex w-[50%] flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg transition-[opacity,scale] duration-200 ease-out starting:scale-95 starting:opacity-0" style={{ left: "18%", top: "33%" }}>
                      <span className="text-[9px] font-semibold text-neutral-900">{me.name}</span>
                      <span className="text-[8px] text-neutral-500">Wed · 2:30pm · {me.what}</span>
                      <span className="rounded bg-yellow-50 px-1 py-0.5 text-[7px] text-yellow-900">Waiting for you to confirm</span>
                      <span className="mt-0.5 flex gap-1">
                        <span className="h-4 flex-1 rounded border border-neutral-200" />
                        <span className="flex h-4 flex-1 items-center justify-center gap-0.5 rounded bg-blue-500 text-[8px] font-semibold text-white">
                          <Check className="size-2.5" /> Confirm
                        </span>
                      </span>
                    </div>
                  )}

                  {!reduce && <Cursor x={cursor.x} y={cursor.y} down={f === 5 || f === 7} />}

                  {toast && (
                    <span key={f} className="absolute bottom-1.5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900 px-2 py-1 text-[8px] whitespace-nowrap text-white shadow-lg transition-[opacity,translate] duration-300 ease-out starting:translate-y-1 starting:opacity-0">
                      {toast.icon} {toast.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* the patient: the website on their phone, over the window's corner */}
        <div className="absolute right-0 bottom-0 flex h-[232px] w-[118px] flex-col overflow-hidden rounded-[22px] border-[4px] border-neutral-900 bg-white shadow-2xl">
          <div className="flex h-4 shrink-0 items-center justify-center">
            <span className="h-1 w-8 rounded-full bg-neutral-900" />
          </div>
          <div className="flex h-5 shrink-0 items-center gap-1 border-b border-neutral-100 px-2">
            <span className="size-2.5 rounded bg-blue-500" />
            <Bar w="32px" className="h-1" />
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col gap-1.5 p-2">
            {banner && <Banner key={f} {...banner} />}
            {f < 2 ? (
              <>
                <span className="text-[9px] leading-tight font-semibold text-neutral-900">{l.site}</span>
                {l.siteNote && <span className="text-[7px] leading-tight text-neutral-500">{l.siteNote}</span>}
                <div className="grid grid-cols-2 gap-1">
                  {l.items.slice(0, 6).map((t, i) => (
                    <span
                      key={t}
                      className={cn(
                        "grid h-5 place-items-center rounded border text-[7px] transition-colors duration-200",
                        f === 1 && i === 2 ? "border-blue-500 bg-blue-500 font-semibold text-white" : "border-neutral-200 text-neutral-600",
                      )}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className={cn("mt-auto grid h-6 place-items-center rounded-md text-[8px] font-semibold text-white transition-colors duration-200", f === 1 ? "bg-blue-500" : "bg-blue-300")}>{l.action}</span>
                {f === 1 && <span className="pointer-events-none absolute bottom-3 left-1/2 size-4 rounded-full bg-neutral-900/20 ring-2 ring-neutral-900/30 transition-opacity duration-300 starting:opacity-0" />}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center transition-opacity duration-300 starting:opacity-0">
                <span className={cn("grid size-7 place-items-center rounded-full", confirmed ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600")}>
                  {confirmed ? <CalendarCheck className="size-4" /> : <Check className="size-4" />}
                </span>
                <span className="text-[8.5px] leading-tight font-semibold text-neutral-900">{confirmed ? "You're booked" : "Request sent"}</span>
                <span className="text-[7px] leading-tight text-neutral-500">
                  {moved ? "Thu · 3:00pm" : `${slot.replace(" ", " · ")}pm`}
                  <br />
                  {me.what}
                </span>
                {!confirmed && <span className="text-[6.5px] leading-tight text-neutral-400">We&apos;ll confirm by email</span>}
              </div>
            )}
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
