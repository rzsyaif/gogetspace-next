"use client"

import { useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Select, Switch } from "@gogetspace/baseplate"
import type { CrmSettings, CrmStage } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"
import { useCrm } from "./crm-store"
import { CrmBody, CrmHeader } from "./crm-shell"

let stageSeq = 0
/** ids for stages added here (a real app gets them from the server) */
const newStageId = () => `s-new-${++stageSeq}`
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const QUIET = [3, 5, 7, 10, 14].map((d) => ({ value: String(d), label: `After ${d} quiet days` }))

/** one setting, closed to a summary; edits a draft and applies it with its own button (as in Appointments) */
function Section({ id, title, summary, dirty, canSave, cta, onSave, onDiscard, children }: { id: string; title: string; summary: string; dirty: boolean; canSave: boolean; cta: string; onSave: () => void; onDiscard: () => void; children: ReactNode }) {
  return (
    <AccordionItem value={id}>
      <AccordionTrigger className="px-5 py-4">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="type-label-lg text-fg-primary">{title}</span>
          <span className="type-body-sm font-normal text-fg-secondary">{dirty ? <span className="text-status-warning-text">Unsaved changes</span> : summary}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 border-t-0 px-5 pt-1 pb-5 sm:px-5 sm:pt-1 sm:pb-5">
        {children}
        <div className="flex items-center justify-end gap-2">
          {dirty && (
            <Button size="sm" variant="ghost" onClick={onDiscard}>
              Discard
            </Button>
          )}
          <Button size="sm" disabled={!canSave} onClick={onSave}>
            {cta}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

/** rename, reorder, add and remove stages; won and lost stay at the end and can only be renamed */
function StagesEditor({ value, onChange, inUse }: { value: CrmStage[]; onChange: (v: CrmStage[]) => void; inUse: (id: string) => number }) {
  const open = value.filter((s) => s.kind === "open")
  const closed = value.filter((s) => s.kind !== "open")
  const setOpen = (list: CrmStage[]) => onChange([...list, ...closed])
  const addStage = () => setOpen([...open, { id: newStageId(), name: "", kind: "open" }])
  const rename = (id: string, name: string) => onChange(value.map((s) => (s.id === id ? { ...s, name } : s)))
  const move = (i: number, by: number) => {
    const list = [...open]
    const [x] = list.splice(i, 1)
    list.splice(i + by, 0, x)
    setOpen(list)
  }
  const row = (s: CrmStage, i: number | null) => {
    const n = inUse(s.id)
    return (
      <li key={s.id} className="flex items-center gap-2">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", s.kind === "won" ? "bg-status-success-solid" : s.kind === "lost" ? "bg-neutral-400" : "bg-blue-500")} />
        <input
          aria-label={`Stage ${s.name || "name"}`}
          value={s.name}
          maxLength={40}
          onChange={(e) => rename(s.id, e.target.value)}
          className={cn("h-10 min-w-0 flex-1 rounded-md border bg-surface px-3 type-body-md text-fg-primary outline-none focus:border-blue-500", s.name.trim() ? "border-line-strong" : "border-status-error-solid")}
        />
        {i !== null ? (
          <span className="flex shrink-0">
            {[
              { by: -1, Icon: ArrowUp, label: "up", off: i === 0 },
              { by: 1, Icon: ArrowDown, label: "down", off: i === open.length - 1 },
            ].map(({ by, Icon, label, off }) => (
              <button key={label} type="button" aria-label={`Move ${s.name} ${label}`} disabled={off} onClick={() => move(i, by)} className="grid size-8 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring disabled:opacity-30">
                <Icon aria-hidden className="size-4" />
              </button>
            ))}
            <button
              type="button"
              aria-label={n ? `${s.name} has ${n} enquiries; move them first` : `Remove ${s.name}`}
              title={n ? `${n} ${n === 1 ? "enquiry is" : "enquiries are"} in this stage. Move them first.` : undefined}
              disabled={n > 0 || open.length === 1}
              onClick={() => setOpen(open.filter((x) => x.id !== s.id))}
              className="grid size-8 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring disabled:opacity-30"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </span>
        ) : (
          <span className="w-24 shrink-0 text-right type-caption text-fg-tertiary">{s.kind === "won" ? "Became a client" : "Didn't go ahead"}</span>
        )}
      </li>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">{open.map((s, i) => row(s, i))}</ul>
      <button type="button" onClick={addStage} className="flex w-fit items-center gap-1.5 rounded-sm px-1 py-1 type-label-md text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
        <Plus aria-hidden className="size-4" /> Add a stage
      </button>
      <ul className="flex flex-col gap-2 border-t border-line-default pt-3">{closed.map((s) => row(s, null))}</ul>
    </div>
  )
}

/** CRM settings: stages, follow-up reminders, companies, and where new enquiries come from */
export function CrmSettingsPage() {
  const { data, saveSettings } = useCrm()
  if (!data) return <CrmHeader title="Settings" />
  return <SettingsForm key={JSON.stringify(data.settings)} value={data.settings} inUse={(id) => data.enquiries.filter((e) => e.stageId === id).length} onSave={saveSettings} />
}

function SettingsForm({ value, inUse, onSave }: { value: CrmSettings; inUse: (id: string) => number; onSave: (s: CrmSettings, message: string) => void }) {
  const [open, setOpen] = useState("")
  const [stages, setStages] = useState(value.stages)
  const [quiet, setQuiet] = useState(value.quietDays)
  const [companies, setCompanies] = useState(value.companies)
  const [auto, setAuto] = useState(value.auto)
  const save = (p: Partial<CrmSettings>, msg: string) => {
    onSave({ ...value, ...p }, msg)
    setOpen("")
  }
  const stagesDirty = !same(stages, value.stages)
  return (
    <>
      <CrmHeader title="Settings" />
      <CrmBody>
        <div className="mx-auto flex max-w-[720px] flex-col gap-3 px-4 py-6 sm:px-6">
          <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="flex flex-col gap-3">
            <Section
              id="stages"
              title="Stages"
              summary={value.stages.map((s) => s.name).join(" → ")}
              dirty={stagesDirty}
              canSave={stagesDirty && stages.every((s) => s.name.trim())}
              cta="Update stages"
              onSave={() => save({ stages: stages.map((s) => ({ ...s, name: s.name.trim() })) }, "Stages updated")}
              onDiscard={() => setStages(value.stages)}
            >
              <p className="type-body-sm text-fg-secondary">The steps an enquiry goes through, in order. Name them the way you talk about them.</p>
              <StagesEditor value={stages} onChange={setStages} inUse={inUse} />
            </Section>

            <Section
              id="quiet"
              title="Follow-up reminders"
              summary={`Flag an enquiry after ${value.quietDays} days with no activity`}
              dirty={quiet !== value.quietDays}
              canSave={quiet !== value.quietDays}
              cta="Update reminders"
              onSave={() => save({ quietDays: quiet }, "Follow-up reminders updated")}
              onDiscard={() => setQuiet(value.quietDays)}
            >
              <p className="type-body-sm text-fg-secondary">An enquiry that goes quiet shows up in Follow up today, so nobody slips through.</p>
              <div className="w-56 [&_button]:h-10 [&_button]:px-3">
                <Select ariaLabel="When to flag a quiet enquiry" value={String(quiet)} options={QUIET} onValueChange={(v) => setQuiet(Number(v))} />
              </div>
            </Section>

            <Section
              id="companies"
              title="Companies"
              summary={value.companies ? "On: clients can belong to a company" : "Off"}
              dirty={companies !== value.companies}
              canSave={companies !== value.companies}
              cta="Update companies"
              onSave={() => save({ companies }, companies ? "Companies turned on" : "Companies turned off")}
              onDiscard={() => setCompanies(value.companies)}
            >
              <p className="type-body-sm text-fg-secondary">Turn this on if some clients come through their employer, a school or another business.</p>
              <Switch label="Group clients by company" checked={companies} onCheckedChange={setCompanies} />
            </Section>

            <Section
              id="sources"
              title="New enquiries"
              summary={[auto.website && "From your website", auto.appointments && "from new bookings"].filter(Boolean).join(" and ") || "Only the ones you add"}
              dirty={!same(auto, value.auto)}
              canSave={!same(auto, value.auto)}
              cta="Update new enquiries"
              onSave={() => save({ auto }, "New enquiries updated")}
              onDiscard={() => setAuto(value.auto)}
            >
              <p className="type-body-sm text-fg-secondary">Where enquiries are added for you. You can always add someone with Add new lead.</p>
              <Switch label="Website contact form" checked={auto.website} onCheckedChange={(on) => setAuto({ ...auto, website: on })} />
              <Switch label="New bookings from people you don't know yet" checked={auto.appointments} onCheckedChange={(on) => setAuto({ ...auto, appointments: on })} />
            </Section>
          </Accordion>
        </div>
      </CrmBody>
    </>
  )
}
