"use client"

import { Plus, X } from "lucide-react"
import { Select, Switch } from "@gogetspace/baseplate"
import { WEEKDAYS, formatTime, fromMinutes, toMinutes, type Shift, type WeekHours } from "@gogetspace/modules"

/** every half hour from 5am to midnight */
const TIMES = Array.from({ length: 39 }, (_, i) => fromMinutes(300 + i * 30)).map((t) => ({ value: t, label: t === "24:00" ? "Midnight" : formatTime(t) }))
const LAST = 24 * 60

/** a sensible next block for "Add hours": an hour after the day's last one, two hours long */
function nextBlock(shifts: Shift[]): Shift | null {
  if (!shifts.length) return { start: "09:00", end: "17:00" }
  const after = Math.max(...shifts.map((s) => toMinutes(s.end))) + 60
  if (after + 30 > LAST) return null
  return { start: fromMinutes(after), end: fromMinutes(Math.min(after + 120, LAST)) }
}

/** what's wrong with a day's blocks, if anything: a block that ends before it starts, or two that overlap */
export function dayProblem(shifts: Shift[]) {
  if (shifts.some((s) => toMinutes(s.end) <= toMinutes(s.start))) return "A block ends before it starts."
  const sorted = [...shifts].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  if (sorted.some((s, i) => i > 0 && toMinutes(s.start) < toMinutes(sorted[i - 1].end))) return "Two blocks overlap."
  return null
}

export const weekValid = (w: WeekHours) => w.some((d) => d.length > 0) && w.every((d) => !dayProblem(d))

/**
 * Availability, one row per day: available or not, and as many from–to blocks as the day needs (a split shift, a
 * lunch break, evening hours…).
 */
export function WeekEditor({ value, onChange }: { value: WeekHours; onChange: (w: WeekHours) => void }) {
  const set = (i: number, shifts: Shift[]) => onChange(value.map((d, j) => (j === i ? shifts : d)))
  return (
    <ul className="flex min-w-0 flex-col divide-y divide-line-default">
      {WEEKDAYS.map((day, i) => {
        const shifts = value[i]
        const next = nextBlock(shifts)
        const problem = dayProblem(shifts)
        return (
          <li key={day} className="flex min-w-0 flex-col gap-2 py-2.5">
            <div className="flex min-h-8 items-center justify-between gap-3">
              <Switch label={day} checked={shifts.length > 0} onCheckedChange={(on) => set(i, on ? [{ start: "09:00", end: "17:00" }] : [])} />
              {!shifts.length && <span className="type-body-sm text-fg-tertiary">Unavailable</span>}
            </div>
            {shifts.map((sh, k) => (
              <div key={k} className="flex min-w-0 items-center gap-2">
                <Select ariaLabel={`${day}, block ${k + 1}, from`} value={sh.start} options={TIMES.slice(0, -1)} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, start: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                <span className="type-body-sm text-fg-tertiary">to</span>
                <Select ariaLabel={`${day}, block ${k + 1}, until`} value={sh.end} options={TIMES.slice(1)} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, end: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                <button
                  type="button"
                  aria-label={`Remove ${day} ${formatTime(sh.start)} to ${formatTime(sh.end)}`}
                  onClick={() => set(i, shifts.filter((_, n) => n !== k))}
                  className="grid size-8 shrink-0 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            ))}
            {problem && (
              <p role="alert" className="type-body-sm text-status-error-text">
                {problem}
              </p>
            )}
            {shifts.length > 0 && next && (
              <button
                type="button"
                onClick={() => set(i, [...shifts, next])}
                className="flex w-fit items-center gap-1 rounded-sm px-1 py-0.5 type-label-sm text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring"
              >
                <Plus aria-hidden className="size-3.5" /> Add hours
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
