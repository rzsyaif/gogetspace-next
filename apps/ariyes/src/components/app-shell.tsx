"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, PanelRightClose, PanelRightOpen, Settings2, SlidersHorizontal } from "lucide-react"
import { Button, Drawer, DrawerContent, DrawerTrigger, IconButton, Tooltip } from "@gogetspace/baseplate"
import { cn } from "@gogetspace/baseplate/cn"
import { DEFAULT_TOOLS, toolById, type Project, type ToolId } from "@gogetspace/modules"
import { ToolGlyph } from "./tool-icon"

/** the rail's order: the same as the home screen's default */
const RAIL_ORDER: ToolId[] = ["appointments", "inbox", "payments", "crm", "contacts", "campaigns", "reviews", "estimates", "locations", "sequences", "broadcasts", "helpdesk", "todo", "drive"]

function RailLink({ href, label, active, children }: { href: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <Tooltip content={label} side="right">
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:focus-ring",
          active ? "bg-accent-blue-subtle text-fg-link" : "text-fg-secondary hover:bg-action-ghost-hover hover:text-fg-primary",
        )}
      >
        {children}
      </Link>
    </Tooltip>
  )
}

/** the narrow, icon-only switcher between the project's apps: Home first, Settings last */
function ToolRail({ project }: { project: Project }) {
  const path = usePathname()
  const have = new Set<ToolId>([...DEFAULT_TOOLS, ...project.installed])
  const apps = RAIL_ORDER.filter((id) => have.has(id)).map(toolById)
  const at = (id: string) => path === `/${project.id}/${id}`
  return (
    <nav aria-label="Apps" className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line-default bg-surface py-3 sm:w-16">
      <RailLink href={`/${project.id}`} label="Home" active={path === `/${project.id}`}>
        <House aria-hidden className="size-5" strokeWidth={1.75} />
      </RailLink>
      <span aria-hidden className="my-2 h-px w-8 shrink-0 bg-line-default" />
      {apps.map((t) => (
        <RailLink key={t.id} href={`/${project.id}/${t.id}`} label={t.name} active={at(t.id)}>
          <ToolGlyph tool={t} className={cn("size-6", !at(t.id) && "text-current")} />
        </RailLink>
      ))}
      <span className="flex-1" />
      <RailLink href={`/${project.id}/settings`} label="Settings" active={at("settings")}>
        <Settings2 aria-hidden className="size-5" strokeWidth={1.75} />
      </RailLink>
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
 * right. The settings column folds away from the header; below 1024px it's a side sheet instead.
 */
export function AppShell({ project, title, actions, main, settings }: { project: Project; title: string; actions?: ReactNode; main: ReactNode; settings?: ReactNode }) {
  const [open, setOpen] = useSettingsOpen()
  const label = `${title} settings`
  return (
    <div className="flex h-[calc(100svh-64px)] min-h-[480px]">
      <ToolRail project={project} />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-14 flex-wrap items-center gap-3 border-b border-line-default bg-surface px-4 py-2 sm:px-5">
          <h1 className="type-h5 text-fg-primary">{title}</h1>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 max-sm:basis-full max-sm:justify-start">
            {actions}
            {settings && (
              <>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button size="sm" variant="secondary" leadingIcon={<SlidersHorizontal />} className="lg:hidden">
                      Settings
                    </Button>
                  </DrawerTrigger>
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
