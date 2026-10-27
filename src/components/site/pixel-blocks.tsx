"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { PROMPT_EVENT } from "./prompt-events"

/**
 * Retro falling blocks behind the hero: autoplay, click-to-drop at the cursor (the cursor previews the
 * next piece), row clears, and a dissolve/rebuild when the visitor starts typing in the AI prompt input.
 * Ported from the Framer code component "PixelBlocks".
 */

export interface PixelBlocksProps {
  cellSize?: number
  phoneCellSize?: number
  colors?: string[]
  flash?: string
  showGrid?: boolean
  gridColor?: string
  gridOpacity?: number
  autoplay?: boolean
  /** seconds between autoplay pieces */
  interval?: number
  /** rows per second */
  speed?: number
  clickToDrop?: boolean
  cursorPreview?: boolean
  reactToPrompt?: boolean
  /** rows of blocks to start with */
  prefill?: number
  opacity?: number
  /** opacity multiplier for blocks behind the hero copy */
  fade?: number
  /** the faded "copy zone" — centred column of this width, between top and bottom insets */
  zoneWidth?: number
  zoneTop?: number
  zoneBottom?: number
  phoneZoneTop?: number
  phoneZoneBottom?: number
  className?: string
}

type Shape = { cells: number[][]; w: number; h: number; bottom: number[] }
type Piece = { shape: Shape; x: number; y: number; color: number; acc: number; born: number }
type Mode = "play" | "wiping" | "cleared" | "restoring"

// Tetrominoes: I, O, T, L, J, S, Z
const BASE: number[][][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[1, 0], [1, 1], [1, 2], [0, 2]],
  [[1, 0], [2, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
]
const normalize = (c: number[][]) => {
  const mx = Math.min(...c.map((p) => p[0]))
  const my = Math.min(...c.map((p) => p[1]))
  return c.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0])
}
const SHAPES: Shape[][] = BASE.map((s) => {
  const out: Shape[] = []
  const seen = new Set<string>()
  let cur = s
  for (let i = 0; i < 4; i++) {
    const n = normalize(cur)
    const k = JSON.stringify(n)
    if (!seen.has(k)) {
      seen.add(k)
      const w = Math.max(...n.map((p) => p[0])) + 1
      const h = Math.max(...n.map((p) => p[1])) + 1
      const bottom = new Array(w).fill(-1)
      for (const [x, y] of n) bottom[x] = Math.max(bottom[x], y)
      out.push({ cells: n, w, h, bottom })
    }
    cur = cur.map(([x, y]) => [y, -x])
  }
  return out
})

const easeOutBack = (p: number) => {
  const c1 = 1.4, c3 = c1 + 1
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}

const FLASH = 360, BREAK = 260, COLLAPSE = 280, DISSOLVE = 900, POP = 160, FLICKER = 140
const REVERT_SCROLL = 160

export function PixelBlocks({
  cellSize = 24,
  phoneCellSize = 16,
  colors = ["#2F5BFF", "#F2553A", "#FFC21F", "#12B76A"],
  flash = "#FFFFFF",
  showGrid = true,
  gridColor = "#E4E1DA",
  gridOpacity = 0.6,
  autoplay = true,
  interval = 1.2,
  speed = 14,
  clickToDrop = true,
  cursorPreview = true,
  reactToPrompt = true,
  prefill = 4,
  opacity = 1,
  fade = 0.25,
  zoneWidth = 680,
  zoneTop = 120,
  zoneBottom = 150,
  phoneZoneTop = 64,
  phoneZoneBottom = 96,
  className,
}: PixelBlocksProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const colorKey = colors.join("|")

  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const animate = !reduced
    const pal = colorKey.split("|")

    let W = 0, H = 0, dpr = 1, cell = cellSize, cols = 0, rows = 0, ox = 0, oy = 0
    let zTop = zoneTop, zBottom = zoneBottom
    let board: Uint8Array = new Uint8Array(0)
    let active: Piece[] = []
    let queue: { x: number; y: number }[] = []
    let clearing: { rows: number[]; t: number } | null = null
    let collapse: { dist: Int16Array; t: number } | null = null
    let dissolve: { delay: Float32Array; t: number } | null = null
    let mode: Mode = "play"
    let wipe: { t: number; snap: Uint8Array; delay: Float32Array; pieces: Piece[]; pieceDelay: number[][] } | null = null
    let restore: { t: number; snap: Uint8Array; delay: Float32Array } | null = null
    let wipeScrollY = 0
    let spawnAcc = 0
    let inView = true
    const pointer = { x: 0, y: 0, inside: false }
    const randomShape = () => {
      const set = SHAPES[Math.floor(Math.random() * SHAPES.length)]
      return set[Math.floor(Math.random() * set.length)]
    }
    const randomColor = () => Math.floor(Math.random() * pal.length)
    const randDelays = (n: number) => {
      const d = new Float32Array(n)
      for (let i = 0; i < n; i++) d[i] = Math.random() * (DISSOLVE - 200)
      return d
    }
    let next = { shape: randomShape(), color: randomColor(), born: 0 }

    const at = (c: number, r: number) => board[r * cols + c]
    const tops = () => {
      const t = new Int16Array(cols).fill(rows)
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (at(c, r)) { t[c] = r; break }
      return t
    }
    const rowCounts = () => {
      const n = new Int16Array(rows)
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (at(c, r)) n[r]++
      return n
    }
    // pick a sensible landing spot: completed lines good, holes and height bad, a little randomness
    const choose = () => {
      const tp = tops(), rc = rowCounts()
      let best: { shape: Shape; x: number; y: number } | null = null, bestScore = -1e9
      for (const sh of SHAPES[Math.floor(Math.random() * SHAPES.length)]) {
        for (let x = 0; x <= cols - sh.w; x++) {
          let y = 1e9
          for (let dx = 0; dx < sh.w; dx++) y = Math.min(y, tp[x + dx] - 1 - sh.bottom[dx])
          if (y < 0) continue
          let holes = 0
          for (let dx = 0; dx < sh.w; dx++) holes += tp[x + dx] - 1 - (y + sh.bottom[dx])
          let lines = 0
          for (let ry = y; ry < y + sh.h; ry++) {
            const n = sh.cells.filter((p) => p[1] + y === ry).length
            if (rc[ry] + n === cols) lines++
          }
          const score = lines * 10 - holes * 4 - (rows - y) * 0.4 + Math.random() * 2.5
          if (score > bestScore) { bestScore = score; best = { shape: sh, x, y } }
        }
      }
      return best
    }
    const fullRows = () => {
      const out: number[] = []
      for (let r = 0; r < rows; r++) {
        let full = true
        for (let c = 0; c < cols; c++) if (!at(c, r)) { full = false; break }
        if (full) out.push(r)
      }
      return out
    }
    const removeRows = (cleared: number[]) => {
      const nextBoard = new Uint8Array(cols * rows)
      const dist = new Int16Array(rows)
      let write = rows - 1, below = 0
      for (let r = rows - 1; r >= 0; r--) {
        if (cleared.includes(r)) { below++; continue }
        for (let c = 0; c < cols; c++) nextBoard[write * cols + c] = at(c, r)
        dist[write] = below
        write--
      }
      board = nextBoard
      return dist
    }
    const doPrefill = (n: number) => {
      for (let i = 0; i < n; i++) {
        const p = choose()
        if (!p) break
        const color = randomColor() + 1
        for (const [dx, dy] of p.shape.cells) board[(p.y + dy) * cols + p.x + dx] = color
        const f = fullRows()
        if (f.length) removeRows(f)
      }
    }
    const init = () => {
      W = root.clientWidth || 1200
      H = root.clientHeight || 800
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const phone = W < 600
      cell = phone ? phoneCellSize : cellSize
      zTop = phone ? phoneZoneTop : zoneTop
      zBottom = phone ? phoneZoneBottom : zoneBottom
      cols = Math.max(4, Math.floor(W / cell))
      rows = Math.max(6, Math.floor(H / cell))
      ox = Math.floor((W - cols * cell) / 2)
      oy = Math.floor(H - rows * cell)
      board = new Uint8Array(cols * rows)
      active = []; clearing = null; collapse = null; dissolve = null; spawnAcc = 0
      mode = "play"; wipe = null; restore = null
      doPrefill(Math.round((cols * Math.max(0, prefill)) / 4))
    }

    const blocked = (p: Piece, ny: number): "free" | "lock" | "wait" => {
      for (const [dx, dy] of p.shape.cells) {
        const cx = p.x + dx, cy = ny + dy
        if (cy >= rows) return "lock"
        if (cy >= 0 && at(cx, cy)) return "lock"
      }
      for (const o of active) {
        if (o === p) continue
        for (const [dx, dy] of p.shape.cells)
          for (const [ex, ey] of o.shape.cells) if (p.x + dx === o.x + ex && ny + dy === o.y + ey) return "wait"
      }
      return "free"
    }
    const occupied = (shape: Shape, x: number, y: number) => {
      for (const [dx, dy] of shape.cells) {
        const cx = x + dx, cy = y + dy
        if (cx < 0 || cx >= cols || cy >= rows) return true
        if (cy >= 0 && at(cx, cy)) return true
        for (const o of active) for (const [ex, ey] of o.shape.cells) if (o.x + ex === cx && o.y + ey === cy) return true
      }
      return false
    }
    const spawn = (shape: Shape, x: number, y: number = -shape.h, color = randomColor()) => {
      if (active.length >= 10) return
      let sy = Math.min(y, rows - shape.h)
      while (sy > -shape.h && occupied(shape, x, sy)) sy--
      if (occupied(shape, x, sy)) return
      active.push({ shape, x, y: sy, color, acc: 0, born: performance.now() })
    }
    const cellAt = (px: number, py: number, sh: Shape) => {
      const col = Math.floor((px - ox) / cell), row = Math.floor((py - oy) / cell)
      return { x: Math.max(0, Math.min(cols - sh.w, col - Math.floor(sh.w / 2))), y: row - Math.floor(sh.h / 2) }
    }
    const spawnNextAt = (px: number, py: number) => {
      const p = cellAt(px, py, next.shape)
      spawn(next.shape, p.x, p.y, next.color)
      next = { shape: randomShape(), color: randomColor(), born: performance.now() }
    }
    const lock = (p: Piece) => {
      active = active.filter((o) => o !== p)
      let overflow = false
      for (const [dx, dy] of p.shape.cells) {
        const cy = p.y + dy
        if (cy < 0) { overflow = true; continue }
        board[cy * cols + p.x + dx] = p.color + 1
      }
      if (overflow || tops().some((t) => t < 3)) {
        dissolve = { delay: randDelays(cols * rows), t: 0 }
        return
      }
      const f = fullRows()
      if (f.length) clearing = { rows: f, t: 0 }
    }

    // ---------- prompt focus: dissolve the board, then flicker it back ----------
    const settle = () => {
      if (clearing) { removeRows(clearing.rows); clearing = null }
      collapse = null
      if (dissolve) { dissolve = null; board = new Uint8Array(cols * rows); doPrefill(Math.round((cols * Math.max(0, prefill)) / 8)) }
      if (mode === "restoring" && restore) { board = restore.snap; restore = null; mode = "play" }
    }
    const startWipe = () => {
      if (mode === "wiping" || mode === "cleared") return
      settle()
      const snap = board.slice()
      wipe = { t: 0, snap, delay: randDelays(cols * rows), pieces: active, pieceDelay: active.map((p) => p.shape.cells.map(() => Math.random() * (DISSOLVE - 200))) }
      active = []; queue = []
      board = new Uint8Array(cols * rows)
      wipeScrollY = window.scrollY
      mode = animate ? "wiping" : "cleared"
      if (!animate) draw()
    }
    const startRestore = () => {
      if (mode !== "wiping" && mode !== "cleared") return
      const snap = wipe ? wipe.snap : board.slice()
      wipe = null
      board = new Uint8Array(cols * rows)
      if (!animate) { board = snap; mode = "play"; draw(); return }
      restore = { t: 0, snap, delay: randDelays(cols * rows) }
      mode = "restoring"
    }

    const update = (dt: number) => {
      if (mode === "wiping" && wipe) { wipe.t += dt; if (wipe.t >= DISSOLVE) mode = "cleared"; return }
      if (mode === "cleared") return
      if (mode === "restoring" && restore) {
        restore.t += dt
        if (restore.t >= DISSOLVE) { board = restore.snap; restore = null; mode = "play"; spawnAcc = 0 }
        return
      }
      if (clearing) {
        clearing.t += dt
        if (clearing.t >= FLASH + BREAK) { collapse = { dist: removeRows(clearing.rows), t: 0 }; clearing = null }
        return
      }
      if (collapse) { collapse.t += dt; if (collapse.t >= COLLAPSE) collapse = null; return }
      if (dissolve) {
        dissolve.t += dt
        if (dissolve.t >= DISSOLVE) { dissolve = null; board = new Uint8Array(cols * rows); active = []; doPrefill(Math.round((cols * Math.max(0, prefill)) / 8)) }
        return
      }
      while (queue.length) { const q = queue.shift()!; spawnNextAt(q.x, q.y) }
      if (autoplay) {
        spawnAcc += dt
        if (spawnAcc >= Math.max(0.2, interval) * 1000 && active.length < 4) {
          spawnAcc = 0
          const p = choose()
          if (p) spawn(p.shape, p.x)
        }
      }
      const step = 1000 / Math.max(1, speed)
      for (const p of [...active].sort((a, b) => b.y - a.y)) {
        p.acc += dt
        while (p.acc >= step && active.includes(p)) {
          p.acc -= step
          const s = blocked(p, p.y + 1)
          if (s === "free") p.y++
          else if (s === "lock") { lock(p); break }
          else { p.acc = 0; break }
        }
        if (clearing || dissolve) break
      }
    }

    const alphaAt = (px: number, py: number) => {
      const half = Math.min(zoneWidth, W) / 2
      const dx = Math.max(0, Math.abs(px - W / 2) - half)
      const dy = Math.max(0, zTop - py, py - (H - zBottom))
      return fade + (1 - fade) * Math.min(1, Math.max(dx, dy) / (cell * 2))
    }
    const drawCell = (px: number, py: number, s: number, ci: number, alpha: number, flashOn = false, scale = 1) => {
      const g = Math.max(1, Math.round(s / 12))
      let w = s - g * 2
      if (scale !== 1) w = Math.max(2, Math.round((w * scale) / 2) * 2)
      if (w <= 1) return
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity * alpha))
      ctx.fillStyle = flashOn ? flash : pal[ci % pal.length]
      ctx.fillRect(Math.round(px + (s - w) / 2), Math.round(py + (s - w) / 2), w, w)
    }
    const drawLineClear = (px: number, py: number, ci: number, a: number, t: number) => {
      if (t < FLASH) { if (Math.floor(t / 60) % 2 === 0) drawCell(px, py, cell, ci, a, true); return }
      const q = Math.min(1, (t - FLASH) / BREAK)
      if (q >= 1) return
      const half = Math.max(2, Math.round((cell / 2) * (1 - q * 0.6)))
      ctx.globalAlpha = opacity * a * (1 - q)
      ctx.fillStyle = pal[ci % pal.length]
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const cx = px + cell / 2 + sx * (cell / 4 + q * cell * 0.6)
        const cy = py + cell / 2 + sy * (cell / 4) + q * q * cell * 1.2
        ctx.fillRect(Math.round(cx - half / 2), Math.round(cy - half / 2), half, half)
      }
    }
    const vanished = (t: number, d: number) => t > d || (d - t < FLICKER && Math.floor(t / 50) % 2 === 1)
    const appeared = (t: number, d: number) => t >= d && !(t - d < FLICKER && Math.floor(t / 50) % 2 === 1)
    const popScale = (born: number) => {
      const age = performance.now() - born
      return age >= POP ? 1 : [0.4, 0.7, 1, 1][Math.min(3, Math.floor((age / POP) * 4))]
    }

    let cursorStyle = ""
    const setCursor = (c: string) => { if (c !== cursorStyle) { cursorStyle = c; canvas.style.cursor = c } }

    function draw() {
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, W, H)
      if (showGrid && gridOpacity > 0) {
        ctx.fillStyle = gridColor
        for (let r = 0; r <= rows; r++)
          for (let c = 0; c <= cols; c++) {
            const px = ox + c * cell, py = oy + r * cell
            const a = opacity * gridOpacity * alphaAt(Math.min(px + cell / 2, W), Math.min(py + cell / 2, H))
            if (a <= 0.01) continue
            ctx.globalAlpha = a
            if (c < cols) ctx.fillRect(px, py, cell, 1)
            if (r < rows) ctx.fillRect(px, py, 1, cell)
          }
      }
      if (mode === "wiping" && wipe) {
        const w = wipe
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const v = w.snap[r * cols + c]
            if (!v || vanished(w.t, w.delay[r * cols + c])) continue
            const px = ox + c * cell, py = oy + r * cell
            drawCell(px, py, cell, v - 1, alphaAt(px + cell / 2, py + cell / 2))
          }
        w.pieces.forEach((p, pi) =>
          p.shape.cells.forEach(([dx, dy], ci) => {
            if (vanished(w.t, w.pieceDelay[pi][ci])) return
            const px = ox + (p.x + dx) * cell, py = oy + (p.y + dy) * cell
            drawCell(px, py, cell, p.color, alphaAt(px + cell / 2, py + cell / 2))
          }),
        )
      } else if (mode === "restoring" && restore) {
        const rs = restore
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const v = rs.snap[r * cols + c]
            if (!v || !appeared(rs.t, rs.delay[r * cols + c])) continue
            const px = ox + c * cell, py = oy + r * cell
            drawCell(px, py, cell, v - 1, alphaAt(px + cell / 2, py + cell / 2))
          }
      } else if (mode === "play") {
        const cp = collapse ? Math.min(1, collapse.t / COLLAPSE) : 1
        for (let r = 0; r < rows; r++) {
          const isClearing = clearing?.rows.includes(r)
          const yOff = collapse && collapse.dist[r] ? Math.round((-collapse.dist[r] * cell * (1 - easeOutBack(cp))) / 2) * 2 : 0
          for (let c = 0; c < cols; c++) {
            const v = at(c, r)
            if (!v) continue
            const px = ox + c * cell, py = oy + r * cell + yOff
            const a = alphaAt(px + cell / 2, py + cell / 2)
            if (dissolve && vanished(dissolve.t, dissolve.delay[r * cols + c])) continue
            if (isClearing && clearing) { drawLineClear(px, py, v - 1, a, clearing.t); continue }
            drawCell(px, py, cell, v - 1, a)
          }
        }
        for (const p of active) {
          const pop = popScale(p.born)
          for (const [dx, dy] of p.shape.cells) {
            const r = p.y + dy
            if (r < -1) continue
            const px = ox + (p.x + dx) * cell, py = oy + r * cell
            drawCell(px, py, cell, p.color, alphaAt(px + cell / 2, py + cell / 2), false, pop)
          }
        }
      }
      // next-piece cursor
      let ghost = false
      if (animate && cursorPreview && clickToDrop && mode === "play" && pointer.inside) {
        const rect = canvas!.getBoundingClientRect()
        const lx = ((pointer.x - rect.left) * W) / (rect.width || W)
        const ly = ((pointer.y - rect.top) * H) / (rect.height || H)
        if (lx >= 0 && ly >= 0 && lx <= W && ly <= H) {
          ghost = true
          const pop = popScale(next.born)
          const p = cellAt(lx, ly, next.shape)
          for (const [dx, dy] of next.shape.cells) drawCell(ox + (p.x + dx) * cell, oy + (p.y + dy) * cell, cell, next.color, 1, false, pop)
        }
      }
      setCursor(ghost ? "none" : clickToDrop && mode === "play" && animate ? "pointer" : "default")
      ctx.globalAlpha = 1
    }

    init()
    draw()

    let raf = 0, last = performance.now()
    const frame = (now: number) => {
      update(Math.min(64, now - last))
      last = now
      draw()
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (!animate || raf || !inView || document.visibilityState !== "visible") return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) start(); else stop() })
    io.observe(root)
    const onVis = () => (document.visibilityState === "visible" ? start() : stop())
    document.addEventListener("visibilitychange", onVis)
    let lastW = W, lastH = H
    const ro = new ResizeObserver(() => {
      const w = root.clientWidth, h = root.clientHeight
      if (Math.abs(w - lastW) > 1 || Math.abs(h - lastH) > 1) { lastW = w; lastH = h; init(); draw() }
    })
    ro.observe(root)
    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: ((e.clientX - rect.left) * W) / (rect.width || W), y: ((e.clientY - rect.top) * H) / (rect.height || H) }
    }
    const onDown = (e: PointerEvent) => {
      if (!clickToDrop || !animate || mode !== "play") return
      const { x, y } = toLocal(e)
      if (clearing || collapse || dissolve) { if (queue.length < 3) queue.push({ x, y }); return }
      spawnNextAt(x, y)
    }
    const onMove = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = true }
    const onLeave = () => { pointer.inside = false }
    const onScroll = () => {
      if ((mode === "wiping" || mode === "cleared") && Math.abs(window.scrollY - wipeScrollY) > REVERT_SCROLL) startRestore()
    }
    const onPrompt = (e: Event) => {
      if (!reactToPrompt) return
      if ((e as CustomEvent<{ active: boolean }>).detail?.active) { if (inView) startWipe() } else startRestore()
    }
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerenter", onMove)
    canvas.addEventListener("pointerleave", onLeave)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener(PROMPT_EVENT, onPrompt)
    start()
    return () => {
      stop(); io.disconnect(); ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerenter", onMove)
      canvas.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener(PROMPT_EVENT, onPrompt)
    }
  }, [cellSize, phoneCellSize, colorKey, flash, showGrid, gridColor, gridOpacity, autoplay, interval, speed, clickToDrop, cursorPreview, reactToPrompt, prefill, opacity, fade, zoneWidth, zoneTop, zoneBottom, phoneZoneTop, phoneZoneBottom, reduced])

  return (
    <div ref={rootRef} aria-hidden className={className}>
      <canvas ref={canvasRef} className="block size-full touch-manipulation [image-rendering:pixelated]" />
    </div>
  )
}
