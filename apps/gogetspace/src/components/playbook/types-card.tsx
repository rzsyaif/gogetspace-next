"use client"

import { useState } from "react"
import { ArrowUpRight, ListChecks, Plus, Trash2 } from "lucide-react"
import { Button, Select } from "@gogetspace/baseplate"
import { TYPE_LENGTHS, describeTypes, formatLength, type BookingType } from "@gogetspace/modules"
import { SUGGESTED_TYPES } from "@gogetspace/modules/mock"
import type { GenState, Msg } from "@/lib/generation/state"
import { moduleById } from "@/lib/playbooks/engine"
import { useGen } from "@/components/generate/gen-provider"
import { useEditorSiteMaybe } from "@/components/generate/editor-site"
import { Shell } from "@/components/generate/question-series"
import { ariyesUrl } from "@/lib/ariyes"
import { cn } from "@gogetspace/baseplate/cn"

const LENGTHS = TYPE_LENGTHS.map((m) => ({ value: String(m), label: formatLength(m) }))

/** the agent's list from the site's services (mocked per kind of business) */
export const suggestedTypes = (s: Pick<GenState, "niche">) => SUGGESTED_TYPES[s.niche ?? "general"]

/** the types people can book, one row each: a name and how long it takes */
function TypesEditor({ value, onChange }: { value: BookingType[]; onChange: (v: BookingType[]) => void }) {
  const set = (id: string, patch: Partial<BookingType>) => onChange(value.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ul className="flex min-w-0 flex-col gap-2">
        {value.map((t, i) => (
          <li key={t.id} className="flex min-w-0 items-center gap-2">
            <input
              aria-label={`Booking type ${i + 1}`}
              value={t.name}
              placeholder="e.g. Check-up"
              maxLength={80}
              onChange={(e) => set(t.id, { name: e.target.value })}
              className={cn(
                "h-10 min-w-0 flex-1 rounded-md border bg-surface px-3 type-body-md text-fg-primary outline-none placeholder:text-fg-tertiary focus:border-blue-500",
                t.name.trim() ? "border-line-strong" : "border-status-error-solid",
              )}
            />
            <Select ariaLabel={`${t.name || "Booking type"} length`} value={String(t.minutes)} options={LENGTHS} onValueChange={(v) => set(t.id, { minutes: Number(v) })} className="h-10 w-[6.75rem] shrink-0 px-3" />
            <button
              type="button"
              aria-label={`Remove ${t.name || "this booking type"}`}
              disabled={value.length === 1}
              onClick={() => onChange(value.filter((x) => x.id !== t.id))}
              className="grid size-8 shrink-0 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...value, { id: `t${Date.now()}`, name: "", minutes: 30 }])}
        className="flex w-fit items-center gap-1.5 rounded-sm px-1 py-1 type-label-md text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring"
      >
        <Plus className="size-4" /> Add a booking type
      </button>
    </div>
  )
}

/**
 * Appointments' second setup question, right after availability: what people can book. The agent fills the list
 * from the site's services; the owner checks names and lengths. Skipping keeps the list (changeable in Ariyes).
 */
export function TypesCard({ m, compact }: { m: Extract<Msg, { type: "pb-types" }>; compact?: boolean }) {
  const { s, dispatch } = useGen()
  const editor = useEditorSiteMaybe()
  const name = moduleById(m.module).name
  const current = s.bookingTypes ?? suggestedTypes(s)
  const [draft, setDraft] = useState<BookingType[]>(current)
  const valid = draft.length > 0 && draft.every((t) => t.name.trim())
  const link = ariyesUrl(editor?.site.id ?? "new-site", m.module, { hours: s.hours, types: s.bookingTypes })

  if (m.answer) {
    return (
      <div data-types-card className={cn("flex items-start gap-3 rounded-[16px] border border-line-default bg-surface p-4", !compact && "sm:mr-20")}>
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-blue-subtle text-fg-link">
          <ListChecks className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-label-md text-fg-primary">What people can book</p>
          <p className="type-body-sm text-fg-secondary">
            {describeTypes(current, 4)}
            {m.answer === "skipped" && !s.bookingTypes && " (my suggestions)"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "reopenTypes", id: m.id })}>
              Change
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
    <div data-types-card>
      <Shell
        compact={compact}
        counter="2 / 2"
        title={`Set up ${name}`}
        help="I made this list from the services on your website. Each booking takes up its length in your calendar."
        description="These come from your services. Rename, remove or add, and set how long each one takes."
        question="What can people book?"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => dispatch({ type: "skipTypes", id: m.id })}>
              <span className="sm:hidden">Later</span>
              <span className="max-sm:hidden">Keep your list for now</span>
            </Button>
            <Button disabled={!valid} onClick={() => dispatch({ type: "setTypes", id: m.id, types: draft.map((t) => ({ ...t, name: t.name.trim() })) })}>
              Use these
            </Button>
          </div>
        }
      >
        <TypesEditor value={draft} onChange={setDraft} />
      </Shell>
    </div>
  )
}
