"use client"

import { useMemo, useState } from "react"
import { CalendarClock, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge, Button, Dialog, DialogContent, IconButton, RadioCard } from "@gogetspace/baseplate"
import { HOURS_PRESETS, WEEKDAYS_SHORT, describeWeek, formatTime, toMinutes, type AppointmentSettings, type Booking, type Project, type WeekHours } from "@gogetspace/modules"
import { weekBookings } from "@gogetspace/modules/mock"
import { cn } from "@gogetspace/baseplate/cn"
import { AppShell } from "../app-shell"
import { useMedia, useMounted } from "../use-media"
import { Legend, WeekCalendar } from "./week-calendar"
import { SettingsPanel } from "./settings-panel"
import { WeekEditor } from "./week-editor"

const mondayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", o)

/** "17 – 23 November 2026", "28 Nov – 4 Dec 2026" */
function rangeLabel(a: Date, b: Date) {
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${fmt(b, { day: "numeric", month: "long", year: "numeric" })}`
  return `${fmt(a, { day: "numeric", month: "short" })} – ${fmt(b, { day: "numeric", month: "short", year: "numeric" })}`
}

/** first visit without hours: the one question the GoGetSpace chat would have asked */
function HoursOnboarding({ onSave }: { onSave: (w: WeekHours) => void }) {
  const [pick, setPick] = useState<string>(HOURS_PRESETS[0].id)
  const [custom, setCustom] = useState<WeekHours>(HOURS_PRESETS[0].week)
  const week = pick === "custom" ? custom : HOURS_PRESETS.find((p) => p.id === pick)!.week
  const valid = week.some((d) => d.length) && week.every((d) => d.every((s) => s.start < s.end))
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-10 sm:py-14">
        <div className="flex flex-col gap-3">
          <span aria-hidden className="grid size-12 place-items-center rounded-lg bg-accent-blue-subtle text-fg-link">
            <CalendarClock className="size-6" strokeWidth={1.5} />
          </span>
          <h2 className="type-h3 text-fg-primary">When do you take bookings?</h2>
          <p className="type-body-md text-fg-secondary">
            Everything else is set up: booking types from your services, confirmations and reminders. Your booking page opens as soon as it knows your hours.
          </p>
        </div>
        <div role="radiogroup" aria-label="Opening hours" className="flex flex-col gap-2">
          {HOURS_PRESETS.map((p) => (
            <RadioCard key={p.id} name="hours" checked={pick === p.id} onChange={() => setPick(p.id)} title={p.label} description={describeWeek(p.week)} />
          ))}
          <RadioCard name="hours" checked={pick === "custom"} onChange={() => setPick("custom")} title="Set my own hours">
            {pick === "custom" ? <WeekEditor value={custom} onChange={setCustom} /> : null}
          </RadioCard>
        </div>
        <Button disabled={!valid} onClick={() => onSave(week)} className="self-start">
          Open my booking page
        </Button>
      </div>
    </div>
  )
}

/** a booking's details, with the actions an owner takes on it */
function BookingDialog({ booking, onClose, onConfirm, onCancel }: { booking: Booking | null; onClose: () => void; onConfirm: (b: Booking) => void; onCancel: (b: Booking) => void }) {
  const b = booking
  const date = b ? new Date(`${b.date}T00:00`) : null
  const end = b ? formatTime(`${String(Math.floor((toMinutes(b.start) + b.minutes) / 60)).padStart(2, "0")}:${String((toMinutes(b.start) + b.minutes) % 60).padStart(2, "0")}`) : ""
  return (
    <Dialog open={!!b} onOpenChange={(o) => !o && onClose()}>
      {b && date && (
        <DialogContent
          title={b.name}
          description={`${b.type} · ${fmt(date, { weekday: "long", day: "numeric", month: "long" })}, ${formatTime(b.start)}–${end}`}
          footer={
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row [&>*]:max-sm:w-full">
              <Button variant="secondary" onClick={() => onCancel(b)}>
                Cancel booking
              </Button>
              {b.status === "pending" ? (
                <Button leadingIcon={<Check />} onClick={() => onConfirm(b)}>
                  Confirm
                </Button>
              ) : (
                <Button onClick={onClose}>Done</Button>
              )}
            </div>
          }
        >
          <div className="flex flex-col items-start gap-3">
            {b.status === "pending" ? <Badge tone="warning">Waiting for you to confirm</Badge> : <Badge tone="success">Confirmed</Badge>}
            <p className="type-body-md text-fg-secondary">They get a confirmation email, and a reminder before the appointment. Cancelling lets them know and frees the time.</p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

/**
 * Ariyes › Appointments: the week's calendar in the middle, the settings on the right. With no hours yet (skipped in
 * the GoGetSpace chat) it asks for them first. Edits are local to the prototype.
 */
export function AppointmentsApp({ project, initial }: { project: Project; initial: AppointmentSettings }) {
  const [settings, setSettings] = useState(initial)
  const [offset, setOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState<number | null>(null)
  const [open, setOpen] = useState<Booking | null>(null)
  const [changes, setChanges] = useState<Record<string, "confirmed" | "cancelled">>({})
  const mounted = useMounted()
  const narrow = useMedia("(max-width: 767px)")

  // dates come from the viewer's clock, so the calendar draws in the browser only
  const now = useMemo(() => (mounted ? new Date() : null), [mounted])
  const monday = now ? addDays(mondayOf(now), offset * 7) : null
  const week = monday ? Array.from({ length: 7 }, (_, i) => addDays(monday, i)) : []
  const todayIdx = now && offset === 0 ? (now.getDay() + 6) % 7 : 0
  const day = dayIndex ?? todayIdx
  const bookings = useMemo(
    () =>
      monday && settings.hours
        ? weekBookings(project.id, monday, settings.hours, now!)
            .filter((b) => changes[b.id] !== "cancelled")
            .map((b) => (changes[b.id] === "confirmed" ? { ...b, status: "confirmed" as const } : b))
        : [],
    // monday is derived from now + offset
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.id, now, offset, settings.hours, changes],
  )
  const booked = bookings.length
  const pending = bookings.filter((b) => b.status === "pending").length

  const panel = <SettingsPanel value={settings} onChange={setSettings} />
  const nav = monday && settings.hours && (
    <>
      <Button size="sm" variant="secondary" onClick={() => {
          setOffset(0)
          setDayIndex(null)
        }}>
        Today
      </Button>
      <span className="flex">
        <IconButton aria-label="Previous week" onClick={() => setOffset((o) => o - 1)}>
          <ChevronLeft />
        </IconButton>
        <IconButton aria-label="Next week" onClick={() => setOffset((o) => o + 1)}>
          <ChevronRight />
        </IconButton>
      </span>
      <span className="type-label-md text-fg-primary tabular-nums" aria-live="polite">
        {rangeLabel(week[0], week[6])}
      </span>
    </>
  )

  let main
  if (!mounted) main = null
  else if (!settings.hours) main = <HoursOnboarding onSave={(h) => setSettings((s) => ({ ...s, hours: h }))} />
  else
    main = (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-default bg-surface px-4 py-2 sm:px-5">
          <p className="type-body-sm text-fg-secondary">
            <span className="font-medium text-fg-primary">{booked} booked</span> this week
            {pending > 0 && <> · {pending} waiting for you to confirm</>}
          </p>
          <Legend />
        </div>
        {narrow && (
          <div role="tablist" aria-label="Day" className="grid grid-cols-7 gap-1 border-b border-line-default bg-surface px-2 py-2">
            {week.map((d, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={day === i}
                onClick={() => setDayIndex(i)}
                className={cn(
                  "flex flex-col items-center rounded-md py-1 type-caption transition-colors focus-visible:outline-none focus-visible:focus-ring",
                  day === i ? "bg-action-primary text-fg-on-action" : "text-fg-secondary hover:bg-subtle",
                )}
              >
                {WEEKDAYS_SHORT[i]}
                <span className="type-label-md">{d.getDate()}</span>
              </button>
            ))}
          </div>
        )}
        <div className="min-h-0 flex-1">
          <WeekCalendar key={`${offset}-${narrow ? day : "w"}`} days={narrow ? [week[day]] : week} hours={settings.hours} bookings={bookings} now={now!} onOpen={setOpen} />
        </div>
      </div>
    )

  return (
    <>
      <AppShell project={project} title="Appointments" actions={nav} main={main} settings={panel} />
      <BookingDialog
        booking={open}
        onClose={() => setOpen(null)}
        onConfirm={(b) => {
          setChanges((c) => ({ ...c, [b.id]: "confirmed" }))
          setOpen(null)
        }}
        onCancel={(b) => {
          setChanges((c) => ({ ...c, [b.id]: "cancelled" }))
          setOpen(null)
        }}
      />
    </>
  )
}

