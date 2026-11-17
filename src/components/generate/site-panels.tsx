"use client"

import Link from "next/link"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Blocks, FileText, FolderTree, Inbox, NotebookPen, SwatchBook } from "lucide-react"
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { AnalyticsPanel } from "@/components/account/analytics"
import { EnquiriesPanel } from "@/components/account/enquiries"
import { PlanPanel } from "@/components/account/plan-panel"
import { PanelHeader, PanelPage } from "@/components/account/panel"
import { ENQUIRIES } from "@/lib/account/data"
import { useAccountState } from "@/lib/account/store"
import { useEditorSite } from "./editor-site"
import { useGen } from "./gen-provider"
import { moduleById } from "@/lib/playbooks/engine"
import { ModulesPanel } from "@/components/playbook/modules-panel"
import type { Tab } from "./workspace"

/** The editor's full-width tabs: Analytics, Plan and Modules (with Enquiries) for the open website. */
export function SitePanel({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { site, plan, setPlan, usage, billing, modules } = useEditorSite()
  const addons = modules?.list.map((m) => ({ id: m.id, name: moduleById(m.id).name, price: moduleById(m.id).price, status: m.status }))
  return (
    <PanelPage>
      {tab === "analytics" && <AnalyticsPanel site={site} plan={plan} onUpgrade={() => onTab("plan")} />}
      {tab === "plan" && <PlanPanel siteName={site.name} plan={plan} usage={usage} billing={billing} onChange={setPlan} onManageDomain={() => onTab("domain")} addons={addons} onManageAddons={() => onTab("modules")} />}
      {tab === "modules" && <ModulesPage />}
    </PanelPage>
  )
}

/** Modules: the website's tools, and the enquiries its forms collect (the inbox is one of the free tools) */
function ModulesPage() {
  const { site, billing, modules } = useEditorSite()
  const { s } = useGen()
  const q = useSearchParams()
  const { enquiryStatus } = useAccountState()
  const [view, setView] = useState(q.get("view") === "enquiries" || q.get("tab") === "enquiries" ? "enquiries" : "tools")
  const unread = ENQUIRIES.filter((e) => e.siteId === site.id && (enquiryStatus[e.id] ?? e.status) === "new").length
  return (
    <Tabs value={view} onValueChange={setView} className="flex flex-col gap-6">
      <TabsList aria-label="Modules">
        <TabsTrigger value="tools">
          <Blocks /> Tools
        </TabsTrigger>
        <TabsTrigger value="enquiries">
          <Inbox /> Enquiries
          {unread > 0 && (
            <Badge tone="brand" dot={false} className="ml-1">
              {unread}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tools">
        {modules && s.pb ? (
          <ModulesPanel siteName={site.name} api={modules} billed={billing.billed} goals={s.pb.goals} />
        ) : (
          <div className="flex flex-col gap-6">
            <PanelHeader title="Modules" description={<>The tools on <strong className="font-semibold text-fg-primary">{site.name}</strong>.</>} />
            <div className="flex items-center gap-4 rounded-lg border border-line-default bg-surface p-4">
              <Inbox className="size-8 shrink-0 text-fg-secondary" strokeWidth={1.5} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-label-md text-fg-primary">Enquiry inbox</span>
                <span className="type-body-sm text-fg-secondary">Messages and requests from your site&apos;s forms, in one inbox.</span>
              </span>
              <Badge tone="success">Included free</Badge>
            </div>
            <p className="type-body-sm text-fg-tertiary">Need bookings, payments or a catalog? Ask the agent and it adds them to your site.</p>
          </div>
        )}
      </TabsContent>
      <TabsContent value="enquiries">
        <EnquiriesPanel siteId={site.id} live={site.status === "live"} />
      </TabsContent>
    </Tabs>
  )
}

const continueHref = (prompt: string) => `/generate?q=${encodeURIComponent(prompt)}`

/** Agent column for a website that is still being planned: where it stands and how to carry on. */
export function DraftChat() {
  const { site } = useEditorSite()
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
      <div className="flex justify-end pl-12">
        <p className="rounded-lg border border-line-default bg-surface px-5 py-4 type-body-md text-fg-primary shadow-[0_2px_0_0_var(--color-shadow-block)]">{site.prompt}</p>
      </div>
      <div className="flex flex-col gap-4 type-body-md text-fg-primary">
        <p>
          I&apos;ve drafted a brief, some style options and a page plan for <strong className="font-semibold">{site.name}</strong>. Nothing is built yet — review the three and I&apos;ll start.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {[
          { title: "Project Brief", Icon: FileText },
          { title: "Design & Style", Icon: SwatchBook },
          { title: "Sitemap Plan", Icon: FolderTree },
        ].map(({ title, Icon }) => (
          <li key={title} className="flex items-center gap-3 rounded-lg border border-line-default bg-subtle p-3">
            <Icon className="size-7 shrink-0 text-fg-secondary" strokeWidth={1.5} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate type-body-md text-fg-secondary">{title}</span>
              <span className="type-caption text-fg-tertiary">Awaiting confirmation</span>
            </span>
          </li>
        ))}
      </ul>
      <Button asChild size="lg" trailingIcon={<ArrowRight />} className="self-start">
        <Link href={continueHref(site.prompt)}>Continue planning</Link>
      </Button>
    </div>
  )
}

/** Preview area for a website that hasn't been built. */
export function DraftPreview() {
  const { site } = useEditorSite()
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line-strong bg-subtle p-8 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-surface text-fg-secondary shadow-block-sm">
        <NotebookPen className="size-7" strokeWidth={1.5} />
      </span>
      <Badge dot={false}>DRAFT · {site.pagesPlanned} pages planned</Badge>
      <p className="type-h5 text-fg-primary">Nothing built yet</p>
      <p className="max-w-sm type-body-sm text-fg-secondary">Confirm the brief, style and page plan, and the preview of {site.name} appears here while I build it.</p>
      <Button asChild variant="secondary">
        <Link href={continueHref(site.prompt)}>Continue planning</Link>
      </Button>
    </div>
  )
}
