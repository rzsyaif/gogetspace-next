"use client"

import { useEffect, useRef, useState } from "react"
import { Banknote, BellRing, Building2, CalendarCheck, Check, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, FileText, Images, Inbox, Info, MapPinned, MessageSquareText, Newspaper, PhoneCall, Plus, Scale, ShieldCheck, Siren, ThumbsUp, TriangleAlert, UsersRound, WalletMinimal, type LucideIcon } from "lucide-react"
import { Alert, Button, Tooltip } from "@/components/ui"
import { cn } from "@/lib/cn"
import type { Decision } from "@/lib/playbooks/engine"
import type { ModuleDef } from "@/lib/playbooks/types"

export const MODULE_ICON: Record<string, LucideIcon> = {
  appointments: CalendarCheck,
  reviews: ThumbsUp,
  payments: WalletMinimal,
  crm: UsersRound,
  estimates: ClipboardList,
  gallery: Images,
  emergency: Siren,
  branches: Building2,
  insurance: ShieldCheck,
  services: Banknote,
  contact: MapPinned,
  inbox: Inbox,
  // lawyer modules
  "practice-areas": Scale,
  consultations: CalendarCheck,
  "case-enquiries": MessageSquareText,
  "law-clients": UsersRound,
  "fee-proposals": FileText,
  "legal-payments": WalletMinimal,
  "urgent-line": PhoneCall,
  "client-updates": BellRing,
  articles: Newspaper,
  "legal-reviews": ThumbsUp,
  lawyers: Building2,
}

/** tools the owner may already use and can connect later (Figma 185:1960) */
const THIRD_PARTY = [
  ["airtable", "Airtable"],
  ["google-analytics", "Google Analytics"],
  ["google-tag-manager", "Google Tag Manager"],
  ["google-calendar", "Google Calendar"],
  ["google-drive", "Google Drive"],
] as const

export interface OfferedTool {
  m: ModuleDef
  goal: string
  decision?: Decision
  /** dependency or consent note */
  note?: string
}

/**
 * "Recommended Tools" (Figma 185:1960): the tools for the owner's goals as a row of cards — next/previous buttons
 * on desktop, swipe on phones — then what's free, the third-party note, and the monthly total with the plan actions.
 */
export function RecommendedTools({
  tools,
  core,
  total,
  onDecide,
  fallback,
  onSkip,
  onConfirm,
}: {
  tools: OfferedTool[]
  core: ModuleDef[]
  total: number
  onDecide: (id: string, d: Decision) => void
  /** shown when declining the main goal's tool changes the main button */
  fallback?: string
  onSkip: () => void
  onConfirm: () => void
}) {
  const row = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const update = () => {
    const el = row.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 })
  }
  useEffect(() => {
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [tools.length])
  const page = (dir: 1 | -1) => {
    const el = row.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-tool]")
    const step = card ? card.offsetWidth + 12 : el.clientWidth
    el.scrollBy({ left: dir * step * Math.max(1, Math.floor(el.clientWidth / step)), behavior: "smooth" })
  }

  return (
    <section aria-label="Recommended Tools" className="flex flex-col overflow-hidden rounded-[24px] border border-line-default bg-surface shadow-[0_8px_24px_-4px_var(--color-shadow-soft)]">
      <div className="flex items-start gap-4 border-b border-line-default p-4 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="flex items-center gap-2 type-h5 text-fg-primary">
            Recommended Tools
            <Tooltip content="Each tool is an add-on for this website with its own monthly price. Free parts are always included.">
              <button type="button" aria-label="About tools" className="rounded-full text-fg-tertiary hover:text-fg-secondary focus-visible:outline-none focus-visible:focus-ring">
                <CircleHelp className="size-5" />
              </button>
            </Tooltip>
          </h3>
          <p className="type-body-sm text-fg-secondary">I recommend these tools for your goals. Nothing paid is added unless you add it.</p>
        </div>
        {/* only when the cards don't all fit */}
        {!(edges.start && edges.end) && (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <Button size="icon-md" variant="secondary" aria-label="Previous tools" disabled={edges.start} onClick={() => page(-1)}>
              <ChevronLeft />
            </Button>
            <Button size="icon-md" variant="secondary" aria-label="Next tools" disabled={edges.end} onClick={() => page(1)}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 bg-canvas py-4 sm:py-6">
        <div
          ref={row}
          onScroll={update}
          role="list"
          className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {tools.map((t) => (
            <ToolCard key={t.m.id} {...t} onDecide={(d) => onDecide(t.m.id, d)} />
          ))}
        </div>

        <div className="flex flex-col gap-4 px-4 sm:px-6">
          {fallback && (
            <Alert tone="warning" size="sm" icon={<TriangleAlert />}>
              {fallback}
            </Alert>
          )}
          <div className="flex flex-col overflow-hidden rounded-[16px] border border-line-default">
            <div className="flex flex-col gap-3 rounded-[16px] border-b border-line-default bg-subtle p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
              <p className="flex-1 type-h6 text-fg-primary">Included for free</p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {core.map((m) => {
                  const Icon = MODULE_ICON[m.id] ?? Check
                  return (
                    <li key={m.id} className="flex items-center gap-2 type-body-sm text-fg-secondary">
                      <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                      {m.name}
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2 bg-surface px-4 py-3 sm:px-5">
              <Info className="size-5 shrink-0 text-fg-secondary" strokeWidth={1.5} />
              <p className="min-w-0 flex-1 type-body-sm text-fg-secondary">You can also connect your existing third-party tools later</p>
              <span className="flex w-full items-center gap-2 pl-7 sm:w-auto sm:pl-0">
                {THIRD_PARTY.map(([file, name]) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={file} src={`/integrations/${file}.svg`} alt={name} title={name} width={20} height={20} className="size-5 object-contain" />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="bg-accent-blue-subtle px-4 py-3 type-body-sm text-fg-secondary sm:px-6">
        Nothing is charged until you publish your website. You can also decide what to add to your website later.
      </p>

      <div className="flex flex-col gap-4 border-t border-line-default p-4 sm:flex-row sm:items-center sm:gap-12 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col" aria-live="polite">
          <p className="type-h6 text-fg-primary tabular-nums">{total ? `$${total}/month in add-ons` : "No add-ons yet"}</p>
          <p className="type-body-sm text-fg-secondary">On top of your website plan and domain</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="secondary" onClick={onSkip}>
            Later
          </Button>
          <Button onClick={onConfirm}>Create Website Plan</Button>
        </div>
      </div>
    </section>
  )
}

function ToolCard({ m, goal, decision, note, onDecide }: OfferedTool & { onDecide: (d: Decision) => void }) {
  const Icon = MODULE_ICON[m.id] ?? Check
  const added = decision === "added"
  const benefit = m.benefit[goal] ?? Object.values(m.benefit)[0]
  return (
    <article
      role="listitem"
      data-tool
      aria-label={m.name}
      className={cn(
        "flex w-[min(280px,78vw)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border transition-colors sm:w-[300px]",
        added ? "border-line-focus bg-status-info-bg focus-ring" : "border-line-default bg-surface shadow-[0_4px_0_0_var(--color-shadow-block)]",
      )}
    >
      <div className="flex items-center gap-4 px-5 pt-5">
        <Icon className="size-10 shrink-0 text-fg-primary" strokeWidth={1.25} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="type-h6 text-fg-primary">{m.name}</h4>
          <p className="type-label-md text-fg-tertiary tabular-nums">{m.price ? `+$${m.price}/mo` : "Free"}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        {benefit && <p className="type-body-sm text-fg-secondary">{benefit}</p>}
        <ul className="flex flex-col gap-2">
          {m.included.map((x) => (
            <li key={x} className="flex items-start gap-2 type-body-sm text-fg-secondary">
              <Check className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
              {x}
            </li>
          ))}
        </ul>
        {note && <p className="type-caption text-status-warning-text">{note}</p>}
      </div>
      <div className="flex gap-2 px-5 pb-5">
        {added ? (
          <Button size="sm" variant="secondary" aria-pressed leadingIcon={<Check />} onClick={() => onDecide("later")} className="bg-action-secondary-pressed shadow-none" title="Remove">
            Added
          </Button>
        ) : (
          <Button size="sm" variant="secondary" leadingIcon={<Plus />} onClick={() => onDecide("added")}>
            Add
          </Button>
        )}
      </div>
    </article>
  )
}
