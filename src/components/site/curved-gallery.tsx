"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/cn"

/**
 * Endless row of cards bent around a concave arc (the edges come towards the viewer).
 * Drifts on its own, can be dragged with inertia, pauses while off-screen.
 * Replaces the Framer marketplace component "CurvedGalleryArc".
 */
export interface CurvedGalleryProps {
  images: string[]
  cardSize?: number
  gap?: number
  /** how far (px) the outermost cards come towards the viewer */
  curve?: number
  perspective?: number
  /** px per frame (60fps) */
  autoScrollSpeed?: number
  dragSpeed?: number
  /** 0–1, how much velocity is kept per frame after a fling */
  inertia?: number
  radius?: number
  className?: string
}

export function CurvedGallery({
  images,
  cardSize = 240,
  gap = 16,
  curve = 300,
  perspective = 2230,
  autoScrollSpeed = 0.16,
  dragSpeed = 1,
  inertia = 0.75,
  radius = 16,
  className,
}: CurvedGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduce = useReducedMotion()
  const step = cardSize + gap
  // enough copies to cover very wide screens on both sides
  const copies = Math.max(2, Math.ceil(2400 / (images.length * step)))
  const items = Array.from({ length: images.length * copies }, (_, i) => images[i % images.length])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const n = items.length
    const loop = n * step
    let offset = 0
    let velocity = 0
    let dragging = false
    let lastX = 0
    let lastT = 0
    let R = 1000
    let half = 600
    let inView = true
    let raf = 0

    const measure = () => {
      half = root.clientWidth / 2
      // pick the cylinder radius so the cards at the container edge sit `curve` px closer
      const target = Math.abs(curve)
      let lo = half * 0.6, hi = 200000
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2
        const depth = mid * (1 - Math.cos(Math.min(Math.PI / 2, half / mid)))
        if (depth > target) lo = mid
        else hi = mid
      }
      R = (lo + hi) / 2
    }
    const layout = () => {
      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i]
        if (!el) continue
        // x along the arc, wrapped so the strip never runs out
        let x = (((i * step - offset) % loop) + loop) % loop
        if (x > loop / 2) x -= loop
        const phi = x / R
        if (Math.abs(phi) > Math.PI / 2 || Math.abs(x) > half + step * 2) {
          el.style.visibility = "hidden"
          continue
        }
        const sign = curve >= 0 ? 1 : -1
        const tx = R * Math.sin(phi)
        const tz = sign * R * (1 - Math.cos(phi))
        el.style.visibility = "visible"
        el.style.transform = `translate3d(${tx.toFixed(2)}px, 0, ${tz.toFixed(2)}px) rotateY(${(-sign * phi * 180) / Math.PI}deg)`
      }
    }
    const frame = () => {
      if (!dragging) {
        if (Math.abs(velocity) > 0.05) {
          offset += velocity
          velocity *= inertia
        } else {
          velocity = 0
          if (!reduce) offset += autoScrollSpeed
        }
      }
      layout()
      raf = requestAnimationFrame(frame)
    }
    const start = () => { if (!raf && inView) raf = requestAnimationFrame(frame) }
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }

    const onDown = (e: PointerEvent) => {
      dragging = true
      velocity = 0
      lastX = e.clientX
      lastT = performance.now()
      root.setPointerCapture(e.pointerId)
      root.style.cursor = "grabbing"
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = (e.clientX - lastX) * dragSpeed
      const now = performance.now()
      offset -= dx
      velocity = (-dx / Math.max(1, now - lastT)) * 16
      lastX = e.clientX
      lastT = now
      if (!raf) layout()
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      root.style.cursor = ""
      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId)
      // keep the fling going for a bit even with inertia < 1 per frame
      velocity = Math.max(-60, Math.min(60, velocity * 4))
    }

    measure()
    layout()
    const ro = new ResizeObserver(() => { measure(); layout() })
    ro.observe(root)
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) start(); else stop() })
    io.observe(root)
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerup", onUp)
    root.addEventListener("pointercancel", onUp)
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
    }
  }, [items.length, step, curve, autoScrollSpeed, dragSpeed, inertia, reduce])

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="Websites built with GoGetSpace"
      className={cn("relative w-full cursor-grab touch-pan-y select-none overflow-x-clip", className)}
      style={{ perspective, height: cardSize + 24 }}
    >
      <div className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]">
        {items.map((src, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el }}
            className="absolute overflow-hidden bg-neutral-800 [backface-visibility:hidden] will-change-transform"
            style={{ width: cardSize, height: cardSize, left: -cardSize / 2, top: -cardSize / 2, borderRadius: radius }}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes={`${cardSize}px`}
              draggable={false}
              className="pointer-events-none object-cover"
              aria-hidden={i >= images.length}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
