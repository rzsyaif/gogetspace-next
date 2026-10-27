"use client"

import { useEffect, useRef, useState } from "react"
import { Popover } from "radix-ui"
import { Check, CircleHelp, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/cn"
import { countAssumptions, resolveGuess, segments, stripBrackets, type BriefSection } from "@/lib/generation/brief"
import { useGen } from "./gen-provider"

let counter = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${counter++}`

/** Editable project brief. Guesses are highlighted chips; the index on the right follows the scroll. */
export function BriefStep() {
  const { s, dispatch } = useGen()
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(s.brief[0]?.id)
  const guesses = countAssumptions(s.brief)
  const sections = [...s.brief.map((b) => ({ id: b.id, title: b.title })), { id: "questions", title: "Open questions" }]

  const set = (brief: BriefSection[]) => dispatch({ type: "editBrief", brief })
  const editItem = (secId: string, itemId: string, text: string | null) =>
    set(
      s.brief.map((sec) =>
        sec.id !== secId
          ? sec
          : { ...sec, items: text === null ? sec.items.filter((i) => i.id !== itemId) : sec.items.map((i) => (i.id === itemId ? { ...i, text } : i)) },
      ),
    )
  const addItem = (secId: string) => {
    const id = uid("item")
    set(s.brief.map((sec) => (sec.id === secId ? { ...sec, items: [...sec.items, { id, text: "" }] } : sec)))
    return id
  }

  // scroll spy
  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(top.target.id.replace("brief-", ""))
      },
      { root, rootMargin: "0px 0px -70% 0px" },
    )
    root.querySelectorAll("[data-brief-section]").forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [s.brief.length])

  return (
    <div className="flex min-h-0 flex-1 gap-9">
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2 pb-10">
        <div
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-md border px-4 py-3",
            guesses ? "border-status-warning-border bg-status-warning-bg" : "border-status-success-border bg-status-success-bg",
          )}
        >
          {guesses ? <Sparkles className="mt-0.5 size-5 shrink-0 text-status-warning-text" /> : <Check className="mt-0.5 size-5 shrink-0 text-status-success-text" />}
          <p className="type-body-sm text-fg-primary">
            {guesses ? (
              <>
                <strong>{guesses} details are my guesses</strong> — they&apos;re <mark className="rounded-[4px] bg-accent-yellow-subtle px-1 text-fg-primary">highlighted</mark>. Click one to confirm or change it.
              </>
            ) : (
              <strong>Every detail is confirmed.</strong>
            )}
          </p>
        </div>

        {s.brief.map((sec) => (
          <section key={sec.id} id={`brief-${sec.id}`} data-brief-section className="flex scroll-mt-4 flex-col gap-2">
            <h3 className="type-h5 text-fg-primary">{sec.title}</h3>
            <ul className="flex flex-col">
              {sec.items.map((it) => (
                <BriefRow key={it.id} text={it.text} onChange={(t) => editItem(sec.id, it.id, t)} />
              ))}
            </ul>
            <button type="button" onClick={() => addItem(sec.id)} className="flex items-center gap-1.5 self-start rounded-sm px-1 py-1 type-body-sm text-fg-tertiary hover:text-fg-link">
              <Plus className="size-4" /> Add a point
            </button>
          </section>
        ))}

        <section id="brief-questions" data-brief-section className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 type-h5 text-fg-primary">
            Open questions <CircleHelp className="size-5 text-fg-tertiary" />
          </h3>
          <p className="type-body-sm text-fg-secondary">Optional — answer what you can now, the rest can wait until after the build.</p>
          {s.questions.map((q) => (
            <label key={q.id} className="flex flex-col gap-1.5">
              <span className="type-body-md text-fg-primary">{q.q}</span>
              <textarea
                rows={2}
                value={q.answer}
                onChange={(e) => dispatch({ type: "answerQuestion", id: q.id, answer: e.target.value })}
                placeholder="Your answer"
                className="w-full resize-y rounded-md border border-line-strong bg-surface px-3 py-2 type-body-md text-fg-primary outline-none placeholder:text-fg-tertiary focus:border-blue-500 focus:shadow-[0_0_0_4px_var(--color-blue-100)]"
              />
            </label>
          ))}
        </section>
      </div>

      <nav aria-label="Brief sections" className="hidden w-[280px] shrink-0 flex-col self-start lg:flex">
        {sections.map((sec) => (
          <a
            key={sec.id}
            href={`#brief-${sec.id}`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(`brief-${sec.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            aria-current={active === sec.id ? "true" : undefined}
            className="border-l border-line-strong py-3 pl-4 type-body-md text-fg-primary hover:text-fg-link aria-[current=true]:border-blue-500 aria-[current=true]:text-blue-500"
          >
            {sec.title}
          </a>
        ))}
      </nav>
    </div>
  )
}

function BriefRow({ text, onChange }: { text: string; onChange: (t: string | null) => void }) {
  const [editing, setEditing] = useState(text === "")
  const [draft, setDraft] = useState(stripBrackets(text))
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      ref.current?.focus()
      ref.current?.select()
    }
  }, [editing])

  if (editing)
    return (
      <li className="my-1 flex flex-col gap-2">
        <textarea
          ref={ref}
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onChange(draft.trim() ? draft.trim() : null)
              setEditing(false)
            }
            if (e.key === "Escape") {
              if (!text) onChange(null)
              setDraft(stripBrackets(text))
              setEditing(false)
            }
          }}
          className="w-full resize-y rounded-md border border-blue-500 bg-surface px-3 py-2 type-body-md text-fg-primary shadow-[0_0_0_4px_var(--color-blue-100)] outline-none"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { onChange(draft.trim() ? draft.trim() : null); setEditing(false) }}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => { if (!text) onChange(null); setDraft(stripBrackets(text)); setEditing(false) }}>Cancel</Button>
        </div>
      </li>
    )

  return (
    <li className="group relative flex items-start gap-2 rounded-sm py-0.5 pr-16 pl-6 type-body-md text-fg-secondary before:absolute before:top-[11px] before:left-2 before:size-1 before:rounded-full before:bg-fg-tertiary hover:bg-subtle">
      <span className="flex-1">
        {segments(text).map((seg, i) =>
          seg.guess ? (
            <Guess key={i} value={seg.text} onResolve={(v) => onChange(resolveGuess(text, seg.index, v))} />
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </span>
      <span className="absolute top-0 right-1 flex opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" aria-label="Edit point" onClick={() => { setDraft(stripBrackets(text)); setEditing(true) }} className="grid size-7 place-items-center rounded-sm text-fg-tertiary hover:bg-muted hover:text-fg-primary">
          <Pencil className="size-4" />
        </button>
        <button type="button" aria-label="Remove point" onClick={() => onChange(null)} className="grid size-7 place-items-center rounded-sm text-fg-tertiary hover:bg-muted hover:text-status-error-text">
          <Trash2 className="size-4" />
        </button>
      </span>
    </li>
  )
}

function Guess({ value, onResolve }: { value: string; onResolve: (v: string) => void }) {
  const [v, setV] = useState(value)
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) setV(value) }}>
      <Popover.Trigger asChild>
        <button type="button" className="rounded-[4px] bg-accent-yellow-subtle px-1 text-left text-fg-primary underline decoration-yellow-500 decoration-dashed underline-offset-4 hover:bg-yellow-200 focus-visible:outline-none focus-visible:focus-ring">
          {value}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} align="start" className="z-[60] flex w-80 flex-col gap-3 rounded-lg border border-line-default bg-surface p-4 shadow-soft-md data-[state=open]:animate-[bp-pop-in_150ms]">
          <p className="type-label-md text-fg-primary">Is this right?</p>
          <p className="type-body-sm text-fg-secondary">I guessed this from the web and similar labs. Confirm it, or type the correct detail.</p>
          <input
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onResolve(v)
                setOpen(false)
              }
            }}
            className="h-10 rounded-md border border-line-strong px-3 type-body-md outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_var(--color-blue-100)]"
            aria-label="Correct detail"
          />
          <div className="flex gap-2">
            <Button size="sm" leadingIcon={<Check />} onClick={() => { onResolve(value); setOpen(false) }} disabled={v !== value}>
              Looks right
            </Button>
            <Button size="sm" variant="secondary" disabled={v === value || !v.trim()} onClick={() => { onResolve(v); setOpen(false) }}>
              Save change
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
