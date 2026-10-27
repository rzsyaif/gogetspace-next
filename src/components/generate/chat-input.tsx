"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUp, FileText, Plus, Square, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { useGen } from "./gen-provider"

const DEMO_FILES = ["Lab front.jpg", "Price list 2026.pdf", "Logo.png"]

/** Message box under the chat. While the plan runs, sending restarts it; with nothing typed it offers Stop. */
export function ChatInput({ className, credits }: { className?: string; credits?: boolean }) {
  const { s, dispatch } = useGen()
  const [text, setText] = useState("")
  const [files, setFiles] = useState<string[]>([])
  const ta = useRef<HTMLTextAreaElement>(null)
  const plan = s.runs[s.planRun]
  const planRunning = s.phase === "plan" && plan?.status === "running"
  const clarifying = s.msgs.some((m) => m.type === "clarify" && !m.answer)
  const blocked = s.msgs.some((m) => m.type === "pick" && !m.picked)
  const hasText = text.trim().length > 0

  useEffect(() => {
    const el = ta.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(168, Math.max(28, el.scrollHeight)) + "px"
  }, [text])

  const send = (e?: FormEvent) => {
    e?.preventDefault()
    if (!hasText) return
    const msg = files.length ? `${text.trim()} (attached: ${files.join(", ")})` : text.trim()
    dispatch(clarifying ? { type: "answerClarify", answer: msg } : { type: "followUp", text: msg })
    setText("")
    setFiles([])
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const placeholder = clarifying
    ? "Describe your business…"
    : planRunning
      ? "Queue a follow up…"
      : s.phase === "create"
        ? "Ask for a change…"
        : "Ask for a change to the plan…"
  const hint = planRunning && hasText ? "Sending this restarts the plan with your note" : blocked ? "Pick one of the businesses above to continue" : null

  return (
    <div className={cn("flex flex-col", className)}>
      {credits && (
        <div className="-mb-7 flex items-center gap-1.5 rounded-t-xl border border-line-default bg-subtle px-4 pt-3 pb-10">
          <CreditRing value={s.credits} />
          <span className={cn("flex-1 type-label-md", s.credits >= 90 ? "text-status-warning-text" : "text-fg-secondary")}>{s.credits}% used credits</span>
        </div>
      )}
      <form onSubmit={send} className="relative flex flex-col gap-4 rounded-xl border border-line-strong bg-surface px-5 py-4 shadow-[0_4px_0_0_var(--color-shadow-block)] focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_var(--color-blue-100),0_4px_0_0_var(--color-blue-800)]">
        <AnimatePresence initial={false}>
          {files.length > 0 && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-2 overflow-hidden">
              {files.map((f) => (
                <li key={f} className="flex items-center gap-1.5 rounded-md border border-line-default bg-subtle py-1 pr-1 pl-2 type-body-sm">
                  <FileText className="size-4 text-fg-tertiary" /> {f}
                  <button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles((x) => x.filter((y) => y !== f))} className="grid size-6 place-items-center rounded-sm hover:bg-muted">
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <textarea
          ref={ta}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          aria-label={placeholder}
          className="block max-h-42 min-h-7 w-full resize-none bg-transparent type-body-lg text-fg-primary outline-none placeholder:text-fg-tertiary"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach files"
            disabled={files.length >= DEMO_FILES.length}
            onClick={() => setFiles((f) => [...f, DEMO_FILES.find((d) => !f.includes(d))!])}
            className="grid size-10 shrink-0 place-items-center rounded-md bg-subtle text-fg-secondary hover:bg-muted disabled:opacity-50"
          >
            <Plus className="size-5" />
          </button>
          <span className={cn("min-w-0 flex-1 truncate type-body-sm", hint ? "text-fg-link" : "text-fg-tertiary")}>{hint ?? "Add photos or documents"}</span>
          {planRunning && !hasText ? (
            <button type="button" onClick={() => dispatch({ type: "stop" })} className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 type-label-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)] active:translate-y-0.5 active:shadow-none">
              <Square className="size-3.5 fill-current" /> Stop
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send"
              disabled={!hasText || blocked}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-md transition-colors",
                hasText && !blocked ? "bg-blue-500 text-white shadow-[0_2px_0_0_var(--color-blue-800)] active:translate-y-0.5 active:shadow-none" : "bg-action-disabled text-fg-disabled",
              )}
            >
              <ArrowUp className="size-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function CreditRing({ value }: { value: number }) {
  const r = 8
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden>
      <circle cx="10" cy="10" r={r} fill="none" stroke="var(--color-line-strong)" strokeWidth="2.5" />
      <circle cx="10" cy="10" r={r} fill="none" stroke={value >= 90 ? "var(--color-status-warning-solid)" : "var(--color-fg-secondary)"} strokeWidth="2.5" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
    </svg>
  )
}
