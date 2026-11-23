"use client"

import { useState, type ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, CopyField, Select, Switch } from "@gogetspace/baseplate"
import { HOURS_PRESETS, describeTypes, describeWeek, type AppointmentSettings, type ReminderSettings, type WeekHours } from "@gogetspace/modules"
import { TypesEditor, typesValid } from "./types-editor"
import { WeekEditor, weekValid } from "./week-editor"

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

const labelOf = (list: { value: string; label: string }[], v: number) => list.find((o) => o.value === String(v))?.label ?? String(v)

function remindersSummary(r: ReminderSettings) {
  const how = [r.email && "Email", r.sms && "text"].filter(Boolean).join(" and ")
  const parts = [r.confirmation && "Confirmation email", how && `${how.charAt(0).toUpperCase()}${how.slice(1)} reminder ${labelOf(BEFORE, r.hoursBefore).toLowerCase()}`]
  return parts.filter(Boolean).join(" · ") || "Off"
}

const NOTICE_TEXT: Record<number, string> = { 0: "No minimum notice", 1: "1 hour's notice", 2: "2 hours' notice", 24: "1 day's notice" }
const rulesSummary = (v: Rules) => `${labelOf(SLOTS, v.slotMinutes)} · ${NOTICE_TEXT[v.noticeHours] ?? `${v.noticeHours} hours' notice`} · up to ${v.daysAhead} days ahead`

type Rules = Pick<AppointmentSettings, "slotMinutes" | "noticeHours" | "daysAhead">
type SectionId = "hours" | "types" | "reminders" | "rules" | "page"

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="type-body-md text-fg-primary">{label}</span>
      <div className="w-44 shrink-0 [&_button]:h-10 [&_button]:px-3">{children}</div>
    </div>
  )
}

/** one setting: title and a summary of what's set; opens to edit it, and nothing changes until its CTA is pressed */
function Section({
  id,
  title,
  summary,
  dirty,
  children,
  cta,
  canSave = true,
  onSave,
  onCancel,
}: {
  id: SectionId
  title: string
  summary: string
  dirty?: boolean
  children: ReactNode
  /** e.g. "Update availability"; leave out for a section with nothing to save */
  cta?: string
  /** whether the CTA is enabled: usually "changed and valid" */
  canSave?: boolean
  onSave?: () => void
  onCancel?: () => void
}) {
  return (
    <AccordionItem value={id} className="rounded-none border-0 border-b border-line-default bg-transparent">
      <AccordionTrigger className="px-5 py-4 hover:bg-subtle/60">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="type-label-lg text-fg-primary">{title}</span>
          <span className="type-body-sm font-normal text-fg-secondary">
            {dirty ? <span className="text-status-warning-text">Unsaved changes</span> : summary}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 border-t-0 px-5 pt-1 pb-5 sm:px-5 sm:pt-1 sm:pb-5">
        {children}
        {cta && (
          <div className="flex items-center justify-end gap-2">
            {dirty && (
              <Button size="sm" variant="ghost" onClick={onCancel}>
                Discard
              </Button>
            )}
            <Button size="sm" disabled={!canSave} onClick={onSave}>
              {cta}
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * The right-hand column of Appointments, as accordions: availability, what can be booked, reminders, booking rules and
 * the booking page. Each section edits a draft and applies it with its own button, so half-finished edits never reach
 * the calendar or the booking page. A real app saves on that button.
 */
export function SettingsPanel({ value, onSave }: { value: AppointmentSettings; onSave: (next: AppointmentSettings, message: string) => void }) {
  const [open, setOpen] = useState<string>("")
  // drafts survive closing a section, so switching sections doesn't lose edits
  const [hours, setHours] = useState<WeekHours>(value.hours ?? HOURS_PRESETS[0].week)
  const [types, setTypes] = useState(value.types)
  const [reminders, setReminders] = useState(value.reminders)
  const rulesOf = (v: AppointmentSettings): Rules => ({ slotMinutes: v.slotMinutes, noticeHours: v.noticeHours, daysAhead: v.daysAhead })
  const [rules, setRules] = useState<Rules>(rulesOf(value))

  // a section that isn't being edited follows the saved value (e.g. after an undo, or setup in the main view)
  const [saved, setSaved] = useState(value)
  if (saved !== value) {
    setSaved(value)
    if (same(hours, saved.hours ?? HOURS_PRESETS[0].week)) setHours(value.hours ?? HOURS_PRESETS[0].week)
    if (same(types, saved.types)) setTypes(value.types)
    if (same(reminders, saved.reminders)) setReminders(value.reminders)
    if (same(rules, rulesOf(saved))) setRules(rulesOf(value))
  }

  const dirty = {
    hours: value.hours ? !same(hours, value.hours) : false,
    types: !same(types, value.types),
    reminders: !same(reminders, value.reminders),
    rules: !same(rules, rulesOf(value)),
  }
  const save = (next: Partial<AppointmentSettings>, message: string) => {
    onSave({ ...value, ...next }, message)
    setOpen("")
  }
  const r = reminders

  return (
    <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="flex flex-col">
      <Section
        id="hours"
        title="Availability"
        summary={value.hours ? describeWeek(value.hours) : "Not set yet. People can't book until you add it."}
        dirty={dirty.hours}
        cta={value.hours ? "Update availability" : "Set availability"}
        canSave={weekValid(hours) && (!value.hours || dirty.hours)}
        onSave={() => save({ hours }, "Availability updated")}
        onCancel={() => setHours(value.hours ?? HOURS_PRESETS[0].week)}
      >
        <WeekEditor value={hours} onChange={setHours} />
      </Section>

      <Section
        id="types"
        title="What people can book"
        summary={describeTypes(value.types, 2)}
        dirty={dirty.types}
        cta="Update booking types"
        canSave={dirty.types && typesValid(types)}
        onSave={() => save({ types: types.map((t) => ({ ...t, name: t.name.trim() })) }, "Booking types updated")}
        onCancel={() => setTypes(value.types)}
      >
        <p className="type-body-sm text-fg-secondary">The length decides how much of your availability each booking takes.</p>
        <TypesEditor value={types} onChange={setTypes} />
      </Section>

      <Section
        id="reminders"
        title="Reminders"
        summary={remindersSummary(value.reminders)}
        dirty={dirty.reminders}
        cta="Update reminders"
        canSave={dirty.reminders}
        onSave={() => save({ reminders }, "Reminders updated")}
        onCancel={() => setReminders(value.reminders)}
      >
        <p className="type-body-sm text-fg-secondary">Sent for you, in your business&apos;s name.</p>
        <Switch label="Confirmation email when someone books" checked={r.confirmation} onCheckedChange={(on) => setReminders({ ...r, confirmation: on })} />
        <Switch label="Email reminder" checked={r.email} onCheckedChange={(on) => setReminders({ ...r, email: on })} />
        <Switch label="Text message reminder" checked={r.sms} onCheckedChange={(on) => setReminders({ ...r, sms: on })} />
        {(r.email || r.sms) && (
          <Labeled label="Send reminders">
            <Select ariaLabel="When reminders go out" value={String(r.hoursBefore)} options={BEFORE} onValueChange={(v) => setReminders({ ...r, hoursBefore: Number(v) })} />
          </Labeled>
        )}
      </Section>

      <Section
        id="rules"
        title="Booking rules"
        summary={rulesSummary(rulesOf(value))}
        dirty={dirty.rules}
        cta="Update booking rules"
        canSave={dirty.rules}
        onSave={() => save(rules, "Booking rules updated")}
        onCancel={() => setRules(rulesOf(value))}
      >
        <Labeled label="Start times">
          <Select ariaLabel="Start times" value={String(rules.slotMinutes)} options={SLOTS} onValueChange={(v) => setRules({ ...rules, slotMinutes: Number(v) })} />
        </Labeled>
        <Labeled label="Minimum notice">
          <Select ariaLabel="Minimum notice" value={String(rules.noticeHours)} options={NOTICE} onValueChange={(v) => setRules({ ...rules, noticeHours: Number(v) })} />
        </Labeled>
        <Labeled label="Book up to">
          <Select ariaLabel="How far ahead people can book" value={String(rules.daysAhead)} options={AHEAD} onValueChange={(v) => setRules({ ...rules, daysAhead: Number(v) })} />
        </Labeled>
      </Section>

      <Section id="page" title="Booking page" summary={value.bookingUrl.replace(/^https?:\/\//, "")}>
        <p className="type-body-sm text-fg-secondary">On your website. Share it anywhere people can find you.</p>
        <CopyField label="Booking page link" value={value.bookingUrl} />
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" trailingIcon={<ArrowUpRight />} asChild>
            <a href={value.bookingUrl} target="_blank" rel="noreferrer">
              Open booking page
            </a>
          </Button>
        </div>
      </Section>
    </Accordion>
  )
}
