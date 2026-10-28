"use client"

import { useEffect, useEffectEvent, useState } from "react"
import { createPortal } from "react-dom"
import { motion } from "motion/react"
import { ArrowUp, Plus, Square } from "lucide-react"

/**
 * Hand-off from the homepage prompt to /generate. The canvas colour washes over the page from the prompt,
 * the prompt box glides to where the chat input sits on /generate, and the typed prompt lifts into the first
 * chat bubble — so when the route changes underneath, nothing jumps. Positions mirror the /generate layout.
 */
export function LaunchOverlay({ from, text, onDone }: { from: DOMRect; text: string; onDone: () => void }) {
  const [vp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const sm = vp.w >= 640
  const colW = Math.min(792, vp.w) // chat column, incl. its 16px side padding
  const colLeft = (vp.w - colW) / 2
  const box = { width: colW - 32, height: 118, left: colLeft + 16, top: vp.h - (sm ? 32 : 16) - 118 }
  const bubbleTop = 72 + (sm ? 48 : 24)
  const bubbleRight = vp.w - (colLeft + colW - 16)
  const cx = from.left + from.width / 2
  const cy = from.top + from.height / 2

  const done = useEffectEvent(onDone)
  useEffect(() => {
    const t = window.setTimeout(() => done(), 1050)
    return () => window.clearTimeout(t)
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      <span className="sr-only">Starting your website…</span>
      {/* background change, radiating from the prompt */}
      <motion.div
        className="absolute inset-0 bg-canvas"
        initial={{ clipPath: `circle(0px at ${cx}px ${cy}px)` }}
        animate={{ clipPath: `circle(${Math.hypot(vp.w, vp.h)}px at ${cx}px ${cy}px)` }}
        transition={{ duration: 0.7, ease: [0.6, 0, 0.2, 1] }}
      />
      {/* /generate header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }} className="absolute inset-x-0 top-0 flex h-[72px] items-center justify-between px-4 sm:px-6">
        <span className="grid size-9 grid-cols-2 place-content-center gap-[5px] rounded-md bg-blue-500 shadow-[0_2px_0_0_var(--color-blue-800)]">
          {[0, 1, 2, 3].map((i) => <span key={i} className="size-2.5 rounded-full bg-white/90" />)}
        </span>
        <span className="px-2 type-label-md text-fg-link">Log in</span>
      </motion.div>

      {/* the prompt box travelling to the bottom */}
      <motion.div
        className="absolute flex flex-col justify-between overflow-hidden rounded-xl border-2 border-blue-500 bg-white px-5 py-4 shadow-[0_0_0_4px_var(--color-blue-100),0_4px_0_0_var(--color-blue-800)]"
        initial={{ left: from.left, top: from.top, width: from.width, height: from.height }}
        animate={{ left: box.left, top: box.top, width: box.width, height: box.height, borderColor: "#D1CDC4", boxShadow: "0 0 0 0px #DCE6FF, 0 4px 0 0 #D1CDC4", borderWidth: 1 }}
        transition={{ duration: 0.75, ease: [0.65, 0, 0.25, 1], delay: 0.1 }}
      >
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.25 }} className="type-body-lg text-fg-tertiary">
          Queue a follow up…
        </motion.span>
        <span className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-md bg-subtle text-fg-secondary"><Plus className="size-5" /></span>
          <span className="flex-1 truncate type-body-sm text-fg-tertiary">Add photos or documents</span>
          <motion.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.4 }} className="absolute right-5 bottom-4 grid size-10 place-items-center rounded-md bg-blue-500 text-white">
            <ArrowUp className="size-5" />
          </motion.span>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="flex h-10 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 type-label-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)]">
            <Square className="size-3.5 fill-current" /> Stop
          </motion.span>
        </span>
      </motion.div>

      {/* the typed prompt lifting into the first chat bubble */}
      <motion.p
        className="absolute rounded-lg border border-line-default bg-surface px-5 py-4 type-body-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)]"
        style={{ maxWidth: colW - 32 - 80 }}
        initial={{ top: from.top + 4, right: vp.w - from.right + 4, opacity: 0, scale: 0.96 }}
        animate={{ top: bubbleTop, right: bubbleRight, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.65, 0, 0.25, 1], delay: 0.15, opacity: { duration: 0.25, delay: 0.15 } }}
      >
        {text}
      </motion.p>
    </div>,
    document.body,
  )
}
