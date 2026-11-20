"use client"

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import Link from "next/link"
import { motion, useDragControls, useReducedMotion } from "motion/react"
import { GripVertical, LayoutGrid, Plus } from "lucide-react"
import { Badge, Button, Card } from "@gogetspace/baseplate"
import { cn } from "@gogetspace/baseplate/cn"
import { DEFAULT_TOOLS, TOOLS, toolById, type HomeLayout, type Peeks, type Project, type Tool, type ToolId, type WidgetSize } from "@gogetspace/modules"
import { WidgetContent } from "./widget-content"
import { ToolGlyph, ToolIcon } from "./tool-icon"
import { useHomeLayout } from "./home-layout"

/** the home screen's order: what a practice checks first, settings last */
const HOME_ORDER: ToolId[] = [
  "appointments", "inbox", "payments", "crm", "contacts", "campaigns", "reviews", "estimates",
  "locations", "sequences", "broadcasts", "helpdesk", "todo", "drive", "settings",
]

const SPAN: Record<WidgetSize, string> = {
  small: "col-span-1 row-span-1",
  wide: "col-span-2 row-span-1",
  large: "col-span-2 row-span-2",
}

const SIZES: { size: WidgetSize; label: string; glyph: ReactNode }[] = [
  { size: "small", label: "Small", glyph: <rect x="5" y="5" width="6" height="6" rx="1.5" /> },
  { size: "wide", label: "Wide", glyph: <rect x="2" y="5" width="12" height="6" rx="1.5" /> },
  { size: "large", label: "Large", glyph: <rect x="2" y="2" width="12" height="12" rx="2" /> },
]

/**
 * Shown on each widget while customising: a handle to move it (drag it, or focus it and use the arrow keys) and the
 * three sizes.
 */
function EditBar({
  tool,
  size,
  onSize,
  onGrab,
  onKey,
}: {
  tool: Tool
  size: WidgetSize
  onSize: (s: WidgetSize) => void
  onGrab: (e: ReactPointerEvent) => void
  onKey: (e: KeyboardEvent) => void
}) {
  return (
    <div
      className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-full border border-line-default bg-surface p-0.5 shadow-soft-sm"
      // the bar's own buttons shouldn't start a drag of the whole widget
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={`Move ${tool.name}`}
        aria-describedby="move-hint"
        title="Drag to move"
        onPointerDown={(e) => {
          e.stopPropagation()
          onGrab(e)
        }}
        onKeyDown={onKey}
        className="grid size-7 cursor-grab touch-none place-items-center rounded-full text-fg-secondary transition-colors duration-150 hover:bg-action-ghost-hover hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring active:cursor-grabbing"
      >
        <GripVertical aria-hidden className="size-4" />
      </button>
      <span aria-hidden className="h-4 w-px bg-line-default" />
      <div role="radiogroup" aria-label={`Size of ${tool.name}`} className="flex gap-0.5">
        {SIZES.map((s) => (
          <button
            key={s.size}
            type="button"
            role="radio"
            aria-checked={size === s.size}
            aria-label={s.label}
            title={s.label}
            onClick={() => onSize(s.size)}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:focus-ring",
              size === s.size ? "bg-action-primary text-fg-on-action" : "text-fg-secondary hover:bg-action-ghost-hover hover:text-fg-primary",
            )}
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
              {s.glyph}
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

/** a widget's grid cell; while customising it can be dragged to a new place (the others make room as it passes) */
function Tile({
  tool,
  size,
  editing,
  reduce,
  onSize,
  onDragOver,
  onStep,
  children,
}: {
  tool: Tool
  size: WidgetSize
  editing: boolean
  reduce: boolean
  onSize: (s: WidgetSize) => void
  /** the widget being dragged is over another one */
  onDragOver: (target: ToolId) => void
  /** keyboard move: -1 earlier, +1 later */
  onStep: (by: -1 | 1) => void
  children: ReactNode
}) {
  const controls = useDragControls()
  const [dragging, setDragging] = useState(false)
  const last = useRef<ToolId | null>(null)

  return (
    <motion.li
      data-tool={tool.id}
      layout={!reduce}
      transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}
      drag={editing}
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      dragElastic={1}
      dragMomentum={false}
      whileDrag={{ scale: 1.04, zIndex: 30 }}
      onDragStart={() => {
        last.current = null
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
      onDrag={(e) => {
        const p = e as PointerEvent
        // the widget under the pointer, other than this one
        const over = document
          .elementsFromPoint(p.clientX, p.clientY)
          .map((el) => (el as HTMLElement).closest?.("[data-tool]") as HTMLElement | null)
          .find((el) => el && el.dataset.tool !== tool.id)
        const id = over?.dataset.tool as ToolId | undefined
        if (id && id !== last.current) {
          last.current = id
          onDragOver(id)
        }
      }}
      // with a mouse the whole widget is the handle; on touch only the grip is, so the page still scrolls
      onPointerDown={(e) => editing && e.pointerType === "mouse" && controls.start(e)}
      className={cn("relative flex min-w-0", SPAN[size], editing && "cursor-grab select-none", dragging && "cursor-grabbing")}
    >
      {children}
      {editing && (
        <EditBar
          tool={tool}
          size={size}
          onSize={onSize}
          onGrab={(e) => controls.start(e)}
          onKey={(e) => {
            const by = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : 0
            if (!by) return
            e.preventDefault()
            onStep(by)
          }}
        />
      )}
    </motion.li>
  )
}

/** one widget: icon and name on top, the tool's peek at the bottom, space between */
function Widget({ tool, size, isNew, children }: { tool: Tool; size: WidgetSize; isNew: boolean; children: ReactNode }) {
  return (
    <>
      <span className="flex flex-col items-start gap-2 @max-[799px]:gap-1.5">
        <ToolGlyph tool={tool} className={cn(size !== "small" && "size-9", "@max-[799px]:size-6")} />
        <span className="flex max-w-full items-center gap-2">
          <span className="truncate type-label-lg text-fg-primary @max-[799px]:type-label-md">{tool.name}</span>
          {isNew && <Badge tone="brand">New</Badge>}
        </span>
      </span>
      <div className="min-w-0">{children}</div>
    </>
  )
}

/**
 * The project's tools as widgets, iOS-style: every widget is a square cell by default (small 1×1) and can be made
 * wide (2×1) or large (2×2), and moved, from Customize. Then the add-ons the project doesn't have yet. Adding one is local to
 * the prototype (a real install goes through billing).
 */
export function HomeTools({ project, peeks, layout, header }: { project: Project; peeks: Peeks; layout: HomeLayout; header: ReactNode }) {
  const [installed, setInstalled] = useState<ToolId[]>(project.installed)
  const [justAdded, setJustAdded] = useState<ToolId[]>([])
  const [editing, setEditing] = useState(false)
  const home = useHomeLayout(project.id, layout)
  const sizes = home.layout.sizes
  const reduce = !!useReducedMotion()
  const [announce, setAnnounce] = useState("")

  const have = new Set<ToolId>([...DEFAULT_TOOLS, ...installed])
  // the person's order first, then anything not in it (a tool added later) in the default order
  const saved = (home.layout.order ?? []).filter((id) => have.has(id))
  const ids = [...saved, ...HOME_ORDER.filter((id) => have.has(id) && !saved.includes(id))]
  const tiles = ids.map(toolById)

  /** put `id` where `target` is now, shifting the rest */
  const move = (id: ToolId, to: number) => {
    const next = ids.filter((x) => x !== id)
    next.splice(Math.max(0, Math.min(to, next.length)), 0, id)
    home.setOrder(next)
    return next
  }
  const step = (id: ToolId, by: -1 | 1) => {
    const next = move(id, ids.indexOf(id) + by)
    setAnnounce(`${toolById(id).name} moved to position ${next.indexOf(id) + 1} of ${next.length}`)
  }
  const available = TOOLS.filter((t) => t.kind === "addon" && !have.has(t.id))

  const add = (id: ToolId) => {
    setInstalled((x) => [...x, id])
    setJustAdded((x) => [...x, id])
  }

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {header}
          <Button variant={editing ? "primary" : "secondary"} size="sm" leadingIcon={editing ? undefined : <LayoutGrid />} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            {editing ? "Done" : "Customize"}
          </Button>
        </div>
        {editing && (
          <p id="move-hint" className="-mt-4 type-body-sm text-fg-secondary">
            Drag a tool to move it, or focus its handle and use the arrow keys. Pick a size: small, wide or large. Your layout is saved for this website.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {announce}
        </p>

        {/* square cells: the row height is one column's width, measured from this container */}
        <div className="@container">
          <ul className="grid grid-flow-row-dense grid-cols-2 gap-(--gap) [--cols:2] [--gap:12px] auto-rows-[calc((100cqw_-_(var(--cols)_-_1)_*_var(--gap))_/_var(--cols))] @[600px]:grid-cols-4 @[600px]:[--cols:4] @[600px]:[--gap:16px] @[1180px]:grid-cols-6 @[1180px]:[--cols:6]">
            {tiles.map((tool) => {
              const size = sizes[tool.id] ?? "small"
              const body = (
                <Widget tool={tool} size={size} isNew={justAdded.includes(tool.id)}>
                  <WidgetContent tool={tool.id} size={size} data={peeks[tool.id]} project={project} />
                </Widget>
              )
              const cardClass = cn(
                "flex h-full w-full flex-col justify-between gap-3 overflow-hidden @max-[799px]:gap-2",
                size === "small" ? "p-4 @max-[799px]:p-3.5" : "p-5 @max-[799px]:p-4",
              )
              return (
                <Tile
                  key={tool.id}
                  tool={tool}
                  size={size}
                  editing={editing}
                  reduce={reduce}
                  onSize={(s) => home.setSize(tool.id, s)}
                  onDragOver={(target) => move(tool.id, ids.indexOf(target))}
                  onStep={(by) => step(tool.id, by)}
                >
                  {editing ? (
                    <Card className={cn(cardClass, "outline-2 outline-offset-2 outline-dashed outline-line-strong")}>{body}</Card>
                  ) : (
                    <Link href={`/${project.id}/${tool.id}`} className="flex w-full rounded-lg focus-visible:outline-none focus-visible:focus-ring">
                      <Card interactive className={cardClass}>
                        {body}
                      </Card>
                    </Link>
                  )}
                </Tile>
              )
            })}
          </ul>
        </div>
      </div>

      {available.length > 0 && (
        <section aria-labelledby="add-title" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="add-title" className="type-h5 text-fg-primary">
              Add to {project.name}
            </h2>
            <p className="type-body-sm text-fg-secondary">Each tool is added to this website only. It’s ready as soon as you add it.</p>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {available.map((tool) => (
              <li key={tool.id} className="flex items-center gap-4 rounded-lg border border-line-default bg-surface p-4">
                <ToolIcon tool={tool} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-label-md text-fg-primary">{tool.name}</span>
                  <span className="type-body-sm text-fg-secondary">{tool.description}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  {tool.price != null && <span className="type-label-sm text-fg-secondary tabular-nums">${tool.price}/mo</span>}
                  <Button size="sm" variant="secondary" leadingIcon={<Plus />} onClick={() => add(tool.id)} aria-label={`Add ${tool.name}`}>
                    Add
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
