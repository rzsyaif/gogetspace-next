"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { LayoutGrid, Plus } from "lucide-react"
import { Badge, Button, Card } from "@gogetspace/baseplate"
import { cn } from "@gogetspace/baseplate/cn"
import { DEFAULT_TOOLS, TOOLS, toolById, type HomeLayout, type Peeks, type Project, type Tool, type ToolId, type WidgetSize } from "@gogetspace/modules"
import { WidgetContent } from "./widget-content"
import { ToolGlyph, ToolIcon } from "./tool-icon"
import { useWidgetSizes } from "./widget-size"

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

/** the three sizes, shown on each widget while customising */
function SizePicker({ tool, size, onChange }: { tool: Tool; size: WidgetSize; onChange: (s: WidgetSize) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label={`Size of ${tool.name}`}
      className="absolute top-3 right-3 z-10 flex gap-0.5 rounded-full border border-line-default bg-surface p-0.5 shadow-soft-sm"
    >
      {SIZES.map((s) => (
        <button
          key={s.size}
          type="button"
          role="radio"
          aria-checked={size === s.size}
          aria-label={s.label}
          title={s.label}
          onClick={() => onChange(s.size)}
          className={cn(
            "grid size-8 place-items-center rounded-full transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:focus-ring",
            size === s.size ? "bg-action-primary text-fg-on-action" : "text-fg-secondary hover:bg-action-ghost-hover hover:text-fg-primary",
          )}
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-current">
            {s.glyph}
          </svg>
        </button>
      ))}
    </div>
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
 * wide (2×1) or large (2×2) from Customize. Then the add-ons the project doesn't have yet. Adding one is local to
 * the prototype (a real install goes through billing).
 */
export function HomeTools({ project, peeks, layout, header }: { project: Project; peeks: Peeks; layout: HomeLayout; header: ReactNode }) {
  const [installed, setInstalled] = useState<ToolId[]>(project.installed)
  const [justAdded, setJustAdded] = useState<ToolId[]>([])
  const [editing, setEditing] = useState(false)
  const [sizes, setSize] = useWidgetSizes(project.id, layout.sizes)
  const reduce = useReducedMotion()

  const have = new Set<ToolId>([...DEFAULT_TOOLS, ...installed])
  const tiles = HOME_ORDER.filter((id) => have.has(id)).map(toolById)
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
        {editing && <p className="-mt-4 type-body-sm text-fg-secondary">Pick a size for each tool: small, wide or large. Your layout is saved for this website.</p>}

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
                <motion.li key={tool.id} layout={!reduce} transition={{ type: "spring", duration: 0.45, bounce: 0.12 }} className={cn("relative flex min-w-0", SPAN[size])}>
                  {editing ? (
                    <>
                      <Card className={cn(cardClass, "outline-2 outline-offset-2 outline-dashed outline-line-strong")}>{body}</Card>
                      <SizePicker tool={tool} size={size} onChange={(s) => setSize(tool.id, s)} />
                    </>
                  ) : (
                    <Link href={`/${project.id}/${tool.id}`} className="flex w-full rounded-lg focus-visible:outline-none focus-visible:focus-ring">
                      <Card interactive className={cardClass}>
                        {body}
                      </Card>
                    </Link>
                  )}
                </motion.li>
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
