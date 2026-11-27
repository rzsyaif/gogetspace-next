"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, PanelRightClose, PanelRightOpen, Settings2, SlidersHorizontal } from "lucide-react"
import { Button, Drawer, DrawerContent, IconButton, Tooltip } from "@gogetspace/baseplate"
import { cn } from "@gogetspace/baseplate/cn"
import { DEFAULT_TOOLS, toolById, type Project, type ToolId } from "@gogetspace/modules"
import { ToolGlyph } from "./tool-icon"

/** the rail's order: the same as the home screen's default */
const RAIL_ORDER: ToolId[] = ["appointments", "inbox", "payments", "crm", "contacts", "campaigns", "reviews", "estimates", "locations", "sequences", "broadcasts", "helpdesk", "todo", "drive"]

export interface AppLink {
  key: string
  href: string
  label: string
  active: boolean
  icon: (active: boolean) => ReactNode
}

/** the project's apps in rail order: Home first, Settings last, each with whether it's the page being viewed */
export function useAppLinks(project: Project): AppLink[] {
  const path = usePathname()
  const have = new Set<ToolId>([...DEFAULT_TOOLS, ...project.installed])
  const at = (id: string) => path === `/${project.id}/${id}` || path.startsWith(`/${project.id}/${id}/`)
  return [
    { key: "home", href: `/${project.id}`, label: "Home", active: path === `/${project.id}`, icon: () => <House aria-hidden className="size-5" strokeWidth={1.75} /> },
    ...RAIL_ORDER.filter((id) => have.has(id))
      .map(toolById)
      .map((t) => ({ key: t.id, href: `/${project.id}/${t.id}`, label: t.name, active: at(t.id), icon: (active: boolean) => <ToolGlyph tool={t} className={cn("size-6", !active && "text-current")} /> })),
    { key: "settings", href: `/${project.id}/settings`, label: "Settings", active: at("settings"), icon: () => <Settings2 aria-hidden className="size-5" strokeWidth={1.75} /> },
  ]
}

function RailLink({ link }: { link: AppLink }) {
  return (
    <Tooltip content={link.label} side="right">
      <Link
        href={link.href}
        aria-label={link.label}
        aria-current={link.active ? "page" : undefined}
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:focus-ring",
          link.active ? "bg-accent-blue-subtle text-fg-link" : "text-fg-secondary hover:bg-action-ghost-hover hover:text-fg-primary",
        )}
      >
        {link.icon(link.active)}
      </Link>
    </Tooltip>
  )
}

/**
 * The narrow, icon-only switcher between the project's apps: Home first, Settings last. Below 768px it folds into
 * the top bar's Apps menu.
 */
export function ToolRail({ project }: { project: Project }) {
  const links = useAppLinks(project)
  const [home, settings] = [links[0], links[links.length - 1]]
  return (
    <nav aria-label="Apps" className="flex w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line-default bg-surface py-3 max-md:hidden">
      <RailLink link={home} />
      <span aria-hidden className="my-2 h-px w-8 shrink-0 bg-line-default" />
      {links.slice(1, -1).map((l) => (
        <RailLink key={l.key} link={l} />
      ))}
      <span className="flex-1" />
      <RailLink link={settings} />
    </nav>
  )
}

const SETTINGS_KEY = "ariyes:settings-open"

/** whether the settings column is open on wide screens; remembered per browser, open by default */
function useSettingsOpen() {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    try {
      // a remembered preference only exists in the browser, so it's read after hydration
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(SETTINGS_KEY) === "0") setOpen(false)
    } catch {}
  }, [])
  const set = (v: boolean) => {
    setOpen(v)
    try {
      localStorage.setItem(SETTINGS_KEY, v ? "1" : "0")
    } catch {}
  }
  return [open, set] as const
}

/**
 * Every Ariyes app's layout: the app rail on the left, the app's main view in the middle, and its settings on the
 * right. The settings column folds away from the header; below 1024px it's a side sheet instead. Below 768px the
 * rail moves into the top bar and the header keeps to one row: the title, the app's actions, and a settings icon.
 */
export function AppShell({ project, title, actions, main, settings }: { project: Project; title: string; actions?: ReactNode; main: ReactNode; settings?: ReactNode }) {
  const [open, setOpen] = useSettingsOpen()
  const [sheet, setSheet] = useState(false)
  const label = `${title} settings`
  return (
    <div className="flex h-[calc(100svh-64px)] min-h-[480px]">
      <ToolRail project={project} />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-14 items-center gap-3 border-b border-line-default bg-surface px-4 py-2 sm:px-5">
          <h1 className="min-w-0 truncate type-h5 text-fg-primary">{title}</h1>
          <div className="flex flex-1 items-center justify-end gap-2">
            {actions}
            {settings && (
              <>
                <Drawer open={sheet} onOpenChange={setSheet}>
                  {/* phones: an icon beside the title's actions; tablets: the labelled button */}
                  <Tooltip content="Settings">
                    <IconButton aria-label={label} onClick={() => setSheet(true)} className="md:hidden">
                      <SlidersHorizontal />
                    </IconButton>
                  </Tooltip>
                  <Button size="sm" variant="secondary" leadingIcon={<SlidersHorizontal />} onClick={() => setSheet(true)} className="max-md:hidden lg:hidden">
                    Settings
                  </Button>
                  <DrawerContent title={label} side="right">
                    {settings}
                  </DrawerContent>
                </Drawer>
                <Tooltip content={open ? "Hide settings" : "Show settings"}>
                  <IconButton aria-label={open ? "Hide settings" : "Show settings"} aria-expanded={open} aria-controls="app-settings" onClick={() => setOpen(!open)} className="max-lg:hidden">
                    {open ? <PanelRightClose /> : <PanelRightOpen />}
                  </IconButton>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1">{main}</div>
      </main>
      {settings && (
        <aside
          id="app-settings"
          aria-label={label}
          inert={!open}
          className={cn(
            "hidden shrink-0 overflow-hidden bg-surface transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none lg:block",
            open ? "w-[360px] border-l border-line-default" : "w-0",
          )}
        >
          <div className="h-full w-[360px] overflow-y-auto">{settings}</div>
        </aside>
      )}
    </div>
  )
}
