"use client"

import { useState, type ReactNode } from "react"
import { Plus, Trash2 } from "lucide-react"
import { CopyField, Select, Switch } from "@gogetspace/baseplate"
import { describeWeek, type AppointmentSettings, type BookingType } from "@gogetspace/modules"
import { WeekEditor } from "./week-editor"

const length = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`)
const DURATIONS = [15, 30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: length(m) }))
const BEFORE = [
  { value: "1", label: "1 hour before" },
  { value: "2", label: "2 hours before" },
  { value: "24", label: "The day before" },
  { value: "48", label: "2 days before" },
]
const SLOTS = [10, 15, 20, 30, 60].map((m) => ({ value: String(m), label: `Every ${m} min` }))
const NOTICE = [
  { value: "0", label: "No minimum" },
  { value: "1", label: "1 hour" },
  { value: "2", label: "2 hours" },
  { value: "24", label: "1 day" },
]
const AHEAD = [14, 30, 60, 90].map((d) => ({ value: String(d), label: `${d} days` }))

function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line-default px-5 py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="type-label-lg text-fg-primary">{title}</h2>
          {description && <p className="type-body-sm text-fg-secondary">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="type-body-md text-fg-primary">{label}</span>
      <div className="w-44 shrink-0 [&_button]:h-10 [&_button]:px-3">{children}</div>
    </div>
  )
}

/**
 * The right-hand column of Appointments: availability, what can be booked, reminders, booking rules and the public
 * booking page. Changes apply at once (the calendar redraws); a real app saves each one.
 */
export function SettingsPanel({ value, onChange }: { value: AppointmentSettings; onChange: (v: AppointmentSettings) => void }) {
  const set = <K extends keyof AppointmentSettings>(k: K, v: AppointmentSettings[K]) => onChange({ ...value, [k]: v })
  const setType = (id: string, patch: Partial<BookingType>) => set("types", value.types.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const r = value.reminders
  const [editHours, setEditHours] = useState(false)

  return (
    <div className="flex flex-col">
      <Section
        title="Availability"
        description={value.hours ? describeWeek(value.hours) : "Not set yet. People can't book until you add when you're available."}
        action={
          value.hours && (
            <button
              type="button"
              aria-expanded={editHours}
              onClick={() => setEditHours((o) => !o)}
              className="shrink-0 rounded-sm px-1 py-0.5 type-label-md text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring"
            >
              {editHours ? "Done" : "Edit"}
            </button>
          )
        }
      >
        {value.hours && editHours && <WeekEditor value={value.hours} onChange={(h) => set("hours", h)} />}
      </Section>

      <Section title="What people can book" description="Set from your services. The length decides how much of your availability each booking takes.">
        <ul className="flex flex-col gap-2">
          {value.types.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`type-${t.id}`}>
                Name
              </label>
              <input
                id={`type-${t.id}`}
                value={t.name}
                onChange={(e) => setType(t.id, { name: e.target.value })}
                className="h-10 min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-3 type-body-md text-fg-primary outline-none focus:border-blue-500"
              />
              <Select ariaLabel={`${t.name} length`} value={String(t.minutes)} options={DURATIONS} onValueChange={(v) => setType(t.id, { minutes: Number(v) })} className="h-10 w-[7.5rem] shrink-0 px-3" />
              <button
                type="button"
                aria-label={`Remove ${t.name}`}
                onClick={() => set("types", value.types.filter((x) => x.id !== t.id))}
                className="grid size-8 shrink-0 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => set("types", [...value.types, { id: `t${Date.now()}`, name: "New appointment", minutes: 30 }])}
          className="flex w-fit items-center gap-1.5 rounded-sm px-1 py-1 type-label-md text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring"
        >
          <Plus aria-hidden className="size-4" /> Add a booking type
        </button>
      </Section>

      <Section title="Reminders" description="Sent for you, in your business's name.">
        <Switch label="Confirmation email when someone books" checked={r.confirmation} onCheckedChange={(on) => set("reminders", { ...r, confirmation: on })} />
        <Switch label="Email reminder" checked={r.email} onCheckedChange={(on) => set("reminders", { ...r, email: on })} />
        <Switch label="Text message reminder" checked={r.sms} onCheckedChange={(on) => set("reminders", { ...r, sms: on })} />
        {(r.email || r.sms) && (
          <Labeled label="Send reminders">
            <Select ariaLabel="When reminders go out" value={String(r.hoursBefore)} options={BEFORE} onValueChange={(v) => set("reminders", { ...r, hoursBefore: Number(v) })} />
          </Labeled>
        )}
      </Section>

      <Section title="Booking rules">
        <Labeled label="Start times">
          <Select ariaLabel="Start times" value={String(value.slotMinutes)} options={SLOTS} onValueChange={(v) => set("slotMinutes", Number(v))} />
        </Labeled>
        <Labeled label="Minimum notice">
          <Select ariaLabel="Minimum notice" value={String(value.noticeHours)} options={NOTICE} onValueChange={(v) => set("noticeHours", Number(v))} />
        </Labeled>
        <Labeled label="Book up to">
          <Select ariaLabel="How far ahead people can book" value={String(value.daysAhead)} options={AHEAD} onValueChange={(v) => set("daysAhead", Number(v))} />
        </Labeled>
      </Section>

      <Section title="Booking page" description="On your website. Share it anywhere people can find you.">
        <CopyField label="Booking page link" value={value.bookingUrl} />
      </Section>
    </div>
  )
}
