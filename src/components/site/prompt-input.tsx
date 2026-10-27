"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUp, Plus, Sparkle, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { CLINIC_FRONT, CLINIC_PHOTO } from "./assets"
import { emitPromptActive } from "./prompt-events"

/**
 * AI prompt input from the homepage: type a brief, attach demo files (no file picker — it adds
 * sample files), press Enter to "generate". While generating, a blue outline travels around the
 * box and a soft glow pulses. Focusing it clears the hero Pixel Blocks; cancelling rebuilds them.
 * Ported from the Framer code component "AIPromptInput".
 */

export interface DemoFile {
  name: string
  size: string
  image?: string
}

export interface PromptInputProps {
  placeholder?: string
  hint?: string
  typingHint?: string
  attachedHint?: string
  statusMessages?: string[]
  demoFiles?: DemoFile[]
  /** seconds the demo "generates" for before returning to the input; 0 = until stopped */
  generateFor?: number
  onSubmit?: (brief: { text: string; files: DemoFile[] }) => void
  /** after a short "generating" moment, open the generation flow at this route with the prompt */
  flowHref?: string
  className?: string
}

interface FileItem extends DemoFile { id: number; ext: string }
interface Attached { file: FileItem; key: number; uploading: boolean }

const DEFAULT_FILES: DemoFile[] = [
  { name: "Clinic front.jpg", size: "2.34 MB", image: CLINIC_FRONT },
  { name: "Price list.pdf", size: "412 KB" },
  { name: "Team photo.jpg", size: "1.8 MB", image: CLINIC_PHOTO },
  { name: "Services.xlsx", size: "86 KB" },
]
const DEFAULT_STATUS = ["Reading your brief…", "Planning your pages…", "Picking a style…", "Setting up hosting…"]

// Baseplate primitives used in the animated states (motion needs literal colors)
const BLUE = "#2F5BFF", BLUE_100 = "#DCE6FF", BLUE_300 = "#8EABFF", BLUE_800 = "#172E8C"
const N200 = "#E4E1DA", N300 = "#D1CDC4"

export function PromptInput({
  placeholder = "Website for a family dental clinic in Penang",
  hint = "Add photos or documents",
  typingHint = "Press Enter to start",
  attachedHint = "Add a short description, then press Enter",
  statusMessages = DEFAULT_STATUS,
  demoFiles = DEFAULT_FILES,
  generateFor = 8,
  onSubmit,
  flowHref,
  className,
}: PromptInputProps) {
  const reduce = useReducedMotion()
  const router = useRouter()
  const files: FileItem[] = demoFiles.map((f, i) => ({
    ...f,
    id: i,
    ext: "." + (f.name.includes(".") ? f.name.split(".").pop()!.toUpperCase() : "FILE"),
  }))
  const messages = statusMessages.length ? statusMessages : ["Generating…"]

  const [text, setText] = useState("")
  const [focused, setFocused] = useState(false)
  const [attached, setAttached] = useState<Attached[]>([])
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState(0)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const keyRef = useRef(100)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => window.clearTimeout(id))
  }, [])

  // auto-grow the textarea between 2 and 6 lines
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(168, Math.max(56, ta.scrollHeight)) + "px"
  }, [text, attached.length])

  useEffect(() => {
    if (!generating) return
    const cycle = window.setInterval(() => setMsg((m) => (m + 1) % messages.length), 1800)
    const end = generateFor > 0 ? window.setTimeout(() => setGenerating(false), generateFor * 1000) : 0
    return () => {
      window.clearInterval(cycle)
      if (end) window.clearTimeout(end)
    }
  }, [generating, generateFor, messages.length])

  const hasText = text.trim().length > 0
  const active = generating || focused || hasText || attached.length > 0
  const canAttach = !generating && attached.length < files.length

  const focusInput = () => taRef.current?.focus()
  const attach = () => {
    if (!canAttach) return
    const next = files.find((f) => !attached.some((a) => a.file.id === f.id))
    if (!next) return
    const key = ++keyRef.current
    setAttached((a) => [...a, { file: next, key, uploading: true }])
    timers.current.push(
      window.setTimeout(() => setAttached((a) => a.map((x) => (x.key === key ? { ...x, uploading: false } : x))), 750),
    )
    focusInput()
  }
  const remove = (key: number) => setAttached((a) => a.filter((x) => x.key !== key))
  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (generating) return
    if (!hasText) return focusInput()
    setMsg(0)
    setGenerating(true)
    taRef.current?.blur()
    onSubmit?.({ text, files: attached.map((a) => a.file) })
    if (flowHref) {
      const note = attached.length ? ` (attached: ${attached.map((a) => a.file.name).join(", ")})` : ""
      try {
        sessionStorage.removeItem("gogetspace-generation")
      } catch {}
      timers.current.push(window.setTimeout(() => router.push(`${flowHref}?q=${encodeURIComponent(text.trim() + note)}`), 1400))
    }
  }
  const stop = () => {
    setGenerating(false)
    focusInput()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
    if (e.key === "Escape") {
      e.preventDefault()
      taRef.current?.blur()
      emitPromptActive(false)
    }
  }
  // clicking anywhere in the box (outside buttons) focuses the textarea
  const onBoxDown = (e: MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest("button") || t.tagName === "TEXTAREA") return
    e.preventDefault()
    focusInput()
  }

  const border = active ? 2 : 1
  const frameShadow = active
    ? `0px 0px 0px 4px ${BLUE_100}, 0px 4px 0px 0px ${BLUE_800}`
    : `0px 0px 0px 0px ${BLUE_100}, 0px 4px 0px 0px ${N300}`
  const hintText = attached.length > 0 && !hasText ? attachedHint : focused || hasText ? typingHint : hint

  return (
    <form onSubmit={submit} aria-busy={generating} className={cn("relative w-full font-sans", className)}>
      {/* pulsing glow while generating */}
      <AnimatePresence>
        {generating && (
          <motion.div
            key="glow"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              boxShadow: reduce
                ? "0px 0px 24px 4px rgba(47, 91, 255, 0.22)"
                : [
                    "0px 0px 16px 2px rgba(47, 91, 255, 0.16)",
                    "0px 0px 40px 10px rgba(47, 91, 255, 0.32)",
                    "0px 0px 16px 2px rgba(47, 91, 255, 0.16)",
                  ],
            }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.3 }, boxShadow: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}
            className="pointer-events-none absolute inset-0 rounded-xl"
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={false}
        animate={{ padding: border, boxShadow: frameShadow, backgroundColor: active ? "rgba(47, 91, 255, 0.2)" : N300 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative isolate overflow-hidden rounded-xl"
      >
        {/* travelling blue outline while generating */}
        <AnimatePresence>
          {generating && (
            <motion.div
              key="outline"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: reduce ? 30 : 360 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.3 }, rotate: { duration: 2.4, repeat: Infinity, ease: "linear" } }}
              style={{
                x: "-50%",
                y: "-50%",
                background: `conic-gradient(from 0deg, rgba(47,91,255,0) 0deg, rgba(47,91,255,0) 100deg, ${BLUE_300} 150deg, ${BLUE} 176deg, rgba(47,91,255,0) 180deg, rgba(47,91,255,0) 280deg, ${BLUE_300} 330deg, ${BLUE} 356deg, rgba(47,91,255,0) 360deg)`,
              }}
              className="absolute top-1/2 left-1/2 z-0 aspect-square w-[160%]"
            />
          )}
        </AnimatePresence>
        <div
          onMouseDown={onBoxDown}
          style={{ borderRadius: 24 - border }}
          className={cn("relative z-10 flex flex-col gap-4 bg-white px-5 py-4", generating ? "cursor-default" : "cursor-text")}
        >
          <AnimatePresence initial={false}>
            {attached.length > 0 && (
              <motion.div
                key="files"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                className="-mt-1.5 -mr-1.5 overflow-hidden"
              >
                <div className="flex gap-4 overflow-x-auto pt-1.5 pr-1.5 pb-0.5 [scrollbar-width:none]">
                  <AnimatePresence initial={false}>
                    {attached.map(({ file, key, uploading }) => (
                      <motion.div
                        key={key}
                        layout
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
                        className="relative size-30 flex-none"
                      >
                        <div className="absolute inset-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                          {file.image ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element -- tiny demo thumbnails */}
                              <img src={file.image} alt="" className="absolute inset-0 size-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-t from-white/95 to-white/0" />
                            </>
                          ) : (
                            <div className="absolute top-3 left-3 rounded-sm bg-neutral-900 px-1 py-0.5 type-label-sm text-white">
                              {file.ext}
                            </div>
                          )}
                          <div className="absolute inset-x-3 bottom-3 flex flex-col">
                            <span className="truncate type-body-sm text-neutral-900">{file.name}</span>
                            <span className="type-label-sm text-neutral-500">{uploading ? "Uploading…" : file.size}</span>
                          </div>
                          {uploading && (
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.75, ease: "easeOut" }}
                              className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-blue-500"
                            />
                          )}
                        </div>
                        <motion.button
                          type="button"
                          aria-label={"Remove " + file.name}
                          onClick={() => remove(key)}
                          disabled={generating}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className={cn(
                            "absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-neutral-900 text-white",
                            generating && "opacity-0",
                          )}
                        >
                          <X aria-hidden className="size-4" strokeWidth={2} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            {!text && (
              <div aria-hidden className="pointer-events-none absolute inset-0 text-lg leading-7 text-neutral-500">
                {placeholder}
              </div>
            )}
            <textarea
              ref={taRef}
              rows={2}
              value={text}
              readOnly={generating}
              aria-label={placeholder}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => {
                setFocused(true)
                emitPromptActive(true)
              }}
              onBlur={() => {
                setFocused(false)
                if (!hasText && attached.length === 0 && !generating) emitPromptActive(false)
              }}
              onKeyDown={onKeyDown}
              className="block max-h-42 min-h-14 w-full resize-none overflow-y-auto bg-transparent p-0 text-lg leading-7 text-neutral-900 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              aria-label="Attach files"
              onClick={attach}
              disabled={!canAttach}
              whileHover={canAttach ? { backgroundColor: N200 } : undefined}
              whileTap={canAttach ? { scale: 0.94 } : undefined}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-md bg-neutral-100 text-neutral-600",
                canAttach ? "cursor-pointer" : "cursor-default",
                !canAttach && !generating && "opacity-50",
              )}
            >
              <Plus aria-hidden className="size-5" strokeWidth={2} />
            </motion.button>

            <div aria-live="polite" className="relative h-5 min-w-0 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                {generating ? (
                  <motion.div
                    key={"msg-" + msg}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 text-blue-500"
                  >
                    <motion.span
                      animate={reduce ? undefined : { rotate: [0, 90, 180], scale: [1, 0.8, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      className="flex"
                    >
                      <Sparkle aria-hidden className="size-5" strokeWidth={2} />
                    </motion.span>
                    <span className="truncate type-label-md font-semibold">{messages[msg % messages.length]}</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key={"hint-" + hintText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="block truncate type-body-sm text-neutral-500"
                  >
                    {hintText}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {generating ? (
              <motion.button
                type="button"
                onClick={stop}
                whileHover={{ backgroundColor: "#F8F7F4" }}
                whileTap={{ y: 2, boxShadow: `0px 0px 0px 0px ${N300}` }}
                style={{ boxShadow: `0px 2px 0px 0px ${N300}` }}
                className="h-[38px] shrink-0 cursor-pointer rounded-md border border-neutral-300 bg-white px-3 type-label-md font-semibold text-neutral-900"
              >
                Stop
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                aria-label="Start building"
                initial={false}
                animate={{
                  backgroundColor: hasText ? BLUE : N200,
                  boxShadow: hasText ? `0px 2px 0px 0px ${BLUE_800}` : `0px 0px 0px 0px ${BLUE_800}`,
                }}
                whileTap={hasText ? { y: 2, boxShadow: `0px 0px 0px 0px ${BLUE_800}` } : undefined}
                transition={{ duration: 0.15 }}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-md",
                  hasText ? "cursor-pointer text-white" : "cursor-default text-neutral-400",
                )}
              >
                <ArrowUp aria-hidden className="size-5" strokeWidth={2} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </form>
  )
}
