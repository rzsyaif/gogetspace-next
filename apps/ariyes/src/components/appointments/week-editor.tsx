"use client"

import { Plus, X } from "lucide-react"
import { Select, Switch } from "@gogetspace/baseplate"
import { WEEKDAYS, formatTime, fromMinutes, type WeekHours } from "@gogetspace/modules"

/** every half hour from 6am to 11pm */
const TIMES = Array.from({ length: 35 }, (_, i) => fromMinutes(360 + i * 30)).map((t) => ({ value: t, label: formatTime(t) }))

/** the week, one row per day: open or closed, from–to, and a second block for a break */
export function WeekEditor({ value, onChange }: { value: WeekHours; onChange: (w: WeekHours) => void }) {
  const set = (i: number, shifts: WeekHours[number]) => onChange(value.map((d, j) => (j === i ? shifts : d)))
  return (
    <ul className="flex min-w-0 flex-col divide-y divide-line-default">
      {WEEKDAYS.map((day, i) => {
        const shifts = value[i]
        return (
          <li key={day} className="flex min-w-0 flex-col gap-2 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <Switch label={day} checked={shifts.length > 0} onCheckedChange={(on) => set(i, on ? [{ start: "09:00", end: "17:00" }] : [])} />
              {!shifts.length && <span className="type-body-sm text-fg-tertiary">Closed</span>}
              {shifts.length === 1 && (
                <button
                  type="button"
                  onClick={() => set(i, [{ start: shifts[0].start, end: "13:00" }, { start: "14:00", end: shifts[0].end > "14:00" ? shifts[0].end : "18:00" }])}
                  className="flex items-center gap-1 rounded-sm px-1.5 py-1 type-label-sm text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring"
                >
                  <Plus aria-hidden className="size-3.5" /> Add a break
                </button>
              )}
            </div>
            {shifts.map((sh, k) => (
              <div key={k} className="flex min-w-0 items-center gap-2">
                <Select ariaLabel={`${day} from`} value={sh.start} options={TIMES} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, start: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                <span className="type-body-sm text-fg-tertiary">to</span>
                <Select ariaLabel={`${day} until`} value={sh.end} options={TIMES} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, end: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                {shifts.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`Remove ${day}'s ${k === 0 ? "first" : "second"} block`}
                    onClick={() => set(i, shifts.filter((_, n) => n !== k))}
                    className="grid size-8 shrink-0 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                ) : (
                  <span aria-hidden className="size-8 shrink-0" />
                )}
              </div>
            ))}
          </li>
        )
      })}
    </ul>
  )
}
