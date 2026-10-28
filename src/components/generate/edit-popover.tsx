"use client"

import { useRef, useState, type FormEvent } from "react"
import { motion } from "motion/react"
import { ArrowUp, ArrowUpToLine, ImageIcon, PencilLine, Sparkles, Type, Upload, X } from "lucide-react"
import { cn } from "@/lib/cn"
import type { EditKind, EditRect } from "@/components/bakti-site/edit-bridge"

export interface Selection {
  id: string
  kind: EditKind
  label: string
  rect: EditRect
  hasParent: boolean
  text?: string
}

const CHIPS: Record<EditKind, string[]> = {
  block: ["Change the layout", "Rewrite the content", "Add a photo", "Make it more compact", "Remove this section"],
  text: ["Make it shorter", "Friendlier tone", "More professional", "Translate to Bahasa Malaysia"],
  image: ["Brighter and warmer", "Show our lab and equipment", "Patients smiling", "Match our brand colours"],
}
const PLACEHOLDER: Record<EditKind, string> = {
  block: "Ask the agent to change this section…",
  text: "Ask the agent to rewrite this…",
  image: "Describe the image you want…",
}
const ICON: Record<EditKind, typeof Type> = { block: Sparkles, text: Type, image: ImageIcon }

/**
 * Menu shown next to whatever was clicked in Edit Mode.
 * Section → ask the agent. Text → write it yourself or ask the agent. Image → upload your own or regenerate.
 */
export function EditPopover({
  sel,
  style,
  above,
  onClose,
  onAsk,
  onEditText,
  onUpload,
  onParent,
}: {
  sel: Selection
  style: React.CSSProperties
  above: boolean
  onClose: () => void
  onAsk: (prompt: string) => void
  onEditText: () => void
  onUpload: (dataUrl: string, name: string) => void
  onParent: () => void
}) {
  const [prompt, setPrompt] = useState("")
  const file = useRef<HTMLInputElement>(null)
  const Icon = ICON[sel.kind]
  const send = (e?: FormEvent, text = prompt) => {
    e?.preventDefault()
    if (!text.trim()) return
    onAsk(text.trim())
    setPrompt("")
  }

  return (
    <motion.div
      role="dialog"
      aria-label={`Edit ${sel.label}`}
      initial={{ opacity: 0, y: above ? 6 : -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16 }}
      style={style}
      className={cn("absolute z-20 flex w-[340px] max-w-[calc(100%-16px)] flex-col gap-3 rounded-lg border border-line-default bg-surface p-3 shadow-soft-lg", above && "-translate-y-full")}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-accent-blue-subtle text-fg-link">
          <Icon className="size-4" />
        </span>
        <p className="min-w-0 flex-1 truncate type-label-md text-fg-primary" title={sel.label}>
          {sel.kind === "text" ? `“${sel.label}”` : sel.label}
        </p>
        {sel.hasParent && (
          <button type="button" onClick={onParent} title="Select the container around this" className="flex h-7 items-center gap-1 rounded-sm px-1.5 type-label-sm text-fg-secondary hover:bg-subtle">
            <ArrowUpToLine className="size-3.5" /> Parent
          </button>
        )}
        <button type="button" aria-label="Close" onClick={onClose} className="grid size-7 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle">
          <X className="size-4" />
        </button>
      </div>

      {sel.kind === "text" && (
        <button type="button" onClick={onEditText} className="flex items-center gap-3 rounded-md border border-line-default p-2.5 text-left hover:border-blue-500 hover:bg-accent-blue-subtle/40">
          <PencilLine className="size-5 shrink-0 text-fg-secondary" />
          <span className="flex flex-col">
            <span className="type-label-md text-fg-primary">Edit it myself</span>
            <span className="type-caption text-fg-tertiary">Type straight on the page · Enter to save, Esc to cancel</span>
          </span>
        </button>
      )}
      {sel.kind === "image" && (
        <>
          <button type="button" onClick={() => file.current?.click()} className="flex items-center gap-3 rounded-md border border-line-default p-2.5 text-left hover:border-blue-500 hover:bg-accent-blue-subtle/40">
            <Upload className="size-5 shrink-0 text-fg-secondary" />
            <span className="flex flex-col">
              <span className="type-label-md text-fg-primary">Upload my own image</span>
              <span className="type-caption text-fg-tertiary">JPG, PNG or WebP · replaces this image</span>
            </span>
          </button>
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const reader = new FileReader()
              reader.onload = () => onUpload(String(reader.result), f.name)
              reader.readAsDataURL(f)
              e.target.value = ""
            }}
          />
        </>
      )}

      {sel.kind !== "block" && (
        <p className="flex items-center gap-2 type-label-sm text-fg-tertiary">
          <span className="h-px flex-1 bg-line-default" /> {sel.kind === "image" ? "or regenerate with the agent" : "or ask the agent"} <span className="h-px flex-1 bg-line-default" />
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {CHIPS[sel.kind].map((c) => (
          <button key={c} type="button" onClick={() => send(undefined, c)} className="rounded-full border border-line-default px-2.5 py-1 type-body-sm text-fg-primary hover:border-blue-500 hover:text-fg-link">
            {c}
          </button>
        ))}
      </div>
      <form onSubmit={send} className="flex items-center gap-2 rounded-md border border-line-strong bg-surface py-1 pr-1 pl-3 focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_var(--color-blue-100)]">
        <input autoFocus value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={PLACEHOLDER[sel.kind]} aria-label={PLACEHOLDER[sel.kind]} className="h-9 min-w-0 flex-1 bg-transparent type-body-sm text-fg-primary outline-none placeholder:text-fg-tertiary" />
        <button type="submit" aria-label={sel.kind === "image" ? "Regenerate" : "Ask the agent"} disabled={!prompt.trim()} className="grid size-8 shrink-0 place-items-center rounded-sm bg-blue-500 text-white disabled:bg-action-disabled disabled:text-fg-disabled">
          <ArrowUp className="size-4" />
        </button>
      </form>
    </motion.div>
  )
}
