"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, CalendarClock, CalendarSync, Check, ChevronLeft, ChevronRight, ListChecks } from "lucide-react"
import { Alert, Button, Dialog, DialogContent, IconButton, RadioCard, Select, Toast } from "@gogetspace/baseplate"
import { HOURS_PRESETS, WEEKDAYS_SHORT, bookingRef, describeWeek, formatLength, formatTime, fromMinutes, toMinutes, type AppointmentSettings, type Booking, type BookingType, type Project, type WeekHours } from "@gogetspace/modules"
import { keys, useShared } from "@/lib/shared"
import { crmClientByName, crmData, logToCrm } from "@/lib/crm-link"
import { schedule, type Edits } from "./schedule"
import { cn } from "@gogetspace/baseplate/cn"
import { AppShell } from "../app-shell"
import { useMedia, useMounted } from "../use-media"
import { Legend, WeekCalendar } from "./week-calendar"
import { SettingsPanel } from "./settings-panel"
import { TypesEditor, typesValid } from "./types-editor"
import { WeekEditor, weekValid } from "./week-editor"

import { addDays, fromIso, mondayOf } from "./schedule"
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

/**
 * First visit without availability (skipped in the GoGetSpace chat): the chat's two setup questions, one at a time.
 * 1. when people can book, 2. what they can book (prefilled from the site's services).
 */
function SetupOnboarding({ types: suggested, onSave }: { types: BookingType[]; onSave: (w: WeekHours, t: BookingType[]) => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [pick, setPick] = useState<string>(HOURS_PRESETS[0].id)
  const [custom, setCustom] = useState<WeekHours>(HOURS_PRESETS[0].week)
  const [types, setTypes] = useState(suggested)
  const week = pick === "custom" ? custom : HOURS_PRESETS.find((p) => p.id === pick)!.week
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-10 sm:py-14">
        <div className="flex flex-col gap-3">
          <span aria-hidden className="grid size-12 place-items-center rounded-lg bg-accent-blue-subtle text-fg-link">
            {step === 1 ? <CalendarClock className="size-6" strokeWidth={1.5} /> : <ListChecks className="size-6" strokeWidth={1.5} />}
          </span>
          <p className="type-label-md text-fg-tertiary tabular-nums" aria-live="polite">
            Step {step} of 2
          </p>
          <h2 className="type-h3 text-fg-primary">{step === 1 ? "When can people book you?" : "What can people book?"}</h2>
          <p className="type-body-md text-fg-secondary">
            {step === 1
              ? "Two quick questions and your booking page opens. Confirmations and reminders are already set up."
              : "These come from the services on your website. Rename, remove or add, and set how long each one takes in your calendar."}
          </p>
        </div>
        {step === 1 ? (
          <div role="radiogroup" aria-label="Availability" className="flex flex-col gap-2">
            {HOURS_PRESETS.map((p) => (
              <RadioCard key={p.id} name="hours" checked={pick === p.id} onChange={() => setPick(p.id)} title={p.label} description={describeWeek(p.week)} />
            ))}
            <RadioCard name="hours" checked={pick === "custom"} onChange={() => setPick("custom")} title="Set my own availability">
              {pick === "custom" ? <WeekEditor value={custom} onChange={setCustom} /> : null}
            </RadioCard>
          </div>
        ) : (
          <div className="rounded-lg border border-line-default bg-surface p-4">
            <TypesEditor value={types} onChange={setTypes} />
          </div>
        )}
        {step === 1 ? (
          <Button disabled={!weekValid(week)} onClick={() => setStep(2)} className="self-start">
            Next
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" leadingIcon={<ArrowLeft />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button disabled={!typesValid(types)} onClick={() => onSave(week, types.map((t) => ({ ...t, name: t.name.trim() })))}>
              Open my booking page
            </Button>
          </div>
        )}
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
  /** the client's place in the CRM, when they're in it */
  crmOf: (b: Booking) => { href: string; line: string } | null
  freeDays: (b: Booking) => string[]
  freeSlots: (b: Booking, date: string) => string[]
  onClose: () => void
  onConfirm: (b: Booking) => void
  onCancel: (b: Booking) => void
  onMove: (b: Booking, date: string, start: string) => void
}

/** one booking's details, or its reschedule step */
function BookingBody({ b, crmOf, freeDays, freeSlots, onClose, onConfirm, onCancel, onMove }: BookingActions & { b: Booking }) {
  const crm = crmOf(b)
  const [moving, setMoving] = useState(false)
  if (moving) return <Reschedule booking={b} days={freeDays(b)} slots={(d) => freeSlots(b, d)} onBack={() => setMoving(false)} onMove={(d, s) => onMove(b, d, s)} />
  const date = fromIso(b.date)
  const first = b.name.split(" ")[0]
  const pending = b.status === "pending"
  return (
    <DialogContent
      title={b.name}
      description={<span className="type-body-sm text-fg-tertiary tabular-nums">Booking {bookingRef(b.id)}</span>}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center [&>*]:max-sm:w-full">
          <Button variant="ghost" onClick={() => onCancel(b)} className="text-status-error-text sm:mr-auto">
            Cancel booking
          </Button>
          <Button variant="secondary" leadingIcon={<CalendarSync />} onClick={() => setMoving(true)}>
            Reschedule
          </Button>
          {pending ? (
            <Button leadingIcon={<Check />} onClick={() => onConfirm(b)}>
              Confirm
            </Button>
          ) : (
            <Button onClick={onClose}>Done</Button>
          )}
        </div>
      }
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-[auto_auto_1fr]">
        {(
          [
            ["Date", fmt(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }), undefined],
            ["Time", `${formatTime(b.start)} – ${formatTime(endOf(b))}`, formatLength(b.minutes)],
            ["Activity", b.type, undefined],
          ] as const
        ).map(([label, value, sub]) => (
          <div key={label} className={cn("flex min-w-0 flex-col gap-1", label === "Activity" && "max-sm:col-span-2")}>
            <dt className="type-caption text-fg-tertiary">{label}</dt>
            <dd className="type-label-lg text-fg-primary">
              {value}
              {sub && <span className="block type-body-sm font-normal text-fg-secondary">{sub}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {crm && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-line-default px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="type-caption text-fg-tertiary">In your CRM</span>
            <span className="truncate type-body-md text-fg-primary">{crm.line}</span>
          </div>
          <Link href={crm.href} className="flex shrink-0 items-center gap-1 rounded-sm type-label-md text-fg-link hover:underline focus-visible:outline-none focus-visible:focus-ring">
            Open in CRM <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      )}
      <Alert size="sm" tone={pending ? "warning" : "success"} title={pending ? "Waiting for you to confirm" : "Confirmed"}>
        {pending
          ? `${first} booked online. They get a confirmation email once you confirm, then a reminder before the appointment.`
          : `${first} has a confirmation email and gets a reminder before the appointment. Rescheduling or cancelling lets them know.`}
      </Alert>
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

/**
 * Ariyes › Appointments: the week's calendar in the middle, the settings on the right. With no availability yet
 * (skipped in the GoGetSpace chat) it asks for it first. Bookings and settings are shared with the CRM for the tab's session (src/lib/shared.ts).
 */
export function AppointmentsApp({ project, initial }: { project: Project; initial: AppointmentSettings }) {
  // shared with the CRM (its Book button) for the tab's session; a real app reads and saves these on the server
  const [shared, setSettings] = useShared(keys.apptSettings(project.id), () => initial)
  const settings = shared ?? initial
  const [offset, setOffset] = useState(0)
  const [dayIndex, setDayIndex] = useState<number | null>(null)
  const [open, setOpen] = useState<Booking | null>(null)
  const [sharedEdits, setEdits] = useShared<Edits>(keys.bookings(project.id), () => ({}))
  const edits = sharedEdits ?? {}
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

  const sched = now ? schedule(project.id, settings, edits, now) : null
  const bookings = monday && sched ? sched.inWeek(monday) : []
  const pending = bookings.filter((b) => b.status === "pending").length
  const canPlace = (b: Booking, date: string, start: string) => !!sched?.canPlace(b, date, start)
  const freeSlots = (b: Booking, date: string) => sched?.freeSlots(b, date) ?? []
  const freeDays = (b: Booking) => sched?.freeDays(b) ?? []

  const crmOf = (b: Booking) => {
    if (!project.installed.includes("crm")) return null
    const c = crmClientByName(project, b.name)
    if (!c) return null
    const d = crmData(project)
    const es = d.enquiries.filter((e) => e.clientId === c.id)
    const e = es.find((x) => d.settings.stages.find((st) => st.id === x.stageId)?.kind === "open") ?? es[es.length - 1]
    return { href: `/${project.id}/crm?client=${c.id}`, line: e ? `${e.title} · ${d.settings.stages.find((st) => st.id === e.stageId)?.name}` : "Client" }
  }

  /** apply a change, write it to the client's CRM history, and offer Undo for both */
  const edit = (b: Booking, next: Booking | "cancelled", message: string, history: string) => {
    const before = edits[b.id]
    setEdits((e) => ({ ...e, [b.id]: next }))
    const logged = logToCrm(project, b.name, "booking", history)
    setToast({
      message: logged ? `${message} · added to their CRM history` : message,
      undo: () => {
        logged?.undo()
        setEdits((e) => {
          const rest = { ...e }
          delete rest[b.id]
          return before ? { ...rest, [b.id]: before } : rest
        })
      },
    })
  }
  const move = (b: Booking, date: string, start: string) => {
    edit(b, { ...b, date, start }, `Moved ${b.name} to ${when(date, start)}`, `Moved ${b.type} to ${when(date, start)}`)
    setOpen(null)
  }

  // toasts leave on their own
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const panel = (
    <SettingsPanel
      value={settings}
      onSave={(next, message) => {
        const before = settings
        setSettings(next)
        setToast({ message, undo: () => setSettings(before) })
      }}
    />
  )
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
  else if (!hours) main = <SetupOnboarding types={settings.types} onSave={(h, t) => setSettings((s) => ({ ...s, hours: h, types: t }))} />
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
        crmOf={crmOf}
        freeDays={freeDays}
        freeSlots={freeSlots}
        onClose={() => setOpen(null)}
        onConfirm={(b) => {
          edit(b, { ...b, status: "confirmed" }, `Confirmed ${b.name}'s booking`, `Confirmed: ${b.type}, ${when(b.date, b.start)}`)
          setOpen(null)
        }}
        onCancel={(b) => {
          edit(b, "cancelled", `Cancelled ${b.name}'s booking`, `Cancelled: ${b.type}, ${when(b.date, b.start)}`)
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
