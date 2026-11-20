"use client"

import { useState } from "react"
import { ArrowUpRight, CalendarClock, Plus, X } from "lucide-react"
import { Button, Select, Switch } from "@gogetspace/baseplate"
import { HOURS_PRESETS, WEEKDAYS, describeWeek, formatTime, fromMinutes, toMinutes, type Shift, type WeekHours } from "@gogetspace/modules"
import type { Msg } from "@/lib/generation/state"
import { moduleById } from "@/lib/playbooks/engine"
import { useGen } from "@/components/generate/gen-provider"
import { useEditorSiteMaybe } from "@/components/generate/editor-site"
import { Options, Row, Shell } from "@/components/generate/question-series"
import { ariyesUrl } from "@/lib/ariyes"
import { cn } from "@gogetspace/baseplate/cn"

const CUSTOM = "custom"

/** every half hour from 5am to midnight, for the time pickers */
const TIMES = Array.from({ length: 39 }, (_, i) => fromMinutes(300 + i * 30)).map((t) => ({ value: t, label: t === "24:00" ? "Midnight" : formatTime(t) }))

/** a sensible next block for "Add hours": an hour after the day's last one, two hours long */
function nextBlock(shifts: Shift[]): Shift | null {
  const after = Math.max(...shifts.map((x) => toMinutes(x.end))) + 60
  if (after + 30 > 24 * 60) return null
  return { start: fromMinutes(after), end: fromMinutes(Math.min(after + 120, 24 * 60)) }
}

const overlaps = (shifts: Shift[]) => {
  const sorted = [...shifts].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  return sorted.some((x, i) => toMinutes(x.end) <= toMinutes(x.start) || (i > 0 && toMinutes(x.start) < toMinutes(sorted[i - 1].end)))
}

/** the week, one row per day: available or not, and as many from–to blocks as the day needs */
function WeekEditor({ value, onChange }: { value: WeekHours; onChange: (w: WeekHours) => void }) {
  const set = (i: number, shifts: Shift[]) => onChange(value.map((d, j) => (j === i ? shifts : d)))
  return (
    <ul className="flex min-w-0 flex-col divide-y divide-line-default rounded-md border border-line-default bg-surface">
      {WEEKDAYS.map((day, i) => {
        const shifts = value[i]
        const next = shifts.length ? nextBlock(shifts) : null
        return (
          <li key={day} className="flex min-w-0 flex-col gap-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <Switch label={day} checked={shifts.length > 0} onCheckedChange={(on) => set(i, on ? [{ start: "09:00", end: "17:00" }] : [])} />
              {!shifts.length && <span className="type-body-sm text-fg-tertiary">Unavailable</span>}
            </div>
            {shifts.map((sh, k) => (
              <div key={k} className="flex min-w-0 items-center gap-2">
                <Select ariaLabel={`${day}, block ${k + 1}, from`} value={sh.start} options={TIMES.slice(0, -1)} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, start: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                <span className="type-body-sm text-fg-tertiary">to</span>
                <Select ariaLabel={`${day}, block ${k + 1}, until`} value={sh.end} options={TIMES.slice(1)} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, end: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                <button type="button" aria-label={`Remove ${day} ${formatTime(sh.start)} to ${formatTime(sh.end)}`} onClick={() => set(i, shifts.filter((_, n) => n !== k))} className="grid size-8 shrink-0 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring">
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {overlaps(shifts) && (
              <p role="alert" className="type-body-sm text-status-error-text">
                Two blocks overlap, or one ends before it starts.
              </p>
            )}
            {next && (
              <button type="button" onClick={() => set(i, [...shifts, next])} className="flex w-fit items-center gap-1 rounded-sm px-1 py-0.5 type-label-sm text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
                <Plus className="size-3.5" /> Add hours
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Appointments' one setup question in the chat: when bookings can be made. Everything else (booking types, slots,
 * reminders) the agent sets up itself. Skipping is fine: Ariyes asks again when the owner first opens Appointments.
 */
export function HoursCard({ m, compact }: { m: Extract<Msg, { type: "pb-hours" }>; compact?: boolean }) {
  const { s, dispatch } = useGen()
  const editor = useEditorSiteMaybe()
  const name = moduleById(m.module).name
  const current = s.hours && s.hours !== "skipped" ? s.hours : null
  const [pick, setPick] = useState<string>(() => (current ? (HOURS_PRESETS.find((p) => JSON.stringify(p.week) === JSON.stringify(current))?.id ?? CUSTOM) : ""))
  const [custom, setCustom] = useState<WeekHours>(() => current ?? HOURS_PRESETS[0].week)
  const chosen = pick === CUSTOM ? custom : HOURS_PRESETS.find((p) => p.id === pick)?.week
  const valid = !!chosen && chosen.some((d) => d.length) && chosen.every((d) => !overlaps(d))
  const link = ariyesUrl(editor?.site.id ?? "new-site", m.module, { hours: s.hours })

  if (m.answer) {
    return (
      <div data-hours-card className={cn("flex items-start gap-3 rounded-[16px] border border-line-default bg-surface p-4", !compact && "sm:mr-20")}>
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-blue-subtle text-fg-link">
          <CalendarClock className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-label-md text-fg-primary">{name} availability</p>
          <p className="type-body-sm text-fg-secondary">{current ? describeWeek(current) : "Not set yet. Ariyes asks when you open Appointments."}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "reopenHours", id: m.id })}>
              {current ? "Change availability" : "Set it now"}
            </Button>
            <Button size="sm" variant="ghost" trailingIcon={<ArrowUpRight />} asChild>
              <a href={link} target="_blank" rel="noreferrer">
                Open in Ariyes
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-hours-card>
      <Shell
        compact={compact}
        title={`Set up ${name}`}
        help="This is the only part I can't decide for you. Booking types, slot lengths, the confirmation and the reminder are already set up from your services."
        description={`${name} is on your site. I've set up the rest from your services. I just need your availability, so people only book when you can see them.`}
        question="When can people book an appointment?"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => dispatch({ type: "skipHours", id: m.id })}>
              <span className="sm:hidden">Later</span>
              <span className="max-sm:hidden">Skip, ask me in Ariyes</span>
            </Button>
            <Button disabled={!valid} onClick={() => chosen && dispatch({ type: "setHours", id: m.id, hours: chosen })}>
              Use this availability
            </Button>
          </div>
        }
      >
        <Options>
          {HOURS_PRESETS.map((p) => (
            <Row key={p.id} checked={pick === p.id} label={p.label} description={describeWeek(p.week)} onSelect={() => setPick(p.id)} />
          ))}
          <Row checked={pick === CUSTOM} label="Set my own availability" onSelect={() => setPick(CUSTOM)}>
            {pick === CUSTOM ? <WeekEditor value={custom} onChange={setCustom} /> : undefined}
          </Row>
        </Options>
      </Shell>
    </div>
  )
}
