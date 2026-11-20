"use client"

import { useState } from "react"
import { ArrowUpRight, CalendarClock, Plus, X } from "lucide-react"
import { Button, Select, Switch } from "@gogetspace/baseplate"
import { HOURS_PRESETS, WEEKDAYS, describeWeek, formatTime, fromMinutes, type WeekHours } from "@gogetspace/modules"
import type { Msg } from "@/lib/generation/state"
import { moduleById } from "@/lib/playbooks/engine"
import { useGen } from "@/components/generate/gen-provider"
import { useEditorSiteMaybe } from "@/components/generate/editor-site"
import { Options, Row, Shell } from "@/components/generate/question-series"
import { ariyesUrl } from "@/lib/ariyes"
import { cn } from "@gogetspace/baseplate/cn"

const CUSTOM = "custom"

/** every half hour from 6am to 11pm, for the time pickers */
const TIMES = Array.from({ length: 35 }, (_, i) => fromMinutes(360 + i * 30)).map((t) => ({ value: t, label: formatTime(t) }))

/** the week, one row per day: open or closed, and from–to (a second block for a lunch break) */
function WeekEditor({ value, onChange }: { value: WeekHours; onChange: (w: WeekHours) => void }) {
  const set = (i: number, shifts: WeekHours[number]) => onChange(value.map((d, j) => (j === i ? shifts : d)))
  return (
    <ul className="flex min-w-0 flex-col divide-y divide-line-default rounded-md border border-line-default bg-surface">
      {WEEKDAYS.map((day, i) => {
        const shifts = value[i]
        return (
          <li key={day} className="flex min-w-0 flex-col gap-2 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <Switch label={day} checked={shifts.length > 0} onCheckedChange={(on) => set(i, on ? [{ start: "09:00", end: "17:00" }] : [])} />
              {!shifts.length && <span className="type-body-sm text-fg-tertiary">Closed</span>}
            </div>
            {shifts.length > 0 && (
              <div className="flex min-w-0 flex-col gap-2">
                {shifts.map((sh, k) => (
                  <div key={k} className="flex min-w-0 items-center gap-2">
                    <Select ariaLabel={`${day} opens`} value={sh.start} options={TIMES} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, start: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                    <span className="type-body-sm text-fg-tertiary">to</span>
                    <Select ariaLabel={`${day} closes`} value={sh.end} options={TIMES} onValueChange={(v) => set(i, shifts.map((x, n) => (n === k ? { ...x, end: v } : x)))} className="h-10 min-w-0 flex-1 px-3" />
                    {k > 0 && (
                      <button type="button" aria-label={`Remove ${day}'s second block`} onClick={() => set(i, shifts.filter((_, n) => n !== k))} className="grid size-8 shrink-0 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                {shifts.length === 1 && (
                  <button
                    type="button"
                    onClick={() => set(i, [{ start: shifts[0].start, end: "13:00" }, { start: "14:00", end: shifts[0].end > "14:00" ? shifts[0].end : "18:00" }])}
                    className="flex w-fit items-center gap-1 rounded-sm px-1 py-0.5 type-label-sm text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring"
                  >
                    <Plus className="size-3.5" /> Add a lunch break
                  </button>
                )}
              </div>
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
  const valid = !!chosen && chosen.some((d) => d.length) && chosen.every((d) => d.every((x) => x.start < x.end))
  const link = ariyesUrl(editor?.site.id ?? "new-site", m.module, { hours: s.hours })

  if (m.answer) {
    return (
      <div data-hours-card className={cn("flex items-start gap-3 rounded-[16px] border border-line-default bg-surface p-4", !compact && "sm:mr-20")}>
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-blue-subtle text-fg-link">
          <CalendarClock className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-label-md text-fg-primary">{name} hours</p>
          <p className="type-body-sm text-fg-secondary">{current ? describeWeek(current) : "Not set yet — Ariyes will ask when you open Appointments."}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "reopenHours", id: m.id })}>
              {current ? "Change hours" : "Set hours now"}
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
        description={`${name} is on your site. I've set up the rest from your services. I just need your hours, so people can only book when you're there.`}
        question="When can people book an appointment?"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => dispatch({ type: "skipHours", id: m.id })}>
              <span className="sm:hidden">Later</span>
              <span className="max-sm:hidden">Skip, ask me in Ariyes</span>
            </Button>
            <Button disabled={!valid} onClick={() => chosen && dispatch({ type: "setHours", id: m.id, hours: chosen })}>
              Use these hours
            </Button>
          </div>
        }
      >
        <Options>
          {HOURS_PRESETS.map((p) => (
            <Row key={p.id} checked={pick === p.id} label={p.label} description={describeWeek(p.week)} onSelect={() => setPick(p.id)} />
          ))}
          <Row checked={pick === CUSTOM} label="Set my own hours" onSelect={() => setPick(CUSTOM)}>
            {pick === CUSTOM ? <WeekEditor value={custom} onChange={setCustom} /> : undefined}
          </Row>
        </Options>
      </Shell>
    </div>
  )
}
