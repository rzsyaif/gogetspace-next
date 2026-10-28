"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import {
  ChartColumn,
  Check,
  Gem,
  Inbox,
  LayoutGrid,
  ChevronDown,
  CircleUser,
  LogOut,
  CodeXml,
  Cog,
  Database,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Loader,
  Lock,
  Menu,
  Monitor,
  MousePointerClick,
  PanelLeft,
  Plus,
  RefreshCw,
  RotateCcw,
  Share2,
  Smartphone,
  Sparkles,
  Tablet,
  X,
} from "lucide-react"
import { Avatar, Button, Drawer, DrawerContent, DrawerTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, IconButton, Logo, SegmentedControl, Tooltip } from "@/components/ui"
import { cn } from "@/lib/cn"
import { flatten, type PageNode } from "@/lib/bakti/sitemap"
import { getTheme } from "@/lib/bakti/themes"
import type { PageStatus } from "@/lib/generation/state"
import { useGen } from "./gen-provider"
import { PreviewFrame, type EditEvent } from "./preview-frame"
import { CLINIC_FRONT, CLINIC_PHOTO, GALLERY_IMAGES } from "@/components/site/assets"
import { AccountDialog, PublishFlow } from "./publish"
import { useEditorSite } from "./editor-site"
import { useAccountState } from "@/lib/account/store"

const DEVICES = [
  { id: "desktop", Icon: Monitor, width: 1280, label: "Desktop" },
  { id: "tablet", Icon: Tablet, width: 820, label: "Tablet" },
  { id: "mobile", Icon: Smartphone, width: 390, label: "Mobile" },
] as const
type Device = (typeof DEVICES)[number]["id"]

export type Tab = "agent" | "analytics" | "enquiries" | "plan" | "domain" | "database" | "settings"
/** tabs that take over the chat and preview with a full-width page */
export const FULL_TABS: Tab[] = ["analytics", "enquiries", "plan"]

const RAIL: { id: Tab; Icon: typeof Sparkles; label: string }[] = [
  { id: "agent", Icon: Sparkles, label: "Agent" },
  { id: "analytics", Icon: ChartColumn, label: "Analytics" },
  { id: "enquiries", Icon: Inbox, label: "Enquiries" },
  { id: "plan", Icon: Gem, label: "Plan" },
  { id: "domain", Icon: Link2, label: "Domain" },
  { id: "database", Icon: Database, label: "Database" },
  { id: "settings", Icon: Cog, label: "Settings" },
]

/** Editor rail: logo (back to the dashboard) on top, workspace tabs, Account at the bottom (no top navbar). */
export function Rail({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav aria-label="Workspace" className="flex h-full w-[84px] flex-col items-center gap-3 overflow-y-auto px-2 py-5 [scrollbar-width:none]">
      <Tooltip content="All websites" side="right">
        <Link href="/dashboard" aria-label="Back to the dashboard" className="mb-2 shrink-0 rounded-md focus-visible:outline-none focus-visible:focus-ring">
          <Logo markOnly size={36} />
        </Link>
      </Tooltip>
      {RAIL.map(({ id, Icon, label }) => (
        <button key={id} type="button" onClick={() => onTab(id)} aria-current={tab === id ? "page" : undefined} className="group flex shrink-0 flex-col items-center gap-1 focus-visible:outline-none">
          <span className={cn("grid size-11 place-items-center rounded-md border group-focus-visible:focus-ring", tab === id ? "border-fg-secondary bg-inverse text-fg-inverse" : "border-line-default bg-subtle text-fg-secondary group-hover:bg-muted")}>
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <span className={cn("type-label-sm", tab === id ? "text-fg-primary" : "text-fg-tertiary")}>{label}</span>
        </button>
      ))}
      <div className="mt-auto shrink-0 pt-3">
        <AccountButton />
      </div>
    </nav>
  )
}

/**
 * Phone editor menu: the rail's workspace tabs and the account, in a drawer from the right edge.
 * Picking a tab shows its panel in the Chat view.
 */
export function MobileNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { s, dispatch } = useGen()
  const [open, setOpen] = useState(false)
  const [signup, setSignup] = useState(false)
  const pick = (t: Tab) => {
    onTab(t)
    setOpen(false)
  }
  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <IconButton aria-label="Open menu" size="lg" shape="round" tone="filled">
            <Menu />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent
          title="Menu"
          header={
            <Link href="/dashboard" aria-label="Back to the dashboard" className="inline-flex rounded-md focus-visible:outline-none focus-visible:focus-ring">
              <Logo size={32} />
            </Link>
          }
          footer={
            s.account ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar size="md" name={s.account.name} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate type-label-md text-fg-primary">{s.account.name}</span>
                    <span className="truncate type-body-sm text-fg-tertiary">{s.account.email}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="secondary" className="flex-1">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1" leadingIcon={<LogOut />} onClick={() => dispatch({ type: "signOut" })}>
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="type-body-sm text-fg-secondary">Not signed in. You only need an account to publish.</p>
                <Button
                  leadingIcon={<CircleUser />}
                  onClick={() => {
                    setOpen(false)
                    setSignup(true)
                  }}
                >
                  Log in or sign up
                </Button>
              </div>
            )
          }
        >
          <nav aria-label="Workspace" className="flex flex-col gap-1">
            {RAIL.map(({ id, Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => pick(id)}
                aria-current={tab === id ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-md px-3 type-label-lg transition-colors focus-visible:outline-none focus-visible:focus-ring",
                  tab === id ? "bg-inverse text-fg-inverse" : "text-fg-primary hover:bg-subtle",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </nav>
          <div className="my-3 border-t border-line-default" />
          <Link href="/dashboard" className="flex h-12 items-center gap-3 rounded-md px-3 type-label-lg text-fg-primary hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
            <LayoutGrid className="size-5" strokeWidth={1.75} /> All websites
          </Link>
          <Link href="/dashboard?new=1" className="flex h-12 items-center gap-3 rounded-md px-3 type-label-lg text-fg-primary hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
            <Plus className="size-5" strokeWidth={1.75} /> New website
          </Link>
        </DrawerContent>
      </Drawer>
      <AccountDialog open={signup} onOpenChange={setSignup} />
    </>
  )
}

/** Icon button with the account menu (sign-up itself only happens at Publish, or from here) */
export function AccountButton({ compact }: { compact?: boolean }) {
  const { s, dispatch } = useGen()
  const [signup, setSignup] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Account" className="group flex flex-col items-center gap-1 focus-visible:outline-none">
          <span className={cn("grid place-items-center rounded-full border border-line-default bg-subtle text-fg-secondary group-hover:bg-muted group-focus-visible:focus-ring", compact ? "size-10" : "size-11")}>
            {s.account ? (
              <span className={cn("grid place-items-center rounded-full bg-blue-500 font-semibold text-white", compact ? "size-8 text-[13px]" : "size-9 text-[14px]")}>{s.account.name[0]}</span>
            ) : (
              <CircleUser className={compact ? "size-5" : "size-6"} strokeWidth={1.75} />
            )}
          </span>
          {!compact && <span className="type-label-sm text-fg-tertiary">Account</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent side={compact ? "bottom" : "right"} align="end" className="w-64">
          {s.account ? (
            <>
              <DropdownMenuLabel>
                <span className="block type-label-md text-fg-primary normal-case">{s.account.name}</span>
                <span className="block type-body-sm text-fg-tertiary normal-case">{s.account.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => dispatch({ type: "signOut" })}>
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel>Not signed in</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setSignup(true)}>
                <CircleUser className="size-4" /> Log in or sign up
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AccountDialog open={signup} onOpenChange={setSignup} />
    </>
  )
}

/** Project picker + hide-panel toggle above the chat */
export function ProjectHeader({ onHide }: { onHide: () => void }) {
  return (
    <div className="flex items-center gap-4 p-4">
      <ProjectSelect />
      <Tooltip content="Hide panel">
        <button type="button" aria-label="Hide panel" onClick={onHide} className="hidden size-9 place-items-center rounded-md text-fg-secondary hover:bg-subtle lg:grid">
          <PanelLeft className="size-6" />
        </button>
      </Tooltip>
    </div>
  )
}

function ProjectSelect() {
  const { site } = useEditorSite()
  const { sites } = useAccountState()
  const others = sites.filter((x) => x.id !== site.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-left focus-visible:outline-none focus-visible:focus-ring">
        <span className="min-w-0 flex-1 truncate type-body-md text-fg-primary">{site.name}</span>
        <ChevronDown className="size-5 shrink-0 text-fg-secondary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Your websites</DropdownMenuLabel>
        <DropdownMenuItem>
          <Check className="size-4" /> <span className="truncate">{site.name}</span>
        </DropdownMenuItem>
        {others.map((x) => (
          <DropdownMenuItem key={x.id} asChild>
            <Link href={`/sites/${x.id}`}>
              <span className="size-4" aria-hidden /> <span className="truncate">{x.name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutGrid className="size-4" /> All websites
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard?new=1">
            <Plus className="size-4" /> New website
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SidePanel({ tab, onBack }: { tab: "domain" | "database" | "settings"; onBack: () => void }) {
  const { s } = useGen()
  const title = { domain: "Domain", database: "Database", settings: "Settings" }[tab]
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="type-h5 text-fg-primary">{title}</h2>
        <IconButton aria-label="Back to agent" onClick={onBack}><X /></IconButton>
      </div>
      {tab === "domain" && (
        <>
          <div className="flex flex-col gap-1 rounded-md border border-line-default bg-surface p-4">
            <span className="type-caption text-fg-tertiary">Free address</span>
            <span className="type-label-md text-fg-primary">{s.publish.domain}</span>
            <span className={cn("type-caption", s.publish.status === "live" ? "text-status-success-text" : "text-fg-tertiary")}>{s.publish.status === "live" ? "Live" : "Goes live when you publish"}</span>
          </div>
          <Button variant="secondary">Connect a domain you own</Button>
          <Button variant="secondary">Buy a domain</Button>
          <p className="type-body-sm text-fg-tertiary">Domain management is the next prototype screen.</p>
        </>
      )}
      {tab === "database" && (
        <>
          <p className="type-body-sm text-fg-secondary">Bookings and messages sent from your site land here.</p>
          {[
            { k: "Bookings", v: s.publish.status === "live" ? 3 : 0 },
            { k: "Contact messages", v: s.publish.status === "live" ? 1 : 0 },
            { k: "Clinic account requests", v: 0 },
            { k: "Corporate quotes", v: 0 },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between rounded-md border border-line-default bg-surface p-4">
              <span className="type-label-md text-fg-primary">{r.k}</span>
              <span className="rounded-full bg-subtle px-2 type-label-sm text-fg-secondary">{r.v}</span>
            </div>
          ))}
          {s.publish.status !== "live" && <p className="type-body-sm text-fg-tertiary">Nothing yet — publish the site to start collecting.</p>}
        </>
      )}
      {tab === "settings" && (
        <div className="flex flex-col gap-3">
          {[
            ["Site name", "Bakti Analisa"],
            ["Language", "English (Bahasa Malaysia next)"],
            ["Style", getTheme(s.styleId).name],
            ["Plan", s.plan[0].toUpperCase() + s.plan.slice(1)],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 rounded-md border border-line-default bg-surface p-4">
              <span className="type-caption text-fg-tertiary">{k}</span>
              <span className="type-body-md text-fg-primary">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- preview ---------------- */

export function PreviewPane({ chatOpen, onShowChat, onToast }: { chatOpen: boolean; onShowChat: () => void; onToast: (t: string) => void }) {
  const { s, dispatch } = useGen()
  const [device, setDevice] = useState<Device>(() => (typeof window !== "undefined" && window.innerWidth < 640 ? "mobile" : "desktop"))
  const [view, setView] = useState<"preview" | "code">("preview")
  const [pageId, setPageId] = useState("home")
  const [reload, setReload] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const imageTurn = useRef(0)
  const pages = flatten(s.sitemap)
  const page = pages.find((p) => p.id === pageId) ?? pages[0]
  const status: PageStatus = s.pages[page.id] ?? "queued"
  const styleId = s.styleId ?? "clinical-clarity"
  const src = `/preview/${styleId}${page.slug ? `/${page.slug}` : ""}`
  const build = s.buildRun ? s.runs[s.buildRun] : null
  const buildDone = build?.status === "done"
  const anyBuilt = Object.values(s.pages).some((p) => p === "built")
  const dev = DEVICES.find((d) => d.id === device)!
  const live = s.publish.status === "live"

  const onNavigate = (slug: string) => {
    const p = pages.find((x) => x.slug === slug)
    if (p) setPageId(p.id)
  }

  // edits made on the page in Edit Mode go through the agent chat
  const onEdit = (e: EditEvent) => {
    const where = e.target.kind === "text" ? `“${e.target.label}”` : e.target.label
    if (e.kind === "text-saved") {
      dispatch({ type: "agentNote", text: `Saved your edit on ${page.title}: “${(e.text ?? "").slice(0, 80)}”.` })
      onToast("Text saved")
      return
    }
    if (e.kind === "image-uploaded") {
      dispatch({ type: "agentNote", text: `Replaced the image on ${page.title} with ${e.text}.` })
      onToast("Image replaced")
      return
    }
    dispatch({ type: "followUp", text: `${where} — ${e.prompt}` })
    onToast(e.target.kind === "image" ? "Regenerating the image…" : "The agent is on it")
    if (e.target.kind === "text" && /short/i.test(e.prompt ?? "") && e.target.text) {
      const words = e.target.text.split(/\s+/)
      if (words.length > 4) return { replaceText: words.slice(0, Math.max(3, Math.ceil(words.length * 0.6))).join(" ").replace(/[,;:—-]$/, "") + (/[.!?]$/.test(e.target.text.trim()) ? "." : "") }
    }
    if (e.target.kind === "image") {
      const pool = [CLINIC_FRONT, ...GALLERY_IMAGES, CLINIC_PHOTO]
      return { imageSrc: pool[imageTurn.current++ % pool.length] }
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 p-2 sm:gap-4 sm:p-4">
        <div className="flex items-center gap-3 lg:flex-1">
          {!chatOpen && (
            <Tooltip content="Show panel">
              <button type="button" aria-label="Show panel" onClick={onShowChat} className="hidden size-9 place-items-center rounded-md text-fg-secondary hover:bg-subtle lg:grid">
                <PanelLeft className="size-6" />
              </button>
            </Tooltip>
          )}
          <SegmentedControl label="View" iconOnly value={view} onChange={setView} options={[{ value: "preview", icon: <Globe />, label: "Preview" }, { value: "code", icon: <CodeXml />, label: "Code" }]} />
          <div className="hidden sm:block">
            <SegmentedControl label="Device size" iconOnly value={device} onChange={setDevice} options={DEVICES.map((d) => ({ value: d.id, icon: <d.Icon />, label: d.label }))} />
          </div>
        </div>
        <PageSelect pages={pages} current={page} statuses={s.pages} onPick={setPageId} onReload={() => setReload((r) => r + 1)} />
        <div className="ml-auto flex items-center gap-2 sm:gap-4 lg:ml-0 lg:flex-1 lg:justify-end">
          {live && (
            <span className="hidden items-center gap-1.5 rounded-full bg-status-success-bg px-3 py-1 type-label-sm text-status-success-text xl:flex">
              <span className="size-2 rounded-full bg-status-success-solid" /> Live
            </span>
          )}
          <Tooltip content="Copy preview link">
            <button
              type="button"
              aria-label="Share preview"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.origin + src).catch(() => {})
                onToast("Preview link copied")
              }}
              className="hidden size-11 place-items-center rounded-full bg-subtle text-fg-secondary hover:bg-muted sm:grid"
            >
              <Share2 className="size-5" />
            </button>
          </Tooltip>
          <Tooltip content="Open in a new tab">
            <a href={src} target="_blank" rel="noreferrer" aria-label="Open preview in a new tab" className="hidden size-11 place-items-center rounded-full bg-subtle text-fg-secondary hover:bg-muted sm:grid">
              <ExternalLink className="size-5" />
            </a>
          </Tooltip>
          {buildDone ? (
            <Button onClick={() => setPublishing(true)}>{live ? "Update site" : "Publish"}</Button>
          ) : (
            <Tooltip content="Publishing opens when the build finishes">
              <span tabIndex={0}>
                <Button disabled>Publish</Button>
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 justify-center overflow-hidden rounded-xl border border-line-default bg-surface">
        {view === "code" ? (
          <CodeView page={page} built={status === "built"} />
        ) : (
          <>
            {anyBuilt && (
              <PreviewFrame
                key={device}
                src={src}
                viewport={dev.width}
                reloadKey={reload}
                title={`${page.title} preview`}
                onNavigate={onNavigate}
                editMode={editMode && status === "built"}
                onEdit={onEdit}
                className={cn("h-full", device === "desktop" ? "w-full" : cn("my-4 mb-20 max-w-full rounded-[28px] border-[6px] border-neutral-900 max-sm:my-0 max-sm:mb-0 max-sm:rounded-none max-sm:border-0", device === "tablet" ? "w-[832px]" : "w-[402px]"))}
              />
            )}
            {status !== "built" && <PageOverlay page={page} status={status} onRetry={() => dispatch({ type: "retryPage", id: page.id })} />}
            {anyBuilt && status === "built" && (
              <>
                <AnimatePresence>
                  {editMode && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="pointer-events-none absolute bottom-[68px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-inverse/90 px-3 py-1.5 type-label-sm whitespace-nowrap text-fg-inverse shadow-soft-sm"
                    >
                      Click a section, text or image to change it
                    </motion.p>
                  )}
                </AnimatePresence>
                <SegmentedControl
                  as="tablist"
                  look="floating"
                  label="Preview mode"
                  className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2"
                  value={editMode}
                  onChange={setEditMode}
                  options={[
                    { value: false, label: "Preview Mode", icon: <Eye /> },
                    { value: true, label: "Edit Mode", icon: <MousePointerClick /> },
                  ]}
                />
              </>
            )}
          </>
        )}
      </div>
      <PublishFlow open={publishing} onOpenChange={setPublishing} styleId={styleId} />
    </>
  )
}

const STATUS_TEXT: Record<PageStatus, string> = { built: "Built", building: "Building…", queued: "Waiting", failed: "Failed", locked: "Needs upgrade", skipped: "Not built" }

function PageSelect({ pages, current, statuses, onPick, onReload }: { pages: (PageNode & { depth: number })[]; current: PageNode; statuses: Record<string, PageStatus>; onPick: (id: string) => void; onReload: () => void }) {
  return (
    <div className="order-last flex w-full items-center gap-2 rounded-md border border-line-strong bg-surface px-2 lg:order-none lg:w-auto lg:min-w-[320px] lg:flex-1">
      <Tooltip content="Reload preview">
        <IconButton aria-label="Reload preview" onClick={onReload}>
          <RefreshCw />
        </IconButton>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-11 min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none">
          <span className="min-w-0 flex-1 truncate text-center type-body-md text-fg-primary">{current.title}</span>
          <ChevronDown className="size-5 shrink-0 text-fg-secondary" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="max-h-[60vh] w-[320px] overflow-y-auto">
          <DropdownMenuLabel>Pages</DropdownMenuLabel>
          {pages.map((p) => {
            const st = statuses[p.id] ?? "queued"
            return (
              <DropdownMenuItem key={p.id} onSelect={() => onPick(p.id)} className={cn(current.id === p.id && "bg-subtle")}>
                <span style={{ paddingLeft: p.depth * 12 }} className={cn("min-w-0 flex-1 truncate", (st === "locked" || st === "skipped") && "text-fg-tertiary")}>
                  {p.title}
                </span>
                <span className={cn("flex items-center gap-1 type-caption", st === "built" ? "text-status-success-text" : st === "failed" ? "text-status-error-text" : "text-fg-tertiary")}>
                  {st === "building" && <Loader className="size-3 animate-spin" />}
                  {st === "locked" && <Lock className="size-3" />}
                  {STATUS_TEXT[st]}
                </span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function PageOverlay({ page, status, onRetry }: { page: PageNode; status: PageStatus; onRetry: () => void }) {
  const { dispatch } = useGen()
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface/90 p-6 text-center backdrop-blur-sm">
      {(status === "building" || status === "queued") && (
        <>
          <div className="flex w-full max-w-md flex-col gap-3" aria-hidden>
            <div className="h-6 w-1/2 animate-pulse rounded-md bg-muted" />
            <div className="h-40 animate-pulse rounded-lg bg-subtle" />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-md bg-subtle" />)}
            </div>
          </div>
          <p className="flex items-center gap-2 type-label-md text-fg-secondary">
            <Loader className="size-4 animate-spin" /> {status === "building" ? `Building ${page.title}…` : `${page.title} is next in line`}
          </p>
        </>
      )}
      {status === "failed" && (
        <>
          <p className="type-h5 text-fg-primary">{page.title} didn&apos;t build</p>
          <p className="max-w-sm type-body-sm text-fg-secondary">Something went wrong on this page. The rest of the site is fine.</p>
          <Button leadingIcon={<RotateCcw />} onClick={onRetry}>Retry this page</Button>
        </>
      )}
      {(status === "locked" || status === "skipped") && (
        <>
          <Lock className="size-8 text-fg-tertiary" />
          <p className="type-h5 text-fg-primary">{page.title} is planned but not built</p>
          <p className="max-w-sm type-body-sm text-fg-secondary">
            {status === "locked" ? "Your plan includes fewer pages. Upgrade and I'll build this one and keep everything else as it is." : "The build stopped before this page. Top up credits to finish it."}
          </p>
          <Button onClick={() => dispatch(status === "locked" ? { type: "upgradePlan" } : { type: "creditsUpgrade" })}>
            {status === "locked" ? "Upgrade (demo)" : "Top up credits"}
          </Button>
        </>
      )}
    </div>
  )
}

function CodeView({ page, built }: { page: PageNode; built: boolean }) {
  const name = page.title.replace(/[^a-zA-Z0-9]+/g, "")
  const lines = built
    ? [
        `// app/(site)/${page.slug || "page"}${page.slug ? "/page" : ""}.tsx`,
        `import { Header, Footer, Section, BookingButton } from "@/site"`,
        "",
        `export const metadata = { title: "${page.title} · Bakti Analisa" }`,
        "",
        `export default function ${name || "Page"}() {`,
        "  return (",
        "    <>",
        "      <Header />",
        `      <Section variant="hero" title="${page.title}" />`,
        "      <Section variant=\"content\">",
        "        {/* generated from the confirmed brief */}",
        "      </Section>",
        "      <BookingButton />",
        "      <Footer />",
        "    </>",
        "  )",
        "}",
      ]
    : ["// This page hasn't been built yet."]
  return (
    <pre className="h-full w-full overflow-auto bg-neutral-950 p-6 font-mono text-[13px] leading-6 text-neutral-200">
      {lines.map((l, i) => (
        <div key={i} className="flex gap-6">
          <span className="w-6 shrink-0 text-right text-neutral-600 select-none">{i + 1}</span>
          <span className={cn(l.startsWith("//") || l.includes("{/*") ? "text-neutral-500" : "")}>{l || " "}</span>
        </div>
      ))}
    </pre>
  )
}
