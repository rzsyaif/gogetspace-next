"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  Globe,
  LayoutDashboard,
  Link2,
  Menu,
  ScrollText,
  Search,
  MessageSquareHeart,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  Users,
  WalletMinimal,
} from "lucide-react"
import { Avatar, Badge, Drawer, DrawerContent, DrawerTrigger, IconButton, Input, Logo, NavItem, Toast, TooltipProvider } from "@/components/ui"
import { cn } from "@/lib/cn"
import { ME, SERVICES } from "@/lib/admin/data"
import { useAdmin, useToast } from "@/lib/admin/store"

/**
 * Internal admin console: grouped sidebar (customers, revenue, platform, settings), a global search over
 * clients, websites and domains, and the page in a rounded panel — the same frame as the client dashboard,
 * marked "Admin" so staff never confuse the two. On phones the sidebar moves into a drawer.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div data-theme="light" className="flex h-svh flex-col overflow-hidden bg-canvas text-fg-primary lg:flex-row">
        <aside aria-label="Admin" className="hidden w-[260px] shrink-0 flex-col lg:flex">
          <Brand />
          <div className="px-3 pb-2">
            <GlobalSearch />
          </div>
          <AdminNav />
        </aside>
        <MobileBar />
        <div className="min-h-0 min-w-0 flex-1 p-1">
          <main className="relative isolate h-full overflow-y-auto rounded-xl border border-line-default bg-surface">{children}</main>
        </div>
        <ToastHost />
      </div>
    </TooltipProvider>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2 p-4">
      <Link href="/admin" aria-label="Admin overview" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:focus-ring">
        <Logo markOnly size={32} />
        <span className="type-h6 text-fg-primary">GoGetSpace</span>
      </Link>
      <Badge tone="warning" dot={false}>
        Admin
      </Badge>
    </div>
  )
}

function MobileBar() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center gap-2 px-3 py-2 lg:hidden">
      <Link href="/admin" aria-label="Admin overview" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:focus-ring">
        <Logo markOnly size={32} />
        <Badge tone="warning" dot={false}>
          Admin
        </Badge>
      </Link>
      <div className="min-w-0 flex-1" />
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <IconButton aria-label="Open menu" size="lg" shape="round" tone="filled">
            <Menu />
          </IconButton>
        </DrawerTrigger>
        <DrawerContent
          title="Admin menu"
          side="left"
          header={
            <span className="flex items-center gap-2">
              <Logo markOnly size={32} />
              <Badge tone="warning" dot={false}>
                Admin
              </Badge>
            </span>
          }
        >
          <div className="px-1 pb-2">
            <GlobalSearch onNavigate={() => setOpen(false)} />
          </div>
          <AdminNav onNavigate={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    </div>
  )
}

const GROUPS: { label?: string; items: { href: string; label: string; icon: ReactNode; badge?: "research" | "past_due" | "system" | "dns" }[] }[] = [
  { items: [{ href: "/admin", label: "Overview", icon: <LayoutDashboard /> }] },
  {
    label: "Customers",
    items: [
      { href: "/admin/clients", label: "Clients", icon: <Users /> },
      { href: "/admin/sites", label: "Websites", icon: <Globe /> },
    ],
  },
  {
    label: "Revenue",
    items: [
      { href: "/admin/billing", label: "Billing", icon: <WalletMinimal />, badge: "past_due" },
      { href: "/admin/domains", label: "Domains", icon: <Link2 />, badge: "dns" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/ai", label: "AI usage", icon: <Sparkles /> },
      { href: "/admin/feedback", label: "Feedback", icon: <MessageSquareHeart />, badge: "research" },
      { href: "/admin/system", label: "System", icon: <Activity />, badge: "system" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/plans", label: "Plans & features", icon: <SlidersHorizontal /> },
      { href: "/admin/team", label: "Team & roles", icon: <UserCog /> },
      { href: "/admin/audit", label: "Audit log", icon: <ScrollText /> },
    ],
  },
]

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname()
  const { feedback, subscriptions, domains } = useAdmin()
  const counts = {
    research: feedback.filter((f) => f.research && f.researchStatus === "new").length,
    past_due: subscriptions.filter((s) => s.status === "past_due").length,
    dns: domains.filter((d) => d.health !== "active").length,
    system: SERVICES.filter((s) => s.status !== "operational").length,
  }
  return (
    <nav aria-label="Admin" className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2">
        {GROUPS.map((g, i) => (
          <div key={g.label ?? i} className="flex flex-col gap-0.5">
            {g.label && <p className="px-2 pt-1 pb-1 type-label-sm text-fg-tertiary uppercase">{g.label}</p>}
            {g.items.map((it) => {
              const n = it.badge ? counts[it.badge] : 0
              const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href)
              return (
                <NavItem
                  key={it.href}
                  href={it.href}
                  icon={it.icon}
                  label={it.label}
                  active={active}
                  onClick={onNavigate}
                  className="[&_svg]:size-5"
                  trailing={
                    n > 0 ? (
                      <Badge tone={it.badge === "system" ? "error" : it.badge === "research" ? "brand" : "warning"} dot={false} aria-label={it.badge === "research" ? `${n} open to research, not invited yet` : `${n} need attention`}>
                        {it.badge === "system" ? "Degraded" : n}
                      </Badge>
                    ) : undefined
                  }
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-col border-t border-line-default p-2">
        <div className="flex items-center gap-3 p-2">
          <Avatar name={ME.name} size="sm" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate type-label-md text-fg-primary">{ME.name}</span>
            <span className="truncate type-caption text-fg-tertiary">
              {ME.role} · {ME.email}
            </span>
          </span>
        </div>
      </div>
    </nav>
  )
}

/** Search clients, websites, domains and payment IDs from anywhere; press / to focus. */
function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const { clients, sites, domains, payments } = useAdmin()
  const router = useRouter()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable && ref.current?.offsetParent) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 2) return []
    const has = (...xs: (string | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(term))
    return [
      ...clients.filter((c) => has(c.name, c.email, c.phone)).map((c) => ({ kind: "Client", label: c.name, sub: c.email, href: `/admin/clients/${c.id}` })),
      ...sites.filter((s) => has(s.name, s.freeDomain, s.domain?.name)).map((s) => ({ kind: "Website", label: s.name, sub: s.domain?.name ?? s.freeDomain, href: `/admin/clients/${s.clientId}?tab=sites` })),
      ...domains.filter((d) => has(d.name)).map((d) => ({ kind: "Domain", label: d.name, sub: d.source === "GoGetSpace" ? "Bought through GoGetSpace" : "Connected from elsewhere", href: `/admin/domains?q=${encodeURIComponent(d.name)}` })),
      ...payments.filter((p) => has(p.id)).map((p) => ({ kind: "Payment", label: p.id, sub: p.description, href: `/admin/clients/${p.clientId}?tab=billing` })),
    ].slice(0, 8)
  }, [q, clients, sites, domains, payments])

  const go = (href: string) => {
    router.push(href)
    setQ("")
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="relative">
      <Input
        ref={ref}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setActive((a) => Math.min(results.length - 1, a + 1))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActive((a) => Math.max(0, a - 1))
          } else if (e.key === "Enter" && results[active]) go(results[active].href)
          else if (e.key === "Escape") setOpen(false)
        }}
        placeholder="Search clients, sites, domains"
        aria-label="Search clients, websites, domains and payments"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="admin-search-results"
        leadingIcon={<Search />}
        trailing={<kbd className="hidden rounded-sm border border-line-default px-1.5 type-caption text-fg-tertiary lg:inline">/</kbd>}
        className="h-10"
      />
      {open && q.trim().length >= 2 && (
        <ul id="admin-search-results" role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 flex flex-col overflow-hidden rounded-md border border-line-default bg-surface-raised p-1 shadow-soft-md">
          {results.length === 0 ? (
            <li className="px-3 py-2 type-body-sm text-fg-tertiary">Nothing matches “{q.trim()}”</li>
          ) : (
            results.map((r, i) => (
              <li key={r.kind + r.href + r.label} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex w-full flex-col rounded-sm px-3 py-2 text-left", i === active && "bg-subtle")}
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate type-label-md text-fg-primary">{r.label}</span>
                    <span className="type-caption text-fg-tertiary">{r.kind}</span>
                  </span>
                  <span className="truncate type-caption text-fg-tertiary">{r.sub}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function ToastHost() {
  const t = useToast()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      {t && <Toast key={t.id} tone={t.tone} message={t.message} className="pointer-events-auto animate-[bp-dialog-in_200ms_ease-out]" />}
    </div>
  )
}
