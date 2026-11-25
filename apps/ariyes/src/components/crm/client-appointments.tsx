"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, CalendarPlus } from "lucide-react"
import { Button, Dialog, DialogContent, Select } from "@gogetspace/baseplate"
import { formatLength, formatTime, type AppointmentSettings, type Booking, type CrmClient } from "@gogetspace/modules"
import { appointmentDefaults } from "@gogetspace/modules/mock"
import { cn } from "@gogetspace/baseplate/cn"
import { keys, useShared } from "@/lib/shared"
import { logToCrm } from "@/lib/crm-link"
import { fromIso, schedule, type Edits } from "../appointments/schedule"
import { useCrm } from "./crm-store"

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => fromIso(iso).toLocaleDateString("en-GB", o)
const when = (date: string, start: string) => `${fmt(date, { weekday: "short", day: "numeric", month: "short" })}, ${formatTime(start)}`

/** Appointments' settings and bookings as the CRM sees them (shared for the tab's session) */
function useAppointments() {
  const { project, now } = useCrm()
  const [settings] = useShared<AppointmentSettings>(keys.apptSettings(project.id), () => appointmentDefaults(project))
  const [edits, setEdits] = useShared<Edits>(keys.bookings(project.id), () => ({}))
  const sched = useMemo(() => (settings ? schedule(project.id, settings, edits ?? {}, now) : null), [project.id, settings, edits, now])
  return { settings, edits: edits ?? {}, setEdits, sched }
}

/** book a client in, from their CRM details: what, which day, and one of that day's free times */
function BookDialog({ client, open, onOpenChange }: { client: CrmClient; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { project, setToast } = useCrm()
  const { settings, setEdits, sched } = useAppointments()
  const types = settings?.types ?? []
  const [typeId, setTypeId] = useState(types[0]?.id ?? "")
  const type = types.find((t) => t.id === typeId) ?? types[0]
  const probe = { id: "new", minutes: type?.minutes ?? 30 }
  const days = sched && type ? sched.freeDays(probe) : []
  const [date, setDate] = useState("")
  const day = days.includes(date) ? date : (days[0] ?? "")
  const times = sched && day ? sched.freeSlots(probe, day) : []
  const [start, setStart] = useState("")
  const time = times.includes(start) ? start : (times[0] ?? "")

  const book = () => {
    if (!type || !day || !time) return
    const booking: Booking = { id: `crm-${Date.now()}`, date: day, start: time, minutes: type.minutes, name: client.name, type: type.name, status: "confirmed" }
    setEdits((e) => ({ ...e, [booking.id]: booking }))
    const logged = logToCrm(project, client.name, "booking", `Booked: ${type.name}, ${when(day, time)}`)
    setToast({
      message: `Booked ${client.name.split(" ")[0]} for ${when(day, time)}${logged?.movedTo ? ` · moved to ${logged.movedTo}` : ""}`,
      undo: () => {
        logged?.undo()
        setEdits((e) => {
          const rest = { ...e }
          delete rest[booking.id]
          return rest
        })
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent
          title={`Book ${client.name}`}
          description="It goes straight into Appointments, and they get a confirmation email."
          footer={
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button leadingIcon={<CalendarPlus />} disabled={!type || !day || !time} onClick={book}>
                Book
              </Button>
            </div>
          }
        >
          {!settings?.hours ? (
            <p className="type-body-md text-fg-secondary">
              Appointments needs your availability first.{" "}
              <Link href={`/${project.id}/appointments`} className="text-fg-link underline">
                Set it up
              </Link>
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="type-label-md text-fg-primary">What</span>
                <Select ariaLabel="What" value={type?.id ?? ""} onValueChange={setTypeId} options={types.map((t) => ({ value: t.id, label: `${t.name} · ${formatLength(t.minutes)}` }))} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="type-label-md text-fg-primary">Day</span>
                <Select ariaLabel="Day" value={day} onValueChange={setDate} options={days.map((d) => ({ value: d, label: fmt(d, { weekday: "long", day: "numeric", month: "long" }) }))} />
              </label>
              <div className="flex flex-col gap-1.5">
                <span id="book-time" className="type-label-md text-fg-primary">
                  Time
                </span>
                <div role="radiogroup" aria-labelledby="book-time" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {times.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={time === t}
                      onClick={() => setStart(t)}
                      className={cn(
                        "h-10 rounded-md border type-label-md tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:focus-ring",
                        time === t ? "border-blue-500 bg-accent-blue-subtle text-fg-link" : "border-line-default text-fg-primary hover:border-line-strong",
                      )}
                    >
                      {formatTime(t)}
                    </button>
                  ))}
                </div>
                {!times.length && <p className="type-body-sm text-fg-secondary">No free time in the next few weeks.</p>}
              </div>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

/**
 * A client's appointments in their CRM details: what's coming up (from Appointments), and a button to book them in.
 */
export function ClientAppointments({ client }: { client: CrmClient }) {
  const { project } = useCrm()
  const { sched } = useAppointments()
  const [booking, setBooking] = useState(false)
  if (!project.installed.includes("appointments")) return null
  const upcoming = sched ? sched.upcomingFor(client.name).slice(0, 3) : []
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="type-label-lg text-fg-primary">Appointments</h3>
        <Button size="sm" variant="secondary" leadingIcon={<CalendarPlus />} onClick={() => setBooking(true)}>
          Book an appointment
        </Button>
      </div>
      {upcoming.length ? (
        <ul className="divide-y divide-line-default overflow-hidden rounded-lg border border-line-default bg-surface">
          {upcoming.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex w-11 shrink-0 flex-col items-center rounded-md bg-subtle py-1">
                <span className="type-caption text-fg-tertiary">{fmt(b.date, { month: "short" })}</span>
                <span className="type-label-lg text-fg-primary tabular-nums">{fromIso(b.date).getDate()}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate type-label-md text-fg-primary">{b.type}</span>
                <span className="truncate type-body-sm text-fg-secondary">
                  {fmt(b.date, { weekday: "short" })} {formatTime(b.start)} · {b.status === "pending" ? <span className="text-status-warning-text">Waiting for you to confirm</span> : "Confirmed"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body-sm text-fg-secondary">Nothing booked yet.</p>
      )}
      <Link href={`/${project.id}/appointments`} className="flex w-fit items-center gap-1 rounded-sm type-label-md text-fg-link hover:underline focus-visible:outline-none focus-visible:focus-ring">
        Open Appointments <ArrowUpRight aria-hidden className="size-4" />
      </Link>
      {booking && <BookDialog client={client} open={booking} onOpenChange={setBooking} />}
    </section>
  )
}
