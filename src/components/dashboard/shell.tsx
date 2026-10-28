"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CircleUser, Cog, Globe, Inbox, Link2, LogOut, Menu, PanelLeft, Plus, WalletMinimal } from "lucide-react"
import {
  Avatar,
  Badge,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Logo,
  NavItem,
  iconButtonVariants,
  Tooltip,
  TooltipProvider,
} from "@/components/ui"
import { cn } from "@/lib/cn"
import { ACCOUNT, ENQUIRIES, type Site } from "@/lib/account/data"
import { useAccountState } from "@/lib/account/store"
import { getTheme } from "@/lib/bakti/themes"

/** Focus the prompt on the dashboard home ("New Website" from anywhere lands there). */
export const NEW_SITE_HREF = "/dashboard?new=1"

/**
 * Account dashboard (Figma "Dashboard" 94:2350): sidebar with the account menu and every website, and the page
 * in a rounded panel. On phones the sidebar moves into a drawer behind a menu button.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <TooltipProvider>
      <div data-theme="light" className="flex h-svh flex-col overflow-hidden bg-canvas text-fg-primary lg:flex-row">
        <aside
          aria-label="Dashboard"
          className={cn("hidden shrink-0 flex-col transition-[width] duration-300 ease-out lg:flex", collapsed ? "w-[72px]" : "w-[280px]")}
        >
          <div className={cn("flex items-center p-4", collapsed ? "flex-col gap-3 px-2" : "justify-between")}>
            <Link href="/dashboard" aria-label="Dashboard home" className="rounded-md focus-visible:outline-none focus-visible:focus-ring">
              <Logo markOnly size={32} />
            </Link>
            <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
              <IconButton aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed} onClick={() => setCollapsed((c) => !c)} className="[&_svg]:size-6">
                <PanelLeft />
              </IconButton>
            </Tooltip>
          </div>
          <SidebarNav collapsed={collapsed} />
        </aside>

        <MobileBar />

        <div className="min-h-0 min-w-0 flex-1 p-1">
          <main className="relative isolate h-full overflow-y-auto rounded-xl border border-line-default bg-surface">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}

function MobileBar() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2 px-3 py-2 lg:hidden">
      <Link href="/dashboard" aria-label="Dashboard home" className="mr-auto rounded-md focus-visible:outline-none focus-visible:focus-ring">
        <Logo size={32} />
      </Link>
      <InboxButton />
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <IconButton aria-label="Open menu" size="lg" shape="round" tone="filled">
            <Menu />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent title="Menu" side="left" header={<Logo size={32} />}>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { sites } = useAccountState()
  const path = usePathname()
  return (
    <nav aria-label="Account" className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-0.5 p-2">
        <SideItem href={NEW_SITE_HREF} icon={<Plus />} label="New Website" collapsed={collapsed} raised onNavigate={onNavigate} />
        <SideItem href="/dashboard/websites" icon={<Globe />} label="Websites" collapsed={collapsed} active={path === "/dashboard/websites"} onNavigate={onNavigate} />
        <SideItem href="/dashboard/domains" icon={<Link2 />} label="Domains" collapsed={collapsed} active={path === "/dashboard/domains"} onNavigate={onNavigate} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {!collapsed && <p className="p-2 type-label-sm text-fg-tertiary">YOUR WEBSITES</p>}
        {sites.map((site) => (
          <SiteItem key={site.id} site={site} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        <SideItem href="/dashboard/billing" icon={<WalletMinimal />} label="Billings" collapsed={collapsed} active={path === "/dashboard/billing"} onNavigate={onNavigate} />
        <SideItem href="/dashboard/settings" icon={<Cog />} label="Settings" collapsed={collapsed} active={path === "/dashboard/settings"} onNavigate={onNavigate} />
      </div>

      <div className={cn("flex items-center p-2", collapsed ? "flex-col gap-1" : "justify-between")}>
        <AccountMenu />
        <InboxButton active={path === "/dashboard/inbox"} onNavigate={onNavigate} />
      </div>
    </nav>
  )
}

/** ui NavItem with a tooltip when the sidebar is collapsed */
function SideItem({
  href,
  icon,
  label,
  collapsed,
  active,
  raised,
  trailing,
  onNavigate,
}: {
  href: string
  icon: ReactNode
  label: string
  collapsed?: boolean
  active?: boolean
  raised?: boolean
  trailing?: ReactNode
  onNavigate?: () => void
}) {
  const item = <NavItem href={href} onClick={onNavigate} icon={icon} label={label} collapsed={collapsed} active={active} raised={raised} trailing={trailing} aria-label={collapsed ? label : undefined} />
  return collapsed ? (
    <Tooltip content={label} side="right">
      {item}
    </Tooltip>
  ) : (
    item
  )
}

/** small square standing in for the site's thumbnail: its brand colour once built */
export function SiteMark({ site, className }: { site: Site; className?: string }) {
  const color = site.themeId ? getTheme(site.themeId).palette[0] : undefined
  return (
    <span
      aria-hidden
      className={cn("grid size-6 shrink-0 place-items-center rounded-[6px] bg-muted type-label-sm text-fg-tertiary ", color && "text-fg-on-action", className)}
      style={color ? { backgroundColor: color } : undefined}
    >
      {site.name[0]}
    </span>
  )
}

export function StatusBadge({ site }: { site: Site }) {
  return site.status === "live" ? (
    <Badge tone="success">LIVE</Badge>
  ) : (
    <Badge dot={false}>DRAFT</Badge>
  )
}

function SiteItem({ site, collapsed, onNavigate }: { site: Site; collapsed?: boolean; onNavigate?: () => void }) {
  const path = usePathname()
  return (
    <SideItem
      href={`/sites/${site.id}`}
      icon={<SiteMark site={site} />}
      label={site.name}
      collapsed={collapsed}
      active={path === `/sites/${site.id}`}
      trailing={<StatusBadge site={site} />}
      onNavigate={onNavigate}
    />
  )
}

function AccountMenu() {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account" className={iconButtonVariants({ size: "lg", shape: "round" })}>
        <Avatar name={ACCOUNT.name} className="size-6 border border-line-default text-[10px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel>
          <span className="block type-label-md text-fg-primary normal-case">{ACCOUNT.name}</span>
          <span className="block type-body-sm text-fg-tertiary normal-case">{ACCOUNT.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
          <CircleUser className="size-4" /> Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/")}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InboxButton({ active, onNavigate }: { active?: boolean; onNavigate?: () => void }) {
  const { enquiryStatus } = useAccountState()
  const unread = ENQUIRIES.filter((e) => enquiryStatus[e.id] === "new").length
  return (
    <Tooltip content={unread ? `Inbox · ${unread} new` : "Inbox"}>
      <Link
        href="/dashboard/inbox"
        onClick={onNavigate}
        aria-label={unread ? `Inbox, ${unread} new enquiries` : "Inbox"}
        aria-current={active ? "page" : undefined}
        className={cn(iconButtonVariants({ size: "lg", shape: "round" }), "relative text-fg-primary [&_svg]:size-6", active && "bg-muted")}
      >
        <Inbox />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-action-primary px-1 text-[10px] leading-4 font-semibold text-fg-on-action">{unread}</span>
        )}
      </Link>
    </Tooltip>
  )
}
