"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CalendarClock, CalendarSync, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge, Button, Dialog, DialogContent, IconButton, RadioCard, Select, Toast } from "@gogetspace/baseplate"
import { HOURS_PRESETS, WEEKDAYS_SHORT, describeWeek, formatTime, fromMinutes, toMinutes, type AppointmentSettings, type Booking, type Project, type WeekHours } from "@gogetspace/modules"
import { isoDate, weekBookings } from "@gogetspace/modules/mock"
import { cn } from "@gogetspace/baseplate/cn"
import { AppShell } from "../app-shell"
import { useMedia, useMounted } from "../use-media"
import { Legend, WeekCalendar } from "./week-calendar"
import { SettingsPanel } from "./settings-panel"
import { WeekEditor, weekValid } from "./week-editor"

const mondayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const fromIso = (iso: string) => new Date(`${iso}T00:00`)
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", o)
const endOf = (b: Pick<Booking, "start" | "minutes">) => fromMinutes(toMinutes(b.start) + b.minutes)
/** "Fri 20 Nov, 2pm" */
const when = (date: string, start: string) => {
  const d = fromIso(date)
  return `${fmt(d, { weekday: "short" })} ${d.getDate()} ${fmt(d, { month: "short" })}, ${formatTime(start)}`
}

/** "17 – 23 November 2026", "28 Nov – 4 Dec 2026" */
function rangeLabel(a: Date, b: Date) {
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${fmt(b, { day: "numeric", month: "long", year: "numeric" })}`
  return `${fmt(a, { day: "numeric", month: "short" })} – ${fmt(b, { day: "numeric", month: "short", year: "numeric" })}`
}

/** first visit without availability: the one question the GoGetSpace chat would have asked */
function AvailabilityOnboarding({ onSave }: { onSave: (w: WeekHours) => void }) {
  const [pick, setPick] = useState<string>(HOURS_PRESETS[0].id)
  const [custom, setCustom] = useState<WeekHours>(HOURS_PRESETS[0].week)
  const week = pick === "custom" ? custom : HOURS_PRESETS.find((p) => p.id === pick)!.week
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-10 sm:py-14">
        <div className="flex flex-col gap-3">
          <span aria-hidden className="grid size-12 place-items-center rounded-lg bg-accent-blue-subtle text-fg-link">
            <CalendarClock className="size-6" strokeWidth={1.5} />
          </span>
          <h2 className="type-h3 text-fg-primary">When can people book you?</h2>
          <p className="type-body-md text-fg-secondary">
            Everything else is set up: booking types from your services, confirmations and reminders. Your booking page opens as soon as it knows your availability.
          </p>
        </div>
        <div role="radiogroup" aria-label="Availability" className="flex flex-col gap-2">
          {HOURS_PRESETS.map((p) => (
            <RadioCard key={p.id} name="hours" checked={pick === p.id} onChange={() => setPick(p.id)} title={p.label} description={describeWeek(p.week)} />
          ))}
          <RadioCard name="hours" checked={pick === "custom"} onChange={() => setPick("custom")} title="Set my own availability">
            {pick === "custom" ? <WeekEditor value={custom} onChange={setCustom} /> : null}
          </RadioCard>
        </div>
        <Button disabled={!weekValid(week)} onClick={() => onSave(week)} className="self-start">
          Open my booking page
        </Button>
      </div>
    </div>
  )
}

/** pick a new day and a free start time for a booking */
function Reschedule({
  booking,
  days,
  slots,
  onBack,
  onMove,
}: {
  booking: Booking
  /** dates (ISO) that have at least one free start time */
  days: string[]
  slots: (date: string) => string[]
  onBack: () => void
  onMove: (date: string, start: string) => void
}) {
  const [date, setDate] = useState(days.includes(booking.date) ? booking.date : (days[0] ?? ""))
  const times = date ? slots(date) : []
  const firstFree = (d: string, list: string[]) => list.find((t) => d !== booking.date || t !== booking.start) ?? ""
  const [start, setStart] = useState(firstFree(date, times))
  const pickDate = (d: string) => {
    setDate(d)
    setStart(firstFree(d, slots(d)))
  }
  return (
    <DialogContent
      title={`Reschedule ${booking.name}`}
      description={`${booking.type}, now ${when(booking.date, booking.start)}. They get an email with the new time.`}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between [&>*]:max-sm:w-full">
          <Button variant="ghost" leadingIcon={<ArrowLeft />} onClick={onBack}>
            Back
          </Button>
          <Button disabled={!date || !start} onClick={() => onMove(date, start)}>
            Move booking
          </Button>
        </div>
      }
    >
      {days.length ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="type-label-md text-fg-primary">Day</span>
            <Select ariaLabel="Day" value={date} onValueChange={pickDate} options={days.map((d) => ({ value: d, label: fmt(fromIso(d), { weekday: "long", day: "numeric", month: "long" }) }))} />
          </label>
          <div className="flex flex-col gap-1.5">
            <span id="reschedule-time" className="type-label-md text-fg-primary">
              Time
            </span>
            {/* free start times as chips: quicker to scan than a long list */}
            <div role="radiogroup" aria-labelledby="reschedule-time" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {times.map((t) => {
                const current = date === booking.date && t === booking.start
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={start === t}
                    disabled={current}
                    onClick={() => setStart(t)}
                    className={cn(
                      "h-10 rounded-md border type-label-md tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:focus-ring disabled:cursor-default disabled:opacity-40",
                      start === t ? "border-blue-500 bg-accent-blue-subtle text-fg-link" : "border-line-default text-fg-primary hover:border-line-strong",
                    )}
                    title={current ? "Its current time" : undefined}
                  >
                    {formatTime(t)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="type-body-md text-fg-secondary">There&apos;s no free time in the next few weeks. Add more availability in the settings, then try again.</p>
      )}
    </DialogContent>
  )
}

interface BookingActions {
  freeDays: (b: Booking) => string[]
  freeSlots: (b: Booking, date: string) => string[]
  onClose: () => void
  onConfirm: (b: Booking) => void
  onCancel: (b: Booking) => void
  onMove: (b: Booking, date: string, start: string) => void
}

/** one booking's details, or its reschedule step */
function BookingBody({ b, freeDays, freeSlots, onClose, onConfirm, onCancel, onMove }: BookingActions & { b: Booking }) {
  const [moving, setMoving] = useState(false)
  if (moving) return <Reschedule booking={b} days={freeDays(b)} slots={(d) => freeSlots(b, d)} onBack={() => setMoving(false)} onMove={(d, s) => onMove(b, d, s)} />
  return (
    <DialogContent
      title={b.name}
      description={`${b.type} · ${fmt(fromIso(b.date), { weekday: "long", day: "numeric", month: "long" })}, ${formatTime(b.start)}–${formatTime(endOf(b))}`}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center [&>*]:max-sm:w-full">
          <Button variant="ghost" onClick={() => onCancel(b)} className="sm:mr-auto">
            Cancel booking
          </Button>
          <Button variant="secondary" leadingIcon={<CalendarSync />} onClick={() => setMoving(true)}>
            Reschedule
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
        <p className="type-body-md text-fg-secondary">
          They get a confirmation email, and a reminder before the appointment. Rescheduling or cancelling lets them know. You can also drag a booking to a new time in the calendar.
        </p>
      </div>
    </DialogContent>
  )
}

/** a booking's details, with the actions an owner takes on it: confirm, reschedule, cancel */
function BookingDialog({ booking, ...actions }: BookingActions & { booking: Booking | null }) {
  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && actions.onClose()}>
      {/* keyed, so each booking opens on its details rather than a previous reschedule step */}
      {booking && <BookingBody key={booking.id + booking.date + booking.start} b={booking} {...actions} />}
    </Dialog>
  )
}

/** what the owner changed: a booking's new version, or that it was cancelled. A real app saves each change. */
type Edits = Record<string, Booking | "cancelled">

/**
 * Ariyes › Appointments: the week's calendar in the middle, the settings on the right. With no availability yet
 * (skipped in the GoGetSpace chat) it asks for it first. Edits are local to the prototype.
 */
export function AppointmentsApp({ project, initial }: { project: Project; initial: AppointmentSettings }) {
  const [settings, setSettings] = useState(initial)
  const [offset, setOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState<number | null>(null)
  const [open, setOpen] = useState<Booking | null>(null)
  const [edits, setEdits] = useState<Edits>({})
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null)
  const mounted = useMounted()
  const narrow = useMedia("(max-width: 767px)")

  // dates come from the viewer's clock, so the calendar draws in the browser only
  const now = useMemo(() => (mounted ? new Date() : null), [mounted])
  const monday = now ? addDays(mondayOf(now), offset * 7) : null
  const week = monday ? Array.from({ length: 7 }, (_, i) => addDays(monday, i)) : []
  const todayIdx = now && offset === 0 ? (now.getDay() + 6) % 7 : 0
  const day = dayIndex ?? todayIdx
  const hours = settings.hours

  /** the bookings in the week starting `mon`, with the owner's edits applied */
  const inWeek = (mon: Date) => {
    if (!hours || !now) return []
    const dates = new Set(Array.from({ length: 7 }, (_, i) => isoDate(addDays(mon, i))))
    const moved = Object.values(edits).filter((e): e is Booking => e !== "cancelled" && dates.has(e.date))
    return [...weekBookings(project.id, mon, hours, now).filter((b) => !(b.id in edits)), ...moved]
  }
  const bookings = monday ? inWeek(monday) : []
  const pending = bookings.filter((b) => b.status === "pending").length

  /** can `b` start at `start` on `date`: inside availability, not in the past, and not overlapping another booking */
  const canPlace = (b: Booking, date: string, start: string) => {
    if (!hours || !now) return false
    const from = toMinutes(start)
    const to = from + b.minutes
    const d = fromIso(date)
    if (!hours[(d.getDay() + 6) % 7].some((s) => toMinutes(s.start) <= from && to <= toMinutes(s.end))) return false
    if (new Date(`${date}T${start}`) <= now) return false
    return !inWeek(mondayOf(d)).some((o) => o.id !== b.id && o.date === date && toMinutes(o.start) < to && from < toMinutes(o.start) + o.minutes)
  }
  const freeSlots = (b: Booking, date: string) => {
    if (!hours) return []
    const shifts = hours[(fromIso(date).getDay() + 6) % 7]
    const out: string[] = []
    for (const s of shifts) for (let t = toMinutes(s.start); t + b.minutes <= toMinutes(s.end); t += settings.slotMinutes) if (canPlace(b, date, fromMinutes(t)) || (date === b.date && fromMinutes(t) === b.start)) out.push(fromMinutes(t))
    return out.sort()
  }
  const freeDays = (b: Booking) => {
    if (!now) return []
    const ahead = Math.min(settings.daysAhead, 28)
    return Array.from({ length: ahead }, (_, i) => isoDate(addDays(now, i))).filter((d) => freeSlots(b, d).some((t) => d !== b.date || t !== b.start))
  }

  const edit = (b: Booking, next: Booking | "cancelled", message: string) => {
    const before = edits[b.id]
    setEdits((e) => ({ ...e, [b.id]: next }))
    setToast({
      message,
      undo: () =>
        setEdits((e) => {
          const rest = { ...e }
          delete rest[b.id]
          return before ? { ...rest, [b.id]: before } : rest
        }),
    })
  }
  const move = (b: Booking, date: string, start: string) => {
    edit(b, { ...b, date, start }, `Moved ${b.name} to ${when(date, start)}`)
    setOpen(null)
  }

  // toasts leave on their own
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const panel = <SettingsPanel value={settings} onChange={setSettings} />
  const nav = monday && hours && (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setOffset(0)
          setDayIndex(null)
        }}
      >
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
  if (!mounted || !now) main = null
  else if (!hours) main = <AvailabilityOnboarding onSave={(h) => setSettings((s) => ({ ...s, hours: h }))} />
  else
    main = (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-default bg-surface px-4 py-2 sm:px-5">
          <p className="type-body-sm text-fg-secondary">
            <span className="font-medium text-fg-primary">{bookings.length} booked</span> this week
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
          <WeekCalendar
            key={`${offset}-${narrow ? day : "w"}`}
            days={narrow ? [week[day]] : week}
            hours={hours}
            bookings={bookings}
            now={now}
            snap={settings.slotMinutes}
            canPlace={canPlace}
            onOpen={setOpen}
            onMove={move}
          />
        </div>
      </div>
    )

  return (
    <>
      <AppShell project={project} title="Appointments" actions={nav} main={main} settings={panel} />
      <BookingDialog
        booking={open}
        freeDays={freeDays}
        freeSlots={freeSlots}
        onClose={() => setOpen(null)}
        onConfirm={(b) => {
          edit(b, { ...b, status: "confirmed" }, `Confirmed ${b.name}'s booking`)
          setOpen(null)
        }}
        onCancel={(b) => {
          edit(b, "cancelled", `Cancelled ${b.name}'s booking`)
          setOpen(null)
        }}
        onMove={move}
      />
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <Toast
            key={toast.message}
            message={toast.message}
            action={
              toast.undo
                ? {
                    label: "Undo",
                    onClick: () => {
                      toast.undo!()
                      setToast(null)
                    },
                  }
                : undefined
            }
            className="pointer-events-auto transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0"
          />
        )}
      </div>
    </>
  )
}
