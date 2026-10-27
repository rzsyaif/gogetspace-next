"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "lucide-react"
import { cn } from "@/lib/cn"

/**
 * Renders a page of the generated site in an iframe at a virtual viewport width, scaled to fit its box
 * (so a 1280px desktop page fits a 600px panel). Links clicked inside the site are reported upward;
 * a new `src` navigates the frame in place (no remount).
 */
export function PreviewFrame({
  src,
  viewport,
  className,
  title,
  onNavigate,
  reloadKey = 0,
}: {
  src: string
  /** virtual width in px; the frame is scaled down to fit when the box is narrower */
  viewport: number
  className?: string
  title: string
  onNavigate?: (slug: string) => void
  reloadKey?: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [loading, setLoading] = useState(true)
  const [initialSrc] = useState(src)

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

  useEffect(() => {
    if (!onNavigate) return
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "bakti:page" || e.source !== frame.current?.contentWindow) return
      onNavigate(e.data.slug as string)
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [onNavigate])

  const scale = size.w ? Math.min(1, size.w / viewport) : 1
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
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-surface/70">
          <Loader className="size-6 animate-spin text-fg-tertiary" aria-label="Loading preview" />
        </div>
      )}
    </div>
  )
}
