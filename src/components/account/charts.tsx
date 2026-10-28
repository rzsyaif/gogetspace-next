"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/cn"

export interface Point {
  label: string
  value: number
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

/** clean axis maximum + 4 ticks */
function niceTicks(max: number) {
  const raw = Math.max(1, max) / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!
  return [0, 1, 2, 3, 4].map((i) => i * step)
}

/**
 * Single-series area + line (one hue, so no legend — the card title names it). 2px line, 10% wash,
 * hairline grid, crosshair tooltip on hover/touch, and a visually hidden table for screen readers.
 */
export function AreaChart({ points, height = 240, label, unit }: { points: Point[]; height?: number; label: string; unit: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pad = { l: 40, r: 12, t: 12, b: 28 }
  const ticks = niceTicks(Math.max(...points.map((p) => p.value)))
  const top = ticks[ticks.length - 1]
  const iw = Math.max(0, w - pad.l - pad.r)
  const ih = height - pad.t - pad.b
  const x = (i: number) => pad.l + (points.length < 2 ? 0 : (i / (points.length - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / top) * ih
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("")
  const area = `${line}L${x(points.length - 1).toFixed(1)},${pad.t + ih}L${pad.l},${pad.t + ih}Z`
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(iw / 72))))
  const h = hover != null ? points[hover] : null

  const pick = (clientX: number) => {
    const r = box.current!.getBoundingClientRect()
    const i = Math.round(((clientX - r.left - pad.l) / Math.max(1, iw)) * (points.length - 1))
    setHover(Math.min(points.length - 1, Math.max(0, i)))
  }

  return (
    <div ref={box} className="relative w-full select-none" style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label={`${label}: line chart`} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line-default)" strokeWidth={1} />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fg-tertiary text-[11px] tabular-nums">
                {compact.format(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            // regular ticks, plus the last point — skipping a tick that would crowd it
            (i % every === 0 && (i === points.length - 1 || x(points.length - 1) - x(i) > 56)) || i === points.length - 1 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-fg-tertiary text-[11px]">
                {p.label}
              </text>
            ) : null,
          )}
          <path d={area} fill="var(--color-blue-500)" fillOpacity={0.1} />
          <path d={line} fill="none" stroke="var(--color-blue-500)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {h && hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--color-line-strong)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(h.value)} r={5} fill="var(--color-blue-500)" stroke="var(--color-surface)" strokeWidth={2} />
            </g>
          )}
          {/* end marker on the latest value */}
          {hover == null && points.length > 0 && (
            <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].value)} r={4} fill="var(--color-blue-500)" stroke="var(--color-surface)" strokeWidth={2} />
          )}
          <rect
            x={pad.l}
            y={pad.t}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={(e) => pick(e.clientX)}
            onPointerDown={(e) => pick(e.clientX)}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-sm bg-inverse px-3 py-2 text-fg-inverse shadow-soft-sm"
          style={{ left: Math.min(Math.max(x(hover) - 60, 0), Math.max(0, w - 140)) }}
        >
          <p className="type-caption opacity-80">{h.label}</p>
          <p className="type-label-md tabular-nums">
            {h.value.toLocaleString("en")} {unit}
          </p>
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <th scope="row">{p.label}</th>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Ranked horizontal bars, one hue; value in text ink at the end of the row. */
export function BarList({ rows, format }: { rows: { label: string; sub?: string; value: number }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate type-body-sm text-fg-primary">
              {r.label}
              {r.sub && <span className="ml-2 type-caption text-fg-tertiary">{r.sub}</span>}
            </span>
            <span className="type-label-md text-fg-primary tabular-nums">{format ? format(r.value) : r.value.toLocaleString("en")}</span>
          </div>
          <div className="h-2 rounded-full bg-accent-blue-subtle">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Stat tile: label · value · signed delta vs the previous period. */
export function StatTile({ label, value, delta, upIsGood = true, className }: { label: string; value: string; delta?: number | null; upIsGood?: boolean; className?: string }) {
  const good = delta == null ? null : delta === 0 ? null : (delta > 0) === upIsGood
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border border-line-default bg-surface p-4", className)}>
      <span className="type-body-sm text-fg-secondary">{label}</span>
      <span className="type-h3 text-fg-primary tabular-nums">{value}</span>
      {delta != null && (
        <span className={cn("type-caption tabular-nums", good === null ? "text-fg-tertiary" : good ? "text-status-success-text" : "text-status-error-text")}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "–"} {Math.abs(Math.round(delta * 100))}% vs previous period
        </span>
      )}
    </div>
  )
}
