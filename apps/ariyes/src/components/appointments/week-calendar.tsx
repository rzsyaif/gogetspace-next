"use client"

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { WEEKDAYS_SHORT, formatTime, fromMinutes, toMinutes, type Booking, type WeekHours } from "@gogetspace/modules"
import { isoDate } from "@gogetspace/modules/mock"
import { cn } from "@gogetspace/baseplate/cn"

const HOUR_PX = 56
/** how far the pointer moves before a press on a booking becomes a drag */
const DRAG_START_PX = 4

/** the hours the grid shows: an hour either side of the week's availability, at least 8am–6pm */
export function gridHours(hours: WeekHours | null) {
  const all = (hours ?? []).flat()
  const open = all.length ? Math.min(...all.map((s) => toMinutes(s.start))) : 9 * 60
  const close = all.length ? Math.max(...all.map((s) => toMinutes(s.end))) : 17 * 60
  return { start: Math.max(0, Math.min(8, Math.floor(open / 60) - 1)), end: Math.min(24, Math.max(18, Math.ceil(close / 60) + 1)) }
}

/** the diagonal hatch of time that can't be booked */
const UNAVAILABLE = "bg-subtle bg-[repeating-linear-gradient(-45deg,transparent_0_7px,var(--color-line-default)_7px_8px)]"

export function Legend({ className }: { className?: string }) {
  const item = (swatch: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-3.5 rounded-[4px] border border-line-default", swatch)} />
      {label}
    </span>
  )
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 type-body-sm text-fg-secondary", className)}>
      {item("bg-surface", "Available")}
      {item("border-blue-300 bg-accent-blue-subtle", "Booked")}
      {item(UNAVAILABLE, "Unavailable")}
    </p>
  )
}

interface Drag {
  booking: Booking
  pointerId: number
  x: number
  y: number
  /** where in the block it was grabbed, so the block doesn't jump under the pointer */
  grab: number
  moving: boolean
  /** where it would land */
  col: number
  start: number
  ok: boolean
}

/**
 * A Google Calendar–style week (or one day on narrow screens): available time plain, unavailable time hatched,
 * bookings as blocks. Drag a booking (mouse or pen) to another free time to reschedule it; on touch, and from the
 * keyboard, rescheduling is in the booking's details. Times are the business's local time.
 */
export function WeekCalendar({
  days,
  hours,
  bookings,
  now,
  snap,
  canPlace,
  onOpen,
  onMove,
}: {
  /** the dates to show, as local Date objects (7 for a week, 1 for a day) */
  days: Date[]
  hours: WeekHours
  bookings: Booking[]
  now: Date
  /** minutes a dragged booking snaps to (the booking page's start times) */
  snap: number
  /** whether a booking can move to that date and start time (inside availability, free, not in the past) */
  canPlace: (b: Booking, date: string, start: string) => boolean
  onOpen: (b: Booking) => void
  onMove: (b: Booking, date: string, start: string) => void
}) {
  const { start, end } = gridHours(hours)
  const height = (end - start) * HOUR_PX
  const y = (min: number) => ((min - start * 60) / 60) * HOUR_PX
  const today = isoDate(now)
  const scroller = useRef<HTMLDivElement>(null)
  const cols = useRef<(HTMLDivElement | null)[]>([])
  const [drag, setDrag] = useState<Drag | null>(null)
  const justDragged = useRef(false)

  // open on the start of the working day, not at the top of the grid
  useEffect(() => {
    const first = Math.min(...hours.flat().map((s) => toMinutes(s.start)), 9 * 60)
    scroller.current?.scrollTo({ top: Math.max(0, y(first) - 24) })
    // only when the grid first shows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const where = (d: Drag, cx: number, cy: number) => {
    const rects = cols.current.map((c) => c?.getBoundingClientRect())
    let col = rects.findIndex((r) => r && cx >= r.left && cx < r.right)
    if (col < 0) col = rects[0] && cx < rects[0].left ? 0 : rects.length - 1
    const top = rects[col]!.top
    const raw = start * 60 + ((cy - top - d.grab) / HOUR_PX) * 60
    const min = Math.max(start * 60, Math.min(end * 60 - d.booking.minutes, Math.round(raw / snap) * snap))
    return { col, start: min, ok: canPlace(d.booking, isoDate(days[col]), fromMinutes(min)) }
  }

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, b: Booking) => {
    if (e.pointerType === "touch" || e.button !== 0) return
    const r = e.currentTarget.getBoundingClientRect()
    setDrag({ booking: b, pointerId: e.pointerId, x: e.clientX, y: e.clientY, grab: e.clientY - r.top, moving: false, col: 0, start: 0, ok: false })
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    if (!drag.moving && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_START_PX) return
    if (!drag.moving) e.currentTarget.setPointerCapture(e.pointerId)
    // scroll the grid when dragging near its top or bottom edge
    const sr = scroller.current?.getBoundingClientRect()
    if (sr && e.clientY > sr.bottom - 32) scroller.current!.scrollBy({ top: 12 })
    else if (sr && e.clientY < sr.top + 96) scroller.current!.scrollBy({ top: -12 })
    setDrag({ ...drag, moving: true, ...where(drag, e.clientX, e.clientY) })
  }

  const onUp = () => {
    if (!drag) return
    if (drag.moving) {
      justDragged.current = true
      const date = isoDate(days[drag.col])
      const to = fromMinutes(drag.start)
      if (drag.ok && (date !== drag.booking.date || to !== drag.booking.start)) onMove(drag.booking, date, to)
    }
    setDrag(null)
  }

  const cancel = () => setDrag(null)

  useEffect(() => {
    if (!drag?.moving) return
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      justDragged.current = true
      setDrag(null)
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [drag?.moving])

  const dragging = drag?.moving ? drag : null

  return (
    <div ref={scroller} className={cn("h-full min-h-0 overflow-y-auto", dragging && "cursor-grabbing select-none")}>
      {/* day headers, sticky inside the scroller so the columns line up with the grid; on one day the strip above names it */}
      <div className={cn("sticky top-0 z-30 flex border-b border-line-default bg-surface", days.length === 1 && "hidden")}>
        <span className="w-14 shrink-0" />
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((d) => {
            const isToday = isoDate(d) === today
            const wd = (d.getDay() + 6) % 7
            return (
              <div key={isoDate(d)} className="flex flex-col items-center gap-0.5 border-l border-line-default py-2">
                <span className={cn("type-label-sm", isToday ? "text-fg-link" : "text-fg-tertiary")}>{WEEKDAYS_SHORT[wd]}</span>
                <span className={cn("grid size-8 place-items-center rounded-full type-label-lg tabular-nums", isToday ? "bg-action-primary text-fg-on-action" : "text-fg-primary")}>{d.getDate()}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative flex" style={{ height }}>
        {/* hour labels */}
        <div className="relative w-14 shrink-0">
          {Array.from({ length: end - start }, (_, i) => start + i)
            .slice(1)
            .map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 type-caption text-fg-tertiary tabular-nums" style={{ top: (h - start) * HOUR_PX }}>
                {formatTime(`${String(h).padStart(2, "0")}:00`)}
              </span>
            ))}
        </div>

        <div className="relative grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((d, ci) => {
            const date = isoDate(d)
            const wd = (d.getDay() + 6) % 7
            const isToday = date === today
            const nowMin = now.getHours() * 60 + now.getMinutes()
            return (
              <div
                key={date}
                ref={(el) => {
                  cols.current[ci] = el
                }}
                className={cn("relative border-l border-line-default", UNAVAILABLE)}
                aria-label={`${WEEKDAYS_SHORT[wd]} ${d.getDate()}`}
                role="group"
              >
                {/* available time */}
                {hours[wd].map((s) => (
                  <div key={s.start} className="absolute inset-x-0 bg-surface" style={{ top: y(toMinutes(s.start)), height: y(toMinutes(s.end)) - y(toMinutes(s.start)) }} />
                ))}
                {/* hour lines */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-line-default)_1px,transparent_1px)]" style={{ backgroundSize: `100% ${HOUR_PX}px` }} />
                {/* bookings */}
                {bookings
                  .filter((b) => b.date === date)
                  .map((b) => {
                    const h = (b.minutes / 60) * HOUR_PX - 3
                    const short = h < 34
                    const lifted = dragging?.booking.id === b.id
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          if (justDragged.current) {
                            justDragged.current = false
                            return
                          }
                          onOpen(b)
                        }}
                        onPointerDown={(e) => onDown(e, b)}
                        onPointerMove={onPointerMove}
                        onPointerUp={onUp}
                        onPointerCancel={cancel}
                        aria-label={`${formatTime(b.start)}, ${b.name}, ${b.type}${b.status === "pending" ? ", waiting for confirmation" : ""}`}
                        className={cn(
                          "absolute inset-x-1 z-10 flex overflow-hidden rounded-[6px] border px-2 text-left transition-[filter,scale,opacity] duration-150 ease-out hover:brightness-[0.97] focus-visible:outline-none focus-visible:focus-ring [@media(pointer:fine)]:cursor-grab",
                          !dragging && "active:scale-[0.98]",
                          short ? "items-center gap-1.5 py-0" : "flex-col py-0.5",
                          b.status === "pending" ? "border-dashed border-blue-400 bg-surface" : "border-blue-200 bg-accent-blue-subtle",
                          lifted && "opacity-40",
                        )}
                        style={{ top: y(toMinutes(b.start)) + 1, height: h }}
                      >
                        <span className={cn("truncate type-label-sm text-fg-primary", short && "shrink-0")}>{b.name}</span>
                        <span className="truncate type-caption text-fg-secondary">
                          {formatTime(b.start)}
                          {!short && ` · ${b.type}`}
                        </span>
                      </button>
                    )
                  })}
                {/* where a dragged booking would land */}
                {dragging && dragging.col === ci && (() => {
                  const gh = (dragging.booking.minutes / 60) * HOUR_PX - 3
                  return (
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-x-1 z-20 flex overflow-hidden rounded-[6px] border-2 px-2 shadow-soft-md",
                      gh < 34 ? "items-center gap-1.5" : "flex-col py-0.5",
                      dragging.ok ? "border-blue-500 bg-accent-blue-subtle" : "border-dashed border-status-error-solid bg-status-error-bg",
                    )}
                    style={{ top: y(dragging.start) + 1, height: gh }}
                  >
                    {(gh >= 34 || dragging.ok) && <span className={cn("truncate type-label-sm text-fg-primary", gh < 34 && "shrink-0")}>{dragging.booking.name}</span>}
                    <span className={cn("truncate type-caption", dragging.ok ? "text-fg-secondary" : "text-status-error-text")}>
                      {dragging.ok ? `${formatTime(fromMinutes(dragging.start))}–${formatTime(fromMinutes(dragging.start + dragging.booking.minutes))}` : "Not available"}
                    </span>
                  </div>
                  )
                })()}
                {/* now */}
                {isToday && nowMin >= start * 60 && nowMin <= end * 60 && (
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 z-20" style={{ top: y(nowMin) }}>
                    <span className="absolute -top-[5px] -left-[5px] size-2.5 rounded-full bg-coral-500" />
                    <span className="block h-0.5 bg-coral-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
