"use client"

import { useState } from "react"
import { AppWindow, Check, Plug, Rocket, Sparkles } from "lucide-react"
import { Alert, Button, Checkbox, Dialog, DialogContent } from "@gogetspace/baseplate"
import { cn } from "@gogetspace/baseplate/cn"
import { bringsWith, moduleById, type Decision } from "@/lib/playbooks/engine"
import type { Playbook } from "@/lib/playbooks/types"
import type { ModulesApi } from "@/components/generate/editor-site"
import { showcaseOf } from "@/lib/playbooks/module-showcase"
import { ModulePreview } from "./module-preview"
import { MODULE_ICON } from "./recommended-tools"

export interface AddBilling {
  /** the site is published and billed monthly (otherwise charges start at publish) */
  billed: boolean
  planName: string
  planPrice: number
  /** next payment date, for billed sites */
  renews?: string | null
}

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`

/**
 * Installing a module from the Modules page, in one click: what it looks like for customers and for the owner,
 * what it does and needs, and what the next payment will be. Install hands it to the agent, which puts it on the
 * site and says where to manage it; accounts it needs are connected afterwards.
 */
export function AddModuleDialog({
  module,
  onClose,
  api,
  goals,
  book,
  billing,
  onImplement,
  published,
  onPublish,
}: {
  module: string | null
  onClose: () => void
  api: ModulesApi
  goals: string[]
  book: Playbook
  billing: AddBilling
  onImplement: (module: string) => void
  published: boolean
  onPublish: () => void
}) {
  return (
    <Dialog open={!!module} onOpenChange={(o) => !o && onClose()}>
      {module &&
        (published ? (
          <Flow key={module} module={module} onClose={onClose} api={api} goals={goals} book={book} billing={billing} onImplement={onImplement} />
        ) : (
          <PublishFirst module={module} onClose={onClose} onPublish={onPublish} />
        ))}
    </Dialog>
  )
}

function Flow({ module, onClose, api, goals, book, billing, onImplement }: { module: string; onClose: () => void; api: ModulesApi; goals: string[]; book: Playbook; billing: AddBilling; onImplement: (module: string) => void }) {
  const m = moduleById(module)
  const decisions = Object.fromEntries(api.list.map((x) => [x.id, "added" as Decision]))
  const dep = bringsWith(module, decisions, goals, book)
  const adding = [m, ...(dep ? [dep] : [])]
  const extra = adding.reduce((n, x) => n + x.price, 0)
  const current = api.list.reduce((n, x) => n + moduleById(x.id).price, 0)
  const next = billing.planPrice + current + extra
  const accounts = adding.filter((x) => x.needsAccount)
  const sc = showcaseOf(m.id, m.name, m.included)
  const [view, setView] = useState<"customer" | "owner">("customer")
  const [consent, setConsent] = useState(false)
  const Icon = MODULE_ICON[m.id] ?? Plug

  // one click: add it (and what it needs), then the agent puts it on the site and says where to manage it
  const install = () => {
    api.add(module)
    onClose()
    onImplement(module)
  }

  return (
    <DialogContent
      title={
        <span className="flex items-center gap-3">
          <Icon className="size-7 shrink-0" strokeWidth={1.25} aria-hidden />
          {m.name}
        </span>
      }
      className="max-w-[960px] sm:h-[min(720px,calc(100dvh-32px))]"
      scroll={false}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row [&>*]:max-sm:w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button leadingIcon={<Sparkles />} disabled={!!m.confirm && !consent} onClick={install}>
            {extra ? `Install for ${money(extra)}/month` : "Install for free"}
          </Button>
        </div>
      }
    >
      {/* the preview stays put and only the description beside it scrolls; on a phone (a bottom sheet) the
          preview scrolls with the description between the fixed header and Install button */}
      <div className="-mb-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pb-6 md:grid md:overflow-hidden md:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
        {/* what it looks like, for customers and for the owner */}
        <div className="flex shrink-0 flex-col gap-3 rounded-lg bg-subtle p-3 md:gap-4 md:self-start md:p-4">
          <div role="group" aria-label="Preview" className="grid grid-cols-2 gap-1 rounded-md bg-surface p-1">
            {(
              [
                ["customer", `For ${book.copy.customers}`],
                ["owner", "For you"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={cn("rounded-sm px-2 py-2 type-label-sm focus-visible:outline-none focus-visible:focus-ring", view === id ? "bg-accent-blue-subtle text-fg-link" : "text-fg-secondary hover:text-fg-primary")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="max-md:-my-[38px] max-md:scale-[0.8]">
            <ModulePreview sc={sc} view={view} />
          </div>
          <p className="text-center type-caption text-fg-tertiary max-md:hidden">{view === "customer" ? "On your website, phone and desktop" : "In Ariyes, from Modules › Manage"}</p>
        </div>

        {/* what it does, what it needs, what it costs */}
        <div className="flex flex-col gap-5 md:-mx-1 md:h-full md:min-h-0 md:overflow-y-auto md:overscroll-contain md:px-1 md:pb-6">
          <p className="type-body-md text-fg-primary">{sc.about}</p>

          <div className="flex flex-col gap-2">
            <p className="type-label-md text-fg-primary">What you can do</p>
            <ul className="flex flex-col gap-2">
              {sc.features.map((f) => (
                <li key={f} className="flex gap-2 type-body-sm text-fg-secondary">
                  <Check className="mt-0.5 size-4 shrink-0 text-fg-brand" aria-hidden /> {f}
                </li>
              ))}
            </ul>
          </div>

          <dl className="flex flex-col gap-2 type-body-sm">
            {dep && (
              <div className="flex gap-2">
                <dt className="sr-only">Comes with</dt>
                <dd className="text-fg-secondary">
                  <span className="text-fg-primary">Comes with {dep.name}</span> — {m.name} needs it to work.
                </dd>
              </div>
            )}
            {accounts.map((x) => (
              <div key={x.id} className="flex gap-2">
                <dt className="sr-only">Needs</dt>
                <dd className="flex gap-2 text-fg-secondary">
                  <Plug className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    <span className="text-fg-primary">{x.needsAccount!.connect} after installing.</span> {x.needsAccount!.testMode}.
                  </span>
                </dd>
              </div>
            ))}
            <div className="flex gap-2">
              <dt className="sr-only">Managed in</dt>
              <dd className="flex gap-2 text-fg-secondary">
                <AppWindow className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>You&apos;ll manage it in {sc.manage}.</span>
              </dd>
            </div>
          </dl>

          {m.notice && (
            <Alert tone="warning" size="sm">
              {m.notice}
            </Alert>
          )}
          {m.confirm && <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} label={m.confirm} />}

          <div className="flex flex-col gap-2 rounded-lg bg-subtle p-4" aria-live="polite">
            {extra === 0 ? (
              <p className="type-body-sm text-fg-secondary">Free — your bill doesn&apos;t change.</p>
            ) : (
              <>
                <Line label={`${billing.planName} plan`} value={`${money(billing.planPrice)}/mo`} />
                <Line label="Add-ons you already have" value={`${money(current)}/mo`} />
                <Line label={adding.map((x) => x.name).join(" + ")} value={`+${money(extra)}/mo`} strong />
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line-default pt-3">
                  <span className="type-label-md text-fg-primary">{billing.billed ? `Next payment${billing.renews ? `, ${billing.renews}` : ""}` : "Monthly, from when you publish"}</span>
                  <span className="type-h6 text-fg-primary tabular-nums">{money(next)}</span>
                </div>
                <p className="type-caption text-fg-tertiary">
                  {billing.billed
                    ? `Today you pay ${money(Math.round(extra * 0.5 * 100) / 100)} for the rest of this period. Remove it any time — it stays on until the period you've paid for ends.`
                    : "Nothing is charged until you publish your website."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={cn("min-w-0 type-body-sm", strong ? "text-fg-primary" : "text-fg-secondary")}>{label}</span>
      <span className={cn("shrink-0 type-body-sm tabular-nums", strong ? "font-semibold text-fg-primary" : "text-fg-secondary")}>{value}</span>
    </div>
  )
}

/** modules go on a published website — and publishing is where the owner makes their account */
function PublishFirst({ module, onClose, onPublish }: { module: string; onClose: () => void; onPublish: () => void }) {
  const m = moduleById(module)
  return (
    <DialogContent
      title="Publish your website first"
      className="max-w-[480px]"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row [&>*]:max-sm:w-full">
          <Button variant="secondary" onClick={onClose}>
            Not now
          </Button>
          <Button
            leadingIcon={<Rocket />}
            onClick={() => {
              onClose()
              onPublish()
            }}
          >
            Publish website
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="type-body-md text-fg-secondary">
          {m.name} works on a live website, so publish yours first. It takes a minute, and it&apos;s where you create your free account — then come back here to add {m.name}.
        </p>
        <p className="type-caption text-fg-tertiary">Nothing is charged for {m.name} until you add it.</p>
      </div>
    </DialogContent>
  )
}
