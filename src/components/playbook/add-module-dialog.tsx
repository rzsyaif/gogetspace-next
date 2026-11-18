"use client"

import { useState } from "react"
import { Check, Loader, Plug, Rocket, Sparkles } from "lucide-react"
import { Alert, Button, Checkbox, Dialog, DialogContent, Stepper } from "@/components/ui"
import { cn } from "@/lib/cn"
import { bringsWith, moduleById, type Decision } from "@/lib/playbooks/engine"
import type { ModulesApi } from "@/components/generate/editor-site"
import { MODULE_ICON } from "./recommended-tools"

type Step = "confirm" | "setup" | "implement"

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
 * Adding a module from the Modules page: confirm the price (and what the next payment will be), connect the
 * account it needs if any, then offer to have the agent add it to the site right away.
 */
export function AddModuleDialog({
  module,
  onClose,
  api,
  goals,
  billing,
  onImplement,
  published,
  onPublish,
}: {
  module: string | null
  onClose: () => void
  api: ModulesApi
  goals: string[]
  billing: AddBilling
  onImplement: (module: string) => void
  published: boolean
  onPublish: () => void
}) {
  return (
    <Dialog open={!!module} onOpenChange={(o) => !o && onClose()}>
      {module &&
        (published ? (
          <Flow key={module} module={module} onClose={onClose} api={api} goals={goals} billing={billing} onImplement={onImplement} />
        ) : (
          <PublishFirst module={module} onClose={onClose} onPublish={onPublish} />
        ))}
    </Dialog>
  )
}

function Flow({ module, onClose, api, goals, billing, onImplement }: { module: string; onClose: () => void; api: ModulesApi; goals: string[]; billing: AddBilling; onImplement: (module: string) => void }) {
  const m = moduleById(module)
  const decisions = Object.fromEntries(api.list.map((x) => [x.id, "added" as Decision]))
  const dep = bringsWith(module, decisions, goals)
  const adding = [m, ...(dep ? [dep] : [])]
  const extra = adding.reduce((n, x) => n + x.price, 0)
  const current = api.list.reduce((n, x) => n + moduleById(x.id).price, 0)
  const next = billing.planPrice + current + extra
  const needsSetup = adding.filter((x) => x.needsAccount)
  const steps: Step[] = ["confirm", ...(needsSetup.length ? (["setup"] as Step[]) : []), "implement"]
  const [step, setStep] = useState<Step>("confirm")
  const [consent, setConsent] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected, setConnected] = useState<string[]>([])
  const index = steps.indexOf(step)
  const Icon = MODULE_ICON[m.id] ?? Plug

  const confirm = () => {
    api.add(module)
    setStep(steps[1])
  }
  const connect = (id: string) => {
    setConnecting(id)
    window.setTimeout(() => {
      api.activate(id)
      setConnected((c) => [...c, id])
      setConnecting(null)
    }, 1200)
  }

  const footer =
    step === "confirm" ? (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={m.id === "gallery" && !consent} onClick={confirm}>
          {extra ? `Add for ${money(extra)}/month` : "Add for free"}
        </Button>
      </>
    ) : step === "setup" ? (
      <>
        {!needsSetup.every((x) => connected.includes(x.id)) && (
          <Button variant="secondary" disabled={!!connecting} onClick={() => setStep("implement")}>
            Skip — use test mode
          </Button>
        )}
        <Button disabled={!!connecting || !needsSetup.every((x) => connected.includes(x.id))} onClick={() => setStep("implement")}>
          Continue
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={onClose}>
          Later
        </Button>
        <Button
          leadingIcon={<Sparkles />}
          onClick={() => {
            onClose()
            onImplement(module)
          }}
        >
          Yes, add it now
        </Button>
      </>
    )

  return (
    <DialogContent
      title={step === "implement" ? `Add ${m.name} to your website now?` : step === "setup" ? `Set up ${m.name}` : `Add ${m.name}`}
      description={step === "confirm" ? m.included[0] : undefined}
      className="max-w-[560px]"
      footer={<div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row [&>*]:max-sm:w-full">{footer}</div>}
    >
      {steps.length > 2 && (
        <Stepper
          label={`Adding ${m.name}`}
          className="-mt-2"
          steps={steps.map((s, i) => ({
            title: s === "confirm" ? "Confirm" : s === "setup" ? "Set up" : "Add to site",
            state: i < index ? "done" : i === index ? "current" : "upcoming",
          }))}
        />
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col divide-y divide-line-default rounded-lg border border-line-default">
            {adding.map((x) => {
              const I = MODULE_ICON[x.id] ?? Plug
              return (
                <li key={x.id} className="flex items-center gap-3 p-3">
                  <I className="size-7 shrink-0 text-fg-primary" strokeWidth={1.25} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="type-label-md text-fg-primary">{x.name}</span>
                    {x.id !== m.id && <span className="type-caption text-fg-tertiary">Comes with {m.name} — it needs one to work</span>}
                  </span>
                  <span className="type-label-md text-fg-primary tabular-nums">{x.price ? `+${money(x.price)}/mo` : "Free"}</span>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col gap-2 rounded-lg bg-subtle p-4" aria-live="polite">
            {extra === 0 ? (
              <p className="type-body-sm text-fg-secondary">Free — your bill doesn&apos;t change.</p>
            ) : (
              <>
                <Line label={`${billing.planName} plan`} value={`${money(billing.planPrice)}/mo`} />
                <Line label="Add-ons you already have" value={`${money(current)}/mo`} />
                <Line label={`${adding.map((x) => x.name).join(" + ")}`} value={`+${money(extra)}/mo`} strong />
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

          {m.id === "gallery" && (
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} label="I have written consent from every patient whose photos I'll show" />
          )}
          {needsSetup.length > 0 && (
            <Alert tone="neutral" size="sm" icon={<Plug />}>
              Next, connect {needsSetup.map((x) => x.needsAccount!.label).join(" and ")}. You can also skip and use test mode for now.
            </Alert>
          )}
        </div>
      )}

      {step === "setup" && (
        <ul className="flex flex-col gap-3">
          {needsSetup.map((x) => {
            const done = connected.includes(x.id)
            const busy = connecting === x.id
            const I = MODULE_ICON[x.id] ?? Plug
            return (
              <li key={x.id} className={cn("flex flex-col gap-3 rounded-lg border p-4", done ? "border-line-focus bg-status-info-bg" : "border-line-default")}>
                <div className="flex items-center gap-3">
                  <I className="size-7 shrink-0 text-fg-primary" strokeWidth={1.25} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="type-label-md text-fg-primary">{x.needsAccount!.connect}</span>
                    <span className="type-body-sm text-fg-secondary">{done ? `Connected — ${x.name} is live, out of test mode.` : `Connect it so ${x.name} works for real. ${x.needsAccount!.testMode}.`}</span>
                  </span>
                </div>
                {!done && (
                  <Button size="sm" className="self-start" disabled={busy} leadingIcon={busy ? <Loader className="animate-spin" /> : <Plug />} onClick={() => connect(x.id)}>
                    {busy ? "Connecting…" : x.needsAccount!.connect}
                  </Button>
                )}
                {done && (
                  <span className="flex items-center gap-2 type-label-md text-status-success-text">
                    <Check className="size-4" /> Connected
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {step === "implement" && (
        <div className="flex items-start gap-4 rounded-lg bg-subtle p-4">
          <Icon className="size-10 shrink-0 text-fg-primary" strokeWidth={1.25} />
          <div className="flex flex-col gap-1">
            <p className="type-label-lg text-fg-primary">{m.name} is added to your plan.</p>
            <p className="type-body-sm text-fg-secondary">
              I can put it on your website now{m.pages?.length ? `, with its own page` : ""} — it takes about a minute and nothing else changes. You&apos;ll see me work in the chat.
            </p>
          </div>
        </div>
      )}
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
