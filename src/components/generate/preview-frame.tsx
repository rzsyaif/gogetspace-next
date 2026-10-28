"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
import { Loader } from "lucide-react"
import { cn } from "@/lib/cn"
import { EditPopover, type Selection } from "./edit-popover"

export interface EditEvent {
  kind: "ask" | "text-saved" | "image-uploaded"
  target: Selection
  prompt?: string
  text?: string
}

/**
 * Renders a page of the generated site in an iframe at a virtual viewport width, scaled to fit its box
 * (so a 1280px desktop page fits a 600px panel). Links clicked inside the site are reported upward;
 * a new `src` navigates the frame in place (no remount).
 * With `editMode` the site's EditBridge reports clicks, and this frame shows the edit menu over the page.
 */
export function PreviewFrame({
  src,
  viewport,
  className,
  title,
  onNavigate,
  reloadKey = 0,
  editMode = false,
  onEdit,
}: {
  src: string
  /** virtual width in px; the frame is scaled down to fit when the box is narrower */
  viewport: number
  className?: string
  title: string
  onNavigate?: (slug: string) => void
  reloadKey?: number
  editMode?: boolean
  /** an edit the person made or asked for — returns the follow-up to show on the page, if any */
  onEdit?: (e: EditEvent) => { replaceText?: string; imageSrc?: string } | void
}) {
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [loading, setLoading] = useState(true)
  const [initialSrc] = useState(src)
  const [sel, setSel] = useState<Selection | null>(null)
  const modeRef = useRef(editMode)
  const handlers = useRef({ onNavigate, onEdit })
  useEffect(() => {
    handlers.current = { onNavigate, onEdit }
  })

  const post = (msg: object) => {
    try {
      frame.current?.contentWindow?.postMessage(msg, window.location.origin)
    } catch {}
  }

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // navigate in place when the requested page differs from what the frame shows
  useEffect(() => {
    const win = frame.current?.contentWindow
    if (!win) return
    try {
      if (win.location.pathname !== src) win.location.replace(src)
    } catch {}
  }, [src, size.w])

  useEffect(() => {
    if (!reloadKey) return
    try {
      frame.current?.contentWindow?.location.reload()
    } catch {}
  }, [reloadKey])

  // tell the site which mode we're in (it also asks when a page loads)
  useEffect(() => {
    modeRef.current = editMode
    try {
      frame.current?.contentWindow?.postMessage({ type: "bakti:mode", mode: editMode ? "edit" : "preview" }, window.location.origin)
    } catch {}
  }, [editMode])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const d = e.data as { type?: string; slug?: string; id?: string; rect?: Selection["rect"]; label?: string; text?: string } & Partial<Selection>
      const reply = (msg: object) => (e.source as Window).postMessage(msg, window.location.origin)
      switch (d.type) {
        case "bakti:ready":
        case "bakti:page":
          reply({ type: "bakti:mode", mode: modeRef.current ? "edit" : "preview" })
          if (d.type === "bakti:page") {
            setSel(null)
            if (d.slug !== undefined) handlers.current.onNavigate?.(d.slug)
          }
          break
        case "bakti:select":
          setSel({ id: d.id!, kind: d.kind!, label: d.label!, rect: d.rect!, hasParent: !!d.hasParent, text: d.text })
          break
        case "bakti:rect":
          setSel((s) => (s && s.id === d.id ? { ...s, rect: d.rect! } : s))
          break
        case "bakti:deselect":
          setSel(null)
          break
        case "bakti:text-saved":
          handlers.current.onEdit?.({ kind: "text-saved", target: { id: d.id!, kind: "text", label: d.label!, rect: { x: 0, y: 0, w: 0, h: 0 }, hasParent: false }, text: d.text })
          break
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  const close = () => {
    setSel(null)
    post({ type: "bakti:deselect" })
  }

  const scale = size.w ? Math.min(1, size.w / viewport) : 1
  // place the menu under the picked element, or above it when there's no room below
  let pop: { style: React.CSSProperties; above: boolean } | null = null
  if (sel && editMode) {
    const popH = sel.kind === "block" ? 250 : 350
    const left = Math.max(8, Math.min(sel.rect.x * scale, size.w - 348))
    const below = (sel.rect.y + sel.rect.h) * scale + 10
    const above = below + popH > size.h && sel.rect.y * scale - 10 > popH
    const top = above ? sel.rect.y * scale - 10 : Math.min(Math.max(below, 8), Math.max(8, size.h - popH - 8))
    pop = { style: { left, top }, above }
  }

  return (
    <div ref={box} className={cn("relative overflow-hidden", className)}>
      {size.w > 0 && (
        <iframe
          ref={frame}
          src={initialSrc}
          title={title}
          onLoad={() => setLoading(false)}
          className="absolute top-0 left-0 origin-top-left border-0 bg-white"
          style={{ width: scale < 1 ? viewport : size.w, height: size.h / scale, transform: `scale(${scale})` }}
        />
      )}
      <AnimatePresence>
        {sel && pop && (
          <EditPopover
            key={sel.id}
            sel={sel}
            style={pop.style}
            above={pop.above}
            onClose={close}
            onParent={() => post({ type: "bakti:select-parent", id: sel.id })}
            onEditText={() => {
              post({ type: "bakti:edit-text", id: sel.id })
              setSel(null)
            }}
            onUpload={(dataUrl, name) => {
              post({ type: "bakti:replace-image", id: sel.id, src: dataUrl })
              handlers.current.onEdit?.({ kind: "image-uploaded", target: sel, text: name })
              close()
            }}
            onAsk={(prompt) => {
              const result = handlers.current.onEdit?.({ kind: "ask", target: sel, prompt }) || {}
              if (result.replaceText) post({ type: "bakti:replace-text", id: sel.id, text: result.replaceText })
              else if (result.imageSrc) post({ type: "bakti:regen-image", id: sel.id, src: result.imageSrc })
              else post({ type: "bakti:flash", id: sel.id })
              close()
            }}
          />
        )}
      </AnimatePresence>
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-surface/70">
          <Loader className="size-6 animate-spin text-fg-tertiary" aria-label="Loading preview" />
        </div>
      )}
    </div>
  )
}
