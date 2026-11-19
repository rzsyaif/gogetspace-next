"use client"

import { useEffect, useEffectEvent, useState } from "react"
import { createPortal } from "react-dom"
import { motion } from "motion/react"
import { ArrowUp, Plus, Square } from "lucide-react"

/** set when the homepage hands off, so the editor doesn't play its own entrance a second time */
export const LAUNCH_KEY = "gogetspace-launched"

const EASE = [0.65, 0, 0.25, 1] as const

/**
 * Hand-off from the homepage prompt to the editor in /generate. The homepage fades into the editor's background,
 * the editor's frame builds around the prompt (the rail slides in from the left, the preview window from the
 * right), the prompt box glides down into the chat input, and the typed prompt lifts into the first chat bubble
 * at the top of the chat sidebar — so when the route changes underneath, nothing jumps. Positions mirror the
 * editor layout (rail 84px, chat sidebar 340/380px, preview window inset 4px; a phone gets the chat full width
 * under the editor bar).
 */
export function LaunchOverlay({ from, text, onDone }: { from: DOMRect; text: string; onDone: () => void }) {
  const [vp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const wide = vp.w >= 1024
  const sidebar = vp.w >= 1440 ? 380 : 340
  const bar = 65 // phone editor bar
  const chat = wide ? { left: 84, top: 0, width: sidebar } : { left: 0, top: bar, width: vp.w }
  const box = { left: chat.left + 16, width: chat.width - 32, height: 118, top: vp.h - 16 - 118 }
  const bubbleTop = chat.top + 80
  const bubbleRight = vp.w - (chat.left + chat.width - 16)

  const done = useEffectEvent(onDone)
  useEffect(() => {
    try {
      sessionStorage.setItem(LAUNCH_KEY, String(Date.now()))
    } catch {}
    const t = window.setTimeout(() => done(), 1150)
    return () => window.clearTimeout(t)
  }, [])

  return createPortal(
    <div data-theme="light" className="fixed inset-0 z-[100] overflow-hidden" aria-live="polite">
      <span className="sr-only">Opening the editor…</span>
      {/* the homepage fades out into the editor's background */}
      <motion.div className="absolute inset-0 bg-canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} />

      {wide ? (
        <>
          {/* the rail slides in from the left */}
          <motion.div
            className="absolute inset-y-0 left-0 flex w-[84px] flex-col items-center gap-3 px-2 py-5"
            initial={{ x: -84, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.55, ease: EASE }}
          >
            <Mark size={40} />
            <span className="mt-2 size-11 rounded-md bg-inverse" />
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="size-11 rounded-md border border-line-default bg-subtle" />
            ))}
          </motion.div>
          {/* the project bar at the top of the chat */}
          <motion.div
            className="absolute flex items-center gap-4"
            style={{ left: chat.left + 16, top: 16, width: chat.width - 32 }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.35 }}
          >
            <span className="flex h-12 flex-1 items-center rounded-md border border-line-strong bg-surface px-4">
              <span className="h-2.5 w-28 rounded-full bg-muted" />
            </span>
            <span className="size-12 rounded-md" />
          </motion.div>
          {/* the preview window slides in from the right, its toolbar fades in above it */}
          <motion.div
            className="absolute flex items-center gap-4 p-4"
            style={{ left: chat.left + chat.width + 4, top: 4, right: 4, height: 78 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <span className="flex flex-1 gap-4">
              <span className="h-11 w-[84px] rounded-full bg-subtle" />
              <span className="h-11 w-[124px] rounded-full bg-subtle" />
            </span>
            <span className="h-[46px] w-[320px] max-w-[34%] rounded-md border border-line-strong bg-surface" />
            <span className="flex flex-1 justify-end gap-4">
              <span className="size-11 rounded-full bg-subtle" />
              <span className="size-11 rounded-full bg-subtle" />
              <span className="h-11 w-[89px] rounded-md bg-muted" />
            </span>
          </motion.div>
          <motion.div
            className="absolute grid place-items-center overflow-hidden rounded-xl border border-line-default bg-surface p-6"
            style={{ left: chat.left + chat.width + 4, top: 86, right: 4, bottom: 4 }}
            initial={{ opacity: 0, x: 96, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          >
            <div className="flex w-full max-w-md flex-col items-center gap-4">
              <div className="flex w-full flex-col gap-3">
                <div className="h-6 w-1/2 rounded-md bg-muted" />
                <div className="h-40 rounded-lg bg-subtle" />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-subtle" />
                  ))}
                </div>
              </div>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="type-label-md text-fg-secondary">
                Planning your website…
              </motion.span>
            </div>
          </motion.div>
        </>
      ) : (
        // the phone editor bar drops in
        <motion.div
          className="absolute inset-x-0 top-0 flex items-center gap-3 border-b border-line-default px-4 py-3"
          style={{ height: bar }}
          initial={{ opacity: 0, y: -bar }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
        >
          <Mark size={32} />
          <span className="grid h-10 flex-1 grid-cols-2 gap-1 rounded-full bg-subtle p-1">
            <span className="grid place-items-center rounded-full bg-surface type-label-sm text-fg-primary">Chat</span>
            <span className="grid place-items-center type-label-sm text-fg-secondary">Preview</span>
          </span>
          <span className="size-10 rounded-full bg-subtle" />
        </motion.div>
      )}

      {/* the prompt box gliding into the chat input */}
      <motion.div
        className="absolute flex flex-col justify-between overflow-hidden rounded-xl border-2 border-blue-500 bg-white px-5 py-4 shadow-[0_0_0_4px_var(--color-blue-100),0_4px_0_0_var(--color-blue-800)]"
        initial={{ left: from.left, top: from.top, width: from.width, height: from.height }}
        animate={{ ...box, borderColor: "#D1CDC4", boxShadow: "0 0 0 0px #DCE6FF, 0 4px 0 0 #D1CDC4", borderWidth: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
      >
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.25 }} className="truncate type-body-lg text-fg-tertiary">
          Queue a follow up…
        </motion.span>
        <span className="flex items-center gap-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-subtle text-fg-secondary">
            <Plus className="size-5" />
          </span>
          <span className="flex-1 truncate type-body-sm text-fg-tertiary">Add photos or documents</span>
          <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.4 }} className="absolute right-5 bottom-4 grid size-10 place-items-center rounded-md bg-blue-500 text-white">
            <ArrowUp className="size-5" />
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 type-label-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)]"
          >
            <Square className="size-3.5 fill-current" /> Stop
          </motion.span>
        </span>
      </motion.div>

      {/* the typed prompt lifting into the first chat bubble, top right of the chat */}
      <motion.p
        className="absolute rounded-lg border border-line-default bg-surface px-5 py-4 type-body-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)]"
        style={{ maxWidth: chat.width - 32 - 64, transformOrigin: "top right" }}
        initial={{ top: from.top + 4, right: vp.w - from.right + 4, opacity: 0, scale: 0.96 }}
        animate={{ top: bubbleTop, right: bubbleRight, opacity: 1, scale: 1 }}
        transition={{ duration: 0.85, ease: EASE, delay: 0.12, opacity: { duration: 0.25, delay: 0.12 } }}
      >
        {text}
      </motion.p>
    </div>,
    document.body,
  )
}

function Mark({ size }: { size: number }) {
  return (
    <span style={{ width: size, height: size }} className="grid shrink-0 grid-cols-2 place-content-center gap-[5px] rounded-md bg-blue-500 shadow-[0_2px_0_0_var(--color-blue-800)]">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="size-2.5 rounded-full bg-white/90" />
      ))}
    </span>
  )
}
