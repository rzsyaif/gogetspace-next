"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@gogetspace/baseplate/cn"
import { PROMPT_EVENT, PROMPT_LAUNCH_EVENT, PROMPT_TEXT_EVENT } from "./prompt-events"

/** brand blue, yellow, green, red */
const RGB = ["47,91,255", "255,194,31", "18,183,106", "242,85,58"]
/** yellow reads lighter than the others, so it gets a little more */
const TILE_ALPHA = [0.22, 0.3, 0.22, 0.22]
/** one slow wave travelling in toward the prompt */
const WAVE_MS = 7000
const POP_MS = 480
const FLASH_MS = 1100
/** the nav sits over the top of the hero: no tiles there */
const NAV_H = 96

interface Cell {
  x: number
  y: number
  /** distance from the prompt's centre */
  d: number
  /** under the prompt: not drawn */
  hidden: boolean
  /** a typed tile may land here (not behind the nav, headline or prompt) */
  open: boolean
  /** behind the headline (phones only): drawn lighter */
  dim: boolean
}
interface Glow {
  size: number
  dur: number
  delay: number
}

export interface HeroTilesProps {
  cellSize?: number
  phoneCellSize?: number
  /** multiplies each tile's color strength */
  tileOpacity?: number
  /** 0 turns the glow off */
  glowStrength?: number
  maxTiles?: number
  /** how dark the idle wave gets, 0–1 */
  idle?: number
  className?: string
}

/**
 * The hero background: a faint grid with a slow wave rolling in toward the prompt. Every character typed lights a
 * tile somewhere random in a brand color (about half of them glow softly, each at its own pace); deleting takes the
 * latest away. Sending the prompt sends a blue ripple out across the grid. It reads the prompt and the headline from
 * its section (`data-hero-prompt`, `data-hero-copy`) so tiles stay out from behind them.
 */
export function HeroTiles({ cellSize = 40, phoneCellSize = 32, tileOpacity = 0.6, glowStrength = 0.5, maxTiles = 60, idle = 0.04, className }: HeroTilesProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return
    const animate = !reduced

    let W = 0, H = 0, dpr = 1, cell = cellSize, maxD = 1
    let cells: Cell[] = []
    let order: number[] = []
    let hues: number[] = []
    let glows: (Glow | null)[] = []
    let typed = 0
    /** fewer tiles on phones, where the grid is smaller */
    let cap = maxTiles
    /** when each lit tile appeared, in typing order */
    let born: number[] = []
    let focused = false
    let amp = idle
    let launchAt = -1e9
    let raf = 0
    let visible = true

    const layout = () => {
      const r = root.getBoundingClientRect()
      W = r.width
      H = r.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const narrow = W < 640
      cap = narrow ? Math.round(maxTiles / 2) : maxTiles
      cell = narrow ? phoneCellSize : cellSize
      const rel = (el: Element | null) => {
        if (!el) return null
        const b = el.getBoundingClientRect()
        return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }
      }
      const section = root.parentElement
      const box = rel(section?.querySelector("[data-hero-prompt]") ?? null) ?? { x: W / 2, y: H / 2, w: 0, h: 0 }
      const copy = rel(section?.querySelector("[data-hero-copy]") ?? null)
      const inside = (mx: number, my: number, b: { x: number; y: number; w: number; h: number } | null) => !!b && mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h
      const overlaps = (x: number, y: number, b: { x: number; y: number; w: number; h: number } | null, pad: number) =>
        !!b && x < b.x + b.w + pad && x + cell > b.x - pad && y < b.y + b.h + pad && y + cell > b.y - pad
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2
      cells = []
      maxD = 1
      for (let y = 0; y < H; y += cell) {
        for (let x = 0; x < W; x += cell) {
          const mx = x + cell / 2, my = y + cell / 2
          const hidden = inside(mx, my, box)
          const d = Math.hypot(mx - cx, my - cy)
          maxD = Math.max(maxD, d)
          // a typed tile never touches the headline or the prompt, even at an edge
          // (on phones the copy spans the width, so tiles may sit behind it there, at half strength)
          const behindCopy = overlaps(x, y, copy, 16)
          const clear = (!behindCopy || narrow) && !overlaps(x, y, box, 8)
          cells.push({ x, y, d, hidden, dim: behindCopy, open: clear && y >= NAV_H && y + cell <= H - cell })
        }
      }
      // a fixed shuffle: the same text lights the same tiles, and deleting takes the latest one away
      let seed = 7
      const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
      order = cells.map((_, i) => i).filter((i) => cells[i].open)
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
      }
      hues = order.map(() => Math.floor(rand() * 4))
      glows = order.map(() => (rand() < 0.5 ? { size: 10 + rand() * 22, dur: 1800 + rand() * 2600, delay: rand() * 2000 } : null))
      setCount(typed)
    }

    const setCount = (n: number) => {
      const count = Math.min(cap, order.length, n)
      const now = performance.now()
      if (count > born.length) born = born.concat(Array.from({ length: count - born.length }, () => now))
      else born.length = count
    }

    const square = (x: number, y: number, size: number) => {
      const inset = 1
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, 6)
        ctx.fill()
      } else ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2)
    }

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      // grid lines
      ctx.strokeStyle = "rgba(228,225,218,0.6)"
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x <= W; x += cell) {
        ctx.moveTo(Math.round(x) + 0.5, 0)
        ctx.lineTo(Math.round(x) + 0.5, H)
      }
      for (let y = 0; y <= H; y += cell) {
        ctx.moveTo(0, Math.round(y) + 0.5)
        ctx.lineTo(W, Math.round(y) + 0.5)
      }
      ctx.stroke()

      const lit = new Set<number>()
      for (let i = 0; i < born.length; i++) lit.add(order[i])

      // the idle wave, and the ripple after sending
      amp += ((focused || typed > 0 ? idle * 1.8 : idle) - amp) * 0.06
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i]
        if (c.hidden || lit.has(i)) continue
        if (animate) {
          const ph = (t / WAVE_MS + c.d / maxD) % 1
          const k = ph < 0.1 ? ph / 0.1 : ph < 0.24 ? 1 - (ph - 0.1) / 0.14 : 0
          if (k > 0.01) {
            ctx.fillStyle = `rgba(28,27,24,${(amp * k).toFixed(3)})`
            square(c.x, c.y, cell)
          }
          const local = t - launchAt - c.d * 0.9
          if (local >= 0 && local < FLASH_MS) {
            const f = local < FLASH_MS * 0.3 ? (local / (FLASH_MS * 0.3)) * 0.22 : 0.22 * (1 - (local - FLASH_MS * 0.3) / (FLASH_MS * 0.7))
            ctx.fillStyle = `rgba(47,91,255,${f.toFixed(3)})`
            square(c.x, c.y, cell)
          }
        }
      }

      // typed tiles
      for (let i = 0; i < born.length; i++) {
        const c = cells[order[i]]
        const rgb = RGB[hues[i]]
        const p = animate ? Math.min(1, (t - born[i]) / POP_MS) : 1
        const back = 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2)
        const scale = 0.4 + 0.6 * back
        const alpha = TILE_ALPHA[hues[i]] * tileOpacity * Math.min(1, p / 0.6) * (c.dim ? 0.5 : 1)
        const g = glows[i]
        if (g && glowStrength > 0) {
          // fades in over `dur`, out over `dur`, from its own start
          const ph = ((((t - g.delay) / g.dur) % 2) + 2) % 2
          const v = animate ? 0.5 - 0.5 * Math.cos(Math.PI * ph) : 0.5
          ctx.shadowBlur = g.size * (0.5 + glowStrength) * v
          ctx.shadowColor = `rgba(${rgb},${(0.55 * glowStrength).toFixed(3)})`
        }
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`
        const s = cell * scale
        square(c.x + (cell - s) / 2, c.y + (cell - s) / 2, s)
        ctx.shadowBlur = 0
      }
    }

    const frame = (t: number) => {
      draw(t)
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0
    }
    const wake = () => {
      if (!animate) return draw(performance.now())
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => {
      layout()
      draw(performance.now())
    })
    ro.observe(root)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      wake()
    })
    io.observe(root)

    const onText = (e: Event) => {
      typed = (e as CustomEvent<{ length: number }>).detail.length
      setCount(typed)
      wake()
    }
    const onFocus = (e: Event) => {
      focused = (e as CustomEvent<{ active: boolean }>).detail.active
      wake()
    }
    const onLaunch = () => {
      launchAt = performance.now()
      wake()
    }
    window.addEventListener(PROMPT_TEXT_EVENT, onText)
    window.addEventListener(PROMPT_EVENT, onFocus)
    window.addEventListener(PROMPT_LAUNCH_EVENT, onLaunch)
    document.addEventListener("visibilitychange", wake)
    wake()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener(PROMPT_TEXT_EVENT, onText)
      window.removeEventListener(PROMPT_EVENT, onFocus)
      window.removeEventListener(PROMPT_LAUNCH_EVENT, onLaunch)
      document.removeEventListener("visibilitychange", wake)
    }
  }, [reduced, cellSize, phoneCellSize, tileOpacity, glowStrength, maxTiles, idle])

  return (
    // fades out at the bottom so the grid doesn't end on a hard line
    <div ref={rootRef} aria-hidden className={cn("pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_calc(100%-160px),transparent)]", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  )
}
