"use client"

import { useEffect, useRef } from "react"
import { WEEKDAYS_SHORT, formatTime, toMinutes, type Booking, type WeekHours } from "@gogetspace/modules"
import { isoDate } from "@gogetspace/modules/mock"
import { cn } from "@gogetspace/baseplate/cn"

const HOUR_PX = 56

/** the hours the grid shows: an hour either side of the week's opening hours, at least 8am–6pm */
export function gridHours(hours: WeekHours | null) {
  const all = (hours ?? []).flat()
  const open = all.length ? Math.min(...all.map((s) => toMinutes(s.start))) : 9 * 60
  const close = all.length ? Math.max(...all.map((s) => toMinutes(s.end))) : 17 * 60
  return { start: Math.max(0, Math.min(8, Math.floor(open / 60) - 1)), end: Math.min(24, Math.max(18, Math.ceil(close / 60) + 1)) }
}

/** the diagonal hatch of time that can't be booked */
const CLOSED = "bg-subtle bg-[repeating-linear-gradient(-45deg,transparent_0_7px,var(--color-line-default)_7px_8px)]"

export function Legend({ className }: { className?: string }) {
  const item = (swatch: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-3.5 rounded-[4px] border border-line-default", swatch)} />
      {label}
    </span>
  )
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 type-body-sm text-fg-secondary", className)}>
      {item("bg-surface", "Open")}
      {item("border-blue-300 bg-accent-blue-subtle", "Booked")}
      {item(CLOSED, "Closed")}
    </p>
  )
}

/**
 * A Google Calendar–style week (or one day on narrow screens): open hours plain, closed time hatched, bookings as
 * blocks. Times are the practice's local time.
 */
export function WeekCalendar({
  days,
  hours,
  bookings,
  now,
  onOpen,
}: {
  /** the dates to show, as local Date objects (7 for a week, 1 for a day) */
  days: Date[]
  hours: WeekHours
  bookings: Booking[]
  now: Date
  onOpen: (b: Booking) => void
}) {
  const { start, end } = gridHours(hours)
  const height = (end - start) * HOUR_PX
  const y = (min: number) => ((min - start * 60) / 60) * HOUR_PX
  const today = isoDate(now)
  const scroller = useRef<HTMLDivElement>(null)

  // open on the start of the working day, not at the top of the grid
  useEffect(() => {
    const first = Math.min(...hours.flat().map((s) => toMinutes(s.start)), 9 * 60)
    scroller.current?.scrollTo({ top: Math.max(0, y(first) - 24) })
    // only when the grid first shows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={scroller} className="h-full min-h-0 overflow-y-auto">
      {/* day headers, sticky inside the scroller so the columns line up with the grid */}
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

      <div>
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
            {days.map((d) => {
              const date = isoDate(d)
              const wd = (d.getDay() + 6) % 7
              const shifts = hours[wd]
              const isToday = date === today
              const nowMin = now.getHours() * 60 + now.getMinutes()
              return (
                <div key={date} className={cn("relative border-l border-line-default", CLOSED)} aria-label={`${WEEKDAYS_SHORT[wd]} ${d.getDate()}`} role="group">
                  {/* open hours */}
                  {shifts.map((s) => (
                    <div key={s.start} className="absolute inset-x-0 bg-surface" style={{ top: y(toMinutes(s.start)), height: y(toMinutes(s.end)) - y(toMinutes(s.start)) }} />
                  ))}
                  {/* hour lines */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-line-default)_1px,transparent_1px)]" style={{ backgroundSize: `100% ${HOUR_PX}px` }} />
                  {/* bookings */}
                  {bookings
                    .filter((b) => b.date === date)
                    .map((b) => {
                      const top = y(toMinutes(b.start))
                      const h = (b.minutes / 60) * HOUR_PX - 3
                      const short = h < 34
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onOpen(b)}
                          aria-label={`${formatTime(b.start)}, ${b.name}, ${b.type}${b.status === "pending" ? ", waiting for confirmation" : ""}`}
                          className={cn(
                            "absolute inset-x-1 z-10 flex overflow-hidden rounded-[6px] border px-2 text-left transition-[filter,scale] duration-150 ease-out hover:brightness-[0.97] active:scale-[0.98] focus-visible:outline-none focus-visible:focus-ring",
                            short ? "items-center gap-1.5 py-0" : "flex-col py-0.5",
                            b.status === "pending" ? "border-dashed border-blue-400 bg-surface" : "border-blue-200 bg-accent-blue-subtle",
                          )}
                          style={{ top: top + 1, height: h }}
                        >
                          <span className={cn("truncate type-label-sm text-fg-primary", short && "shrink-0")}>{b.name}</span>
                          <span className="truncate type-caption text-fg-secondary">
                            {formatTime(b.start)}
                            {!short && ` · ${b.type}`}
                          </span>
                        </button>
                      )
                    })}
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
    </div>
  )
}
