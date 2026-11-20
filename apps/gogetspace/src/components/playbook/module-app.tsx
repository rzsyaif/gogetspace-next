"use client"

import Link from "next/link"
import { ArrowLeft, Check, Inbox } from "lucide-react"
import { Badge, Button, Logo } from "@gogetspace/baseplate"
import { EnquiriesPanel } from "@/components/account/enquiries"
import { PanelPage } from "@/components/account/panel"
import { useSite } from "@/lib/account/store"
import { PLAYBOOKS } from "@/lib/playbooks/engine"
import { MODULE_ICON } from "./recommended-tools"

/**
 * The first stand-in for a module's own app, at /sites/[id]/apps/[module]. Manage now opens Ariyes Apps instead
 * (apps/ariyes); this page is no longer linked and stays only as a reference for the Enquiries inbox until Ariyes'
 * Inbox screen is designed.
 */
export function ModuleApp({ siteId, module }: { siteId: string; module: string }) {
  const site = useSite(siteId)
  const def = Object.values(PLAYBOOKS).flatMap((b) => b.modules).find((m) => m.id === module)
  const name = module === "enquiries" ? "Enquiries" : (def?.name ?? "Module")
  const Icon = module === "enquiries" ? Inbox : (MODULE_ICON[module] ?? Check)
  const siteName = site?.name ?? "Your new website"
  const back = site ? `/sites/${siteId}?tab=modules` : "/generate"
  const status = site?.modules?.find((m) => m.id === module)?.status

  return (
    <div data-theme="light" className="flex min-h-svh flex-col bg-canvas text-fg-primary">
      <header className="flex items-center gap-3 border-b border-line-default bg-surface px-4 py-3 sm:px-6">
        <Link href="/dashboard" aria-label="GoGetSpace dashboard">
          <Logo markOnly size={32} />
        </Link>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Icon className="size-5 shrink-0 text-fg-secondary" strokeWidth={1.5} aria-hidden />
          <span className="truncate type-label-lg text-fg-primary">{name}</span>
          <span className="hidden truncate type-body-sm text-fg-tertiary sm:inline">· {siteName}</span>
        </span>
        <Button asChild size="sm" variant="secondary" leadingIcon={<ArrowLeft />}>
          <Link href={back}>
            <span className="max-sm:hidden">Back to the editor</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      </header>
      <PanelPage>
        {module === "enquiries" ? (
          <EnquiriesPanel siteId={siteId} live={site?.status === "live"} />
        ) : (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-surface shadow-block-sm">
              <Icon className="size-8 text-fg-primary" strokeWidth={1.25} />
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h1 className="type-h4 text-fg-primary">{name}</h1>
              {status && <Badge tone={status === "live" ? "success" : "warning"}>{status === "live" ? "Live" : "Test mode"}</Badge>}
            </div>
            <p className="type-body-md text-fg-secondary">
              {name} runs as its own app for {siteName}. This is where you&apos;ll manage it:
            </p>
            {def && (
              <ul className="flex flex-col gap-2 text-left">
                {def.included.map((x) => (
                  <li key={x} className="flex items-start gap-2 type-body-sm text-fg-secondary">
                    <Check className="mt-0.5 size-4 shrink-0 text-fg-tertiary" /> {x}
                  </li>
                ))}
              </ul>
            )}
            <Badge dot={false}>Prototype — the {name} app isn&apos;t part of this demo</Badge>
          </div>
        )}
      </PanelPage>
    </div>
  )
}
