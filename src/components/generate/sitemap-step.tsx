"use client"

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react"
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, CircleCheck, File, House, Lock, Maximize, Minus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, IconButton, SegmentedControl, Tooltip, Badge } from "@/components/ui"
import { cn } from "@/lib/cn"
import { flatten, sectionsOf, unlockedIds, type PageNode, type Plan } from "@/lib/bakti/sitemap"
import { useGen } from "./gen-provider"

const PLANS: { id: Plan; label: string; pages: string }[] = [
  { id: "free", label: "Free", pages: "Homepage only" },
  { id: "starter", label: "Starter", pages: "Up to 5 pages" },
  { id: "business", label: "Business", pages: "All pages" },
]

/* ---------- tree helpers ---------- */
const mapTree = (n: PageNode, fn: (n: PageNode) => PageNode): PageNode => fn({ ...n, children: n.children?.map((c) => mapTree(c, fn)) })
const removeNode = (n: PageNode, id: string): PageNode => ({ ...n, children: n.children?.filter((c) => c.id !== id).map((c) => removeNode(c, id)) })
const slugify = (t: string) => t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page"

let counter = 0
const uid = () => `custom-${Date.now().toString(36)}${counter++}`

/**
 * Page plan: the list (4 of 12 columns) and the pannable, zoomable map (8 of 12) side by side, with rename / add /
 * remove and plan limits. Pages the plan builds show the sections the agent will generate on them. On small screens
 * the list comes first and the map follows at a fixed height; the whole step scrolls.
 */
export function SitemapStep() {
  const { s, dispatch } = useGen()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const unlocked = unlockedIds(s.sitemap, s.plan)
  const pages = flatten(s.sitemap)
  const locked = Math.max(0, pages.length - unlocked.size)
  const sectionCount = pages.filter((p) => unlocked.has(p.id)).reduce((n, p) => n + sectionsOf(p).length, 0)

  const update = (root: PageNode) => dispatch({ type: "sitemap", sitemap: root })
  const rename = (id: string, title: string) => {
    if (title.trim()) update(mapTree(s.sitemap, (n) => (n.id === id ? { ...n, title: title.trim() } : n)))
    setRenaming(null)
  }
  const add = (parentId: string) => {
    const id = uid()
    const title = "New page"
    update(mapTree(s.sitemap, (n) => (n.id === parentId ? { ...n, children: [...(n.children ?? []), { id, title, slug: slugify(title) + "-" + id.slice(-4), purpose: "Added by you", custom: true }] } : n)))
    setRenaming(id)
  }
  const remove = (id: string) => update(removeNode(s.sitemap, id))

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const allExpanded = pages.every((p) => expanded.has(p.id))
  const toggleAll = () => setExpanded(allExpanded ? new Set() : new Set(pages.map((p) => p.id)))

  const nodeProps = { unlocked, renaming, active, expanded, onToggle: toggle, onRename: rename, onStartRename: setRenaming, onAdd: add, onRemove: remove }

  return (
    <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 lg:mx-0 lg:grid lg:grid-cols-12 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
      {/* list */}
      <section aria-label="Pages" className="flex shrink-0 flex-col rounded-lg border border-line-default bg-canvas lg:col-span-4 lg:min-h-0 lg:overflow-hidden">
        <ul className="flex flex-col gap-1.5 p-2 sm:p-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {pages.map((p) => {
            const included = unlocked.has(p.id)
            const sections = sectionsOf(p)
            return (
              <li
                key={p.id}
                onPointerEnter={() => setActive(p.id)}
                onPointerLeave={() => setActive(null)}
                className={cn("rounded-md border px-3 py-2.5 transition-colors", included ? "border-line-default bg-surface" : "border-transparent bg-subtle", active === p.id && "border-blue-500")}
                style={{ marginLeft: Math.min(p.depth, 2) * 16 }}
              >
                <div className="flex items-center gap-2.5">
                  <PageIcon page={p} muted={!included} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    {renaming === p.id ? (
                      <RenameInput value={p.title} onDone={(t) => rename(p.id, t)} />
                    ) : (
                      <span className={cn("truncate type-label-md", included ? "text-fg-primary" : "text-fg-tertiary")}>{p.title}</span>
                    )}
                    <span className="truncate type-body-sm text-fg-tertiary">/{p.slug}</span>
                  </span>
                  <StatusIcon included={included} home={p.id === "home"} />
                  <NodeMenu page={p} {...nodeProps} />
                </div>
                {included ? (
                  <ol aria-label={`Sections on ${p.title}`} className="mt-2 flex flex-wrap gap-1 pl-7.5">
                    {sections.map((sec, i) => (
                      <li key={sec + i}>
                        <Badge dot={false}>{sec}</Badge>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-1 pl-7.5 type-caption text-fg-tertiary">
                    {sections.length} sections planned · built when you upgrade
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        {/* summary + plan, pinned to the bottom of the list */}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-b-lg border-t border-line-default bg-surface p-3 lg:static">
          <p className="flex min-w-[140px] flex-1 flex-col">
            <strong className="type-label-md whitespace-nowrap text-fg-primary">
              {pages.length} {pages.length === 1 ? "page" : "pages"} · {sectionCount} sections
            </strong>
            <span className="type-caption text-fg-tertiary">{locked > 0 ? `${locked} locked until you upgrade` : "Every page is included"}</span>
          </p>
          <SegmentedControl label="Plan" size="sm" value={s.plan} onChange={(plan) => dispatch({ type: "plan", plan })} options={PLANS.map((p) => ({ value: p.id, label: p.label, tooltip: p.pages }))} />
        </div>
      </section>

      {/* map */}
      <section aria-label="Sitemap" className="relative flex h-[380px] shrink-0 flex-col overflow-hidden rounded-lg border border-line-default bg-canvas lg:col-span-8 lg:h-auto lg:min-h-0">
        <MapView root={s.sitemap} nodeProps={nodeProps} allExpanded={allExpanded} onToggleAll={toggleAll} />
        {pages.length === 1 && (
          <p className="pointer-events-none absolute inset-x-0 top-4 text-center type-body-sm text-fg-tertiary">Just a homepage — that&apos;s a perfectly good one-page site.</p>
        )}
      </section>
    </div>
  )
}

interface NodeProps {
  unlocked: Set<string>
  renaming: string | null
  active: string | null
  expanded: Set<string>
  onToggle: (id: string) => void
  onRename: (id: string, title: string) => void
  onStartRename: (id: string) => void
  onAdd: (parentId: string) => void
  onRemove: (id: string) => void
}

function MapView({ root, nodeProps, allExpanded, onToggleAll }: { root: PageNode; nodeProps: NodeProps; allExpanded: boolean; onToggleAll: () => void }) {
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const fit = () => {
    const v = viewport.current, c = content.current
    if (!v || !c) return
    // fit the whole tree, but on a narrow map keep nodes readable (pan to see the rest), centred on the homepage
    const fitK = Math.min(1, (v.clientWidth - 48) / c.scrollWidth, (v.clientHeight - 96) / c.scrollHeight)
    const k = v.clientWidth < 600 ? Math.max(fitK, 0.6) : fitK
    setT({ k, x: (v.clientWidth - c.scrollWidth * k) / 2, y: Math.max(32, (v.clientHeight - 56 - c.scrollHeight * k) / 2) })
  }
  // fit once on open and whenever the tree changes size a lot
  const count = flatten(root).length
  useEffect(() => {
    fit()
  }, [count])

  const onDown = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest("button, input, [role=menu]")) return
    drag.current = { x: e.clientX, y: e.clientY, ox: t.x, oy: t.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent) => {
    const d = drag.current
    if (d) setT((p) => ({ ...p, x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }))
  }
  const zoom = (f: number) => setT((p) => ({ ...p, k: Math.max(0.3, Math.min(1.6, p.k * f)) }))

  return (
    <div
      ref={viewport}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={() => (drag.current = null)}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) zoom(e.deltaY < 0 ? 1.1 : 0.9)
        else setT((p) => ({ ...p, x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }}
      className="relative flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      style={{ backgroundImage: "radial-gradient(var(--color-line-default) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      <div ref={content} className="sitemap-tree absolute top-0 left-0 w-max origin-top-left" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})` }}>
        <ul>
          <TreeNode node={root} {...nodeProps} />
        </ul>
      </div>
      <button
        type="button"
        onClick={onToggleAll}
        aria-pressed={allExpanded}
        className="absolute top-3 right-3 flex h-9 items-center gap-1.5 rounded-full border border-line-default bg-surface px-3 type-label-md text-fg-secondary shadow-soft-sm hover:text-fg-primary"
      >
        {allExpanded ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
        <span className="max-sm:sr-only">{allExpanded ? "Collapse sections" : "Expand sections"}</span>
      </button>
      <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full border border-line-default bg-surface p-1 shadow-soft-sm">
        <IconButton aria-label="Zoom out" shape="round" onClick={() => zoom(0.85)}><Minus /></IconButton>
        <span className="w-11 text-center type-label-sm text-fg-secondary tabular-nums">{Math.round(t.k * 100)}%</span>
        <IconButton aria-label="Zoom in" shape="round" onClick={() => zoom(1.15)}><Plus /></IconButton>
        <IconButton aria-label="Fit to screen" shape="round" onClick={fit}><Maximize /></IconButton>
      </div>
      <p className="absolute bottom-4 left-4 hidden type-caption text-fg-tertiary sm:block">Drag to move · ⌘/Ctrl + scroll to zoom</p>
    </div>
  )
}

function TreeNode({ node, ...p }: { node: PageNode } & NodeProps) {
  const included = p.unlocked.has(node.id)
  const open = p.expanded.has(node.id)
  const sections = sectionsOf(node)
  return (
    <li>
      <div
        className={cn(
          "flex w-[264px] flex-col rounded-sm border transition-shadow",
          included ? "border-line-default bg-surface" : "border-line-default bg-subtle",
          p.active === node.id && "border-blue-500 ring-2 ring-blue-500/30",
        )}
      >
        <div className="flex items-center gap-1.5 py-2.5 pr-1.5 pl-4">
          <PageIcon page={node} muted={!included} />
          {p.renaming === node.id ? (
            <RenameInput value={node.title} onDone={(t) => p.onRename(node.id, t)} />
          ) : (
            <span className="flex min-w-0 flex-1 flex-col items-start">
              <span className={cn("line-clamp-2 type-label-lg", included ? "text-fg-primary" : "text-fg-tertiary")}>{node.title}</span>
              <button
                type="button"
                onClick={() => p.onToggle(node.id)}
                aria-expanded={open}
                className="-ml-1 flex items-center gap-0.5 rounded-sm px-1 type-caption text-fg-tertiary hover:bg-subtle hover:text-fg-primary"
              >
                {sections.length} sections{included ? "" : " · locked"}
                <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
              </button>
            </span>
          )}
          <StatusIcon included={included} home={node.id === "home"} />
          <NodeMenu page={node} {...p} />
        </div>
        {open && (
          // not <ol>/<li>: the tree's connector lines are drawn on every li inside .sitemap-tree
          <div role="list" aria-label={`Sections on ${node.title}`} className="flex flex-col gap-0.5 border-t border-line-default px-3 py-2">
            {sections.map((sec, i) => (
              <span key={sec + i} role="listitem" className={cn("flex items-baseline gap-2 type-body-sm", included ? "text-fg-secondary" : "text-fg-tertiary")}>
                <span className="w-4 shrink-0 text-right type-caption text-fg-tertiary tabular-nums">{i + 1}</span>
                {sec}
              </span>
            ))}
          </div>
        )}
      </div>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} {...p} />
          ))}
        </ul>
      )}
    </li>
  )
}

function PageIcon({ page, muted }: { page: PageNode; muted?: boolean }) {
  const Icon = page.id === "home" ? House : File
  return <Icon className={cn("size-5 shrink-0", muted ? "text-fg-tertiary" : "text-fg-primary")} />
}

function StatusIcon({ included, home }: { included: boolean; home?: boolean }) {
  return included ? (
    <Tooltip content={home ? "Always built" : "Included in your plan"}>
      <CircleCheck className="size-5 shrink-0 text-blue-500" aria-label="Included" />
    </Tooltip>
  ) : (
    <Tooltip content="Planned — built when you upgrade">
      <Lock className="size-5 shrink-0 text-fg-tertiary" aria-label="Needs an upgrade" />
    </Tooltip>
  )
}

function NodeMenu({ page, onStartRename, onAdd, onRemove }: { page: PageNode } & NodeProps) {
  const home = page.id === "home"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton aria-label={`Options for ${page.title}`} tone="muted">
          <MoreHorizontal />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[70]">
        <DropdownMenuItem onSelect={() => onStartRename(page.id)}>
          <Pencil className="size-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAdd(page.id)}>
          <Plus className="size-4" /> Add a page under this
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="danger" disabled={home} onSelect={() => onRemove(page.id)}>
          <Trash2 className="size-4" /> {home ? "The homepage can't be removed" : page.children?.length ? "Remove with its pages" : "Remove page"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RenameInput({ value, onDone }: { value: string; onDone: (v: string) => void }) {
  const [v, setV] = useState(value)
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onDone(v)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onDone(v)
        if (e.key === "Escape") onDone(value)
      }}
      onFocus={(e) => e.currentTarget.select()}
      aria-label="Page name"
      className="h-7 min-w-0 flex-1 rounded-sm border border-blue-500 bg-surface px-2 type-label-md outline-none"
    />
  )
}


