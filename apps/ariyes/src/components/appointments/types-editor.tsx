"use client"

import { Plus, Trash2 } from "lucide-react"
import { Select } from "@gogetspace/baseplate"
import { TYPE_LENGTHS, formatLength, type BookingType } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"

const LENGTHS = TYPE_LENGTHS.map((m) => ({ value: String(m), label: formatLength(m) }))

export const typesValid = (types: BookingType[]) => types.length > 0 && types.every((t) => t.name.trim())

/** what people can book, one row each: a name and how long it takes in the calendar */
export function TypesEditor({ value, onChange }: { value: BookingType[]; onChange: (v: BookingType[]) => void }) {
  const set = (id: string, patch: Partial<BookingType>) => onChange(value.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ul className="flex min-w-0 flex-col gap-2">
        {value.map((t, i) => (
          <li key={t.id} className="flex min-w-0 items-center gap-2">
            <input
              aria-label={`Booking type ${i + 1}`}
              value={t.name}
              placeholder="e.g. Consultation"
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
              <Trash2 aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...value, { id: `t${Date.now()}`, name: "", minutes: 30 }])}
        className="flex w-fit items-center gap-1.5 rounded-sm px-1 py-1 type-label-md text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring"
      >
        <Plus aria-hidden className="size-4" /> Add a booking type
      </button>
    </div>
  )
}
