"use client"

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react"
import { CircleCheck, File, House, List, Lock, Map as MapIcon, Maximize, Minus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Tooltip } from "@/components/ui"
import { cn } from "@/lib/cn"
import { flatten, unlockedIds, type PageNode, type Plan } from "@/lib/bakti/sitemap"
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

/** Page plan as a pannable, zoomable map (or a list), with rename / add / remove and plan limits. */
export function SitemapStep() {
  const { s, dispatch } = useGen()
  const [view, setView] = useState<"map" | "list">(() => (typeof window !== "undefined" && window.innerWidth < 810 ? "list" : "map"))
  const [renaming, setRenaming] = useState<string | null>(null)
  const unlocked = unlockedIds(s.sitemap, s.plan)
  const pages = flatten(s.sitemap)
  const locked = pages.length - unlocked.size > 0 ? pages.length - Math.min(unlocked.size, pages.length) : 0

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

  const nodeProps = { unlocked, renaming, onRename: rename, onStartRename: setRenaming, onAdd: add, onRemove: remove }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-md border border-line-default bg-canvas p-3 sm:flex-row sm:items-center">
        <p className="flex-1 type-body-sm text-fg-secondary">
          <strong className="text-fg-primary">{pages.length} pages planned.</strong>{" "}
          {locked > 0
            ? `${PLANS.find((p) => p.id === s.plan)!.label} builds ${unlocked.size === 1 ? "the homepage" : `${unlocked.size} pages`}; the ${locked} locked ${locked === 1 ? "page is" : "pages are"} kept in the plan and built when you upgrade.`
            : "Your plan builds every page."}
        </p>
        <div role="radiogroup" aria-label="Plan" className="flex rounded-full bg-subtle p-1">
          {PLANS.map((p) => (
            <Tooltip key={p.id} content={p.pages}>
              <button
                type="button"
                role="radio"
                aria-checked={s.plan === p.id}
                onClick={() => dispatch({ type: "plan", plan: p.id })}
                className={cn("rounded-full px-3 py-1.5 type-label-md", s.plan === p.id ? "bg-surface text-fg-primary shadow-block-sm" : "text-fg-secondary hover:text-fg-primary")}
              >
                {p.label}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-lg border border-line-default bg-canvas">
        <div className="absolute top-3 left-3 z-10 flex rounded-full border border-line-default bg-surface p-1 shadow-soft-sm" role="radiogroup" aria-label="View">
          {(["map", "list"] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 type-label-md", view === v ? "bg-subtle text-fg-primary" : "text-fg-tertiary")}>
              {v === "map" ? <MapIcon className="size-4" /> : <List className="size-4" />}
              {v === "map" ? "Map" : "List"}
            </button>
          ))}
        </div>
        {view === "map" ? (
          <MapView root={s.sitemap} nodeProps={nodeProps} />
        ) : (
          <ul className="flex flex-col gap-1 overflow-y-auto px-3 pt-16 pb-4 sm:px-6">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-md border border-line-default bg-surface px-3 py-2.5" style={{ marginLeft: p.depth * 24 }}>
                <PageIcon page={p} />
                <span className="flex min-w-0 flex-1 flex-col">
                  {renaming === p.id ? (
                    <RenameInput value={p.title} onDone={(t) => rename(p.id, t)} />
                  ) : (
                    <span className="truncate type-label-md text-fg-primary">{p.title}</span>
                  )}
                  <span className="truncate type-body-sm text-fg-tertiary">{p.purpose}</span>
                </span>
                <StatusIcon included={unlocked.has(p.id)} home={p.id === "home"} />
                <NodeMenu page={p} {...nodeProps} />
              </li>
            ))}
          </ul>
        )}
        {pages.length === 1 && (
          <p className="absolute inset-x-0 bottom-4 text-center type-body-sm text-fg-tertiary">Just a homepage — that&apos;s a perfectly good one-page site.</p>
        )}
      </div>
    </div>
  )
}

interface NodeProps {
  unlocked: Set<string>
  renaming: string | null
  onRename: (id: string, title: string) => void
  onStartRename: (id: string) => void
  onAdd: (parentId: string) => void
  onRemove: (id: string) => void
}

function MapView({ root, nodeProps }: { root: PageNode; nodeProps: NodeProps }) {
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const fit = () => {
    const v = viewport.current, c = content.current
    if (!v || !c) return
    const k = Math.min(1, (v.clientWidth - 48) / c.scrollWidth, (v.clientHeight - 96) / c.scrollHeight)
    setT({ k, x: (v.clientWidth - c.scrollWidth * k) / 2, y: 64 })
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
      <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full border border-line-default bg-surface p-1 shadow-soft-sm">
        <button type="button" aria-label="Zoom out" onClick={() => zoom(0.85)} className="grid size-8 place-items-center rounded-full hover:bg-subtle"><Minus className="size-4" /></button>
        <span className="w-11 text-center type-label-sm text-fg-secondary tabular-nums">{Math.round(t.k * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => zoom(1.15)} className="grid size-8 place-items-center rounded-full hover:bg-subtle"><Plus className="size-4" /></button>
        <button type="button" aria-label="Fit to screen" onClick={fit} className="grid size-8 place-items-center rounded-full hover:bg-subtle"><Maximize className="size-4" /></button>
      </div>
      <p className="absolute bottom-4 left-4 hidden type-caption text-fg-tertiary sm:block">Drag to move · ⌘/Ctrl + scroll to zoom</p>
    </div>
  )
}

function TreeNode({ node, ...p }: { node: PageNode } & NodeProps) {
  const included = p.unlocked.has(node.id)
  return (
    <li>
      <div className={cn("flex w-[264px] items-center gap-1.5 rounded-sm border py-2.5 pr-1.5 pl-4", included ? "border-line-default bg-surface" : "border-line-default bg-subtle")}>
        <PageIcon page={node} muted={!included} />
        {p.renaming === node.id ? (
          <RenameInput value={node.title} onDone={(t) => p.onRename(node.id, t)} />
        ) : (
          <span className={cn("line-clamp-2 min-w-0 flex-1 type-label-lg", included ? "text-fg-primary" : "text-fg-tertiary")}>{node.title}</span>
        )}
        <StatusIcon included={included} home={node.id === "home"} />
        <NodeMenu page={node} {...p} />
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
      <DropdownMenuTrigger aria-label={`Options for ${page.title}`} className="grid size-8 shrink-0 place-items-center rounded-sm text-fg-tertiary hover:bg-subtle hover:text-fg-primary">
        <MoreHorizontal className="size-4" />
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


