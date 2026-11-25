"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Building2, KanbanSquare, LayoutDashboard, Menu, Plus, Settings2, Users } from "lucide-react"
import { Button, Drawer, DrawerContent, DrawerTrigger, IconButton, NavItem, Toast } from "@gogetspace/baseplate"
import { followUps } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"
import { ToolRail } from "../app-shell"
import { useCrm } from "./crm-store"
import { ClientPanel } from "./client-panel"
import { AddLead } from "./add-lead"

/** the CRM's own pages, between the app rail and the page */
function CrmNav({ onNavigate }: { onNavigate?: () => void }) {
  const { project, data, now, setAddOpen } = useCrm()
  const path = usePathname()
  const base = `/${project.id}/crm`
  const due = data ? followUps(data, now).length : 0
  const items = [
    { href: base, label: "Home", icon: <LayoutDashboard strokeWidth={1.75} />, trailing: due ? <span className="rounded-full bg-status-warning-bg px-1.5 type-label-sm text-status-warning-text tabular-nums">{due}</span> : null },
    { href: `${base}/pipeline`, label: "Pipeline", icon: <KanbanSquare strokeWidth={1.75} /> },
    { href: `${base}/clients`, label: "Clients", icon: <Users strokeWidth={1.75} /> },
    ...(data?.settings.companies ? [{ href: `${base}/companies`, label: "Companies", icon: <Building2 strokeWidth={1.75} /> }] : []),
  ]
  return (
    <nav aria-label="CRM" className="flex h-full flex-col gap-4">
      <Button
        leadingIcon={<Plus />}
        onClick={() => {
          onNavigate?.()
          setAddOpen(true)
        }}
        className="w-full"
      >
        Add new lead
      </Button>
      <ul className="flex flex-col gap-0.5 [&_svg]:!size-5">
        {items.map((it) => (
          <li key={it.href}>
            <NavItem href={it.href} label={it.label} icon={it.icon} trailing={it.trailing} active={path === it.href} onClick={onNavigate} className="type-label-md" />
          </li>
        ))}
      </ul>
      <span className="flex-1" />
      <NavItem href={`${base}/settings`} label="Settings" icon={<Settings2 strokeWidth={1.75} />} active={path === `${base}/settings`} onClick={onNavigate} className="type-label-md [&_svg]:!size-5" />
    </nav>
  )
}

/** a CRM page's header: the title, its actions, and (on phones) the menu with the CRM's pages */
export function CrmHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  const [menu, setMenu] = useState(false)
  return (
    <div className="flex min-h-14 flex-wrap items-center gap-3 border-b border-line-default bg-surface px-4 py-2 sm:px-6">
      <Drawer open={menu} onOpenChange={setMenu}>
        <DrawerTrigger asChild>
          <IconButton aria-label="CRM menu" className="md:hidden">
            <Menu />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent title="CRM" side="left">
          <div className="flex h-full flex-col px-1 pb-3">
            <CrmNav onNavigate={() => setMenu(false)} />
          </div>
        </DrawerContent>
      </Drawer>
      <h1 className="type-h5 text-fg-primary">{title}</h1>
      {actions && <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{actions}</div>}
    </div>
  )
}

/**
 * The CRM's layout: app rail, the CRM's own sidebar (Add new lead, its pages, Settings at the bottom), then the page.
 * Below 768px the sidebar moves into the header's menu and Add new lead becomes a floating button.
 */
export function CrmShell({ children }: { children: ReactNode }) {
  const { project, toast, setToast, setAddOpen } = useCrm()

  // toasts leave on their own
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast, setToast])

  return (
    <div className="flex h-[calc(100svh-64px)] min-h-[480px]">
      <ToolRail project={project} />
      <aside className="hidden w-60 shrink-0 border-r border-line-default bg-surface p-3 md:block">
        <CrmNav />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>

      <button
        type="button"
        aria-label="Add new lead"
        onClick={() => setAddOpen(true)}
        className={cn(
          "fixed right-4 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-action-primary text-fg-on-action shadow-soft-lg transition-transform duration-150 ease-out active:scale-95 focus-visible:outline-none focus-visible:focus-ring md:hidden",
        )}
      >
        <Plus aria-hidden className="size-6" />
      </button>

      <ClientPanel />
      <AddLead />
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 max-md:bottom-24">
        {toast && (
          <Toast
            key={toast.message}
            message={toast.message}
            action={
              toast.undo
                ? {
                    label: "Undo",
                    onClick: () => {
                      toast.undo!()
                      setToast(null)
                    },
                  }
                : undefined
            }
            className="pointer-events-auto transition-[opacity,translate] duration-200 ease-out starting:translate-y-2 starting:opacity-0"
          />
        )}
      </div>
    </div>
  )
}

/** a page's scrolling body */
export function CrmBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto max-md:pb-24", className)}>{children}</div>
}
