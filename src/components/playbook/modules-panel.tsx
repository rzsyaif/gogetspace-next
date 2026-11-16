"use client"

import { useState } from "react"
import { FlaskConical, Plus, Trash2 } from "lucide-react"
import { Alert, Button } from "@/components/ui"
import { PanelHeader, PanelSection } from "@/components/account/panel"
import { DENTIST } from "@/lib/playbooks/dentist"
import { bringsWith, coreModules, moduleById } from "@/lib/playbooks/engine"
import type { Decision } from "@/lib/playbooks/engine"
import type { ModulesApi } from "@/components/generate/editor-site"
import { ModuleCard, priceLabel } from "./module-card"

/**
 * The editor's Modules tab for a playbook site: what's added (live or in test mode), what's included free, and
 * what can be added later. Every add-on has its own monthly price, billed with this website.
 */
export function ModulesPanel({ siteName, api, billed, goals }: { siteName: string; api: ModulesApi; billed: boolean; goals: string[] }) {
  const [note, setNote] = useState<string | null>(null)
  const ids = new Set(api.list.map((m) => m.id))
  const added = api.list.map((m) => ({ def: moduleById(m.id), status: m.status }))
  const later = DENTIST.modules.filter((m) => !m.core && !ids.has(m.id))
  const total = added.reduce((n, m) => n + m.def.price, 0)
  const decisions = Object.fromEntries(api.list.map((m) => [m.id, "added" as Decision]))
  const goalFor = (id: string) => goals.find((g) => DENTIST.goals.find((x) => x.id === g)?.modules.includes(id))

  return (
    <div className="flex flex-col gap-6">
      <PanelHeader
        title="Modules"
        description={
          <>
            Add-ons for <strong className="font-semibold text-fg-primary">{siteName}</strong>. Each has its own monthly price, billed with this website
            {billed ? "." : " from when you publish."}
          </>
        }
        actions={<span className="type-label-lg text-fg-primary tabular-nums">{total ? `$${total}/month` : "No add-ons"}</span>}
      />

      {note && (
        <Alert tone="success" size="sm" onDismiss={() => setNote(null)}>
          {note}
        </Alert>
      )}

      <PanelSection title={`Added (${added.length})`}>
        {added.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {added.map(({ def, status }) => (
              <ModuleCard
                key={def.id}
                m={def}
                goal={goalFor(def.id)}
                status={status}
                actions={
                  <div className="flex flex-col gap-3">
                    {status === "test" && def.needsAccount && (
                      <p className="flex items-start gap-2 rounded-sm bg-status-warning-bg px-3 py-2 type-body-sm text-status-warning-text">
                        <FlaskConical className="mt-0.5 size-4 shrink-0" />
                        {/^test mode/i.test(def.needsAccount.testMode) ? def.needsAccount.testMode : `Test mode — ${def.needsAccount.testMode.charAt(0).toLowerCase()}${def.needsAccount.testMode.slice(1)}`}.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {status === "test" && def.needsAccount && (
                        <Button size="sm" onClick={() => (api.activate(def.id), setNote(`${def.name} is live — ${def.needsAccount!.label} connected.`))}>
                          {def.needsAccount.connect}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        leadingIcon={<Trash2 />}
                        onClick={() => (api.remove(def.id), setNote(`${def.name} removed.${billed && def.price ? " It stays on until the end of the period you've paid for." : ""}`))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <p className="type-body-sm text-fg-secondary">No add-ons yet — the free parts below are on your site already.</p>
        )}
      </PanelSection>

      <PanelSection title="Included free">
        <ul className="grid gap-3 sm:grid-cols-3">
          {coreModules().map((m) => (
            <li key={m.id} className="flex flex-col gap-1 rounded-md bg-subtle p-3">
              <span className="type-label-md text-fg-primary">{m.name}</span>
              <span className="type-body-sm text-fg-secondary">{m.included[0]}</span>
            </li>
          ))}
        </ul>
      </PanelSection>

      {later.length > 0 && (
        <PanelSection title="Add later">
          <ul className="flex flex-col divide-y divide-line-default">
            {later.map((m) => {
              const dep = bringsWith(m.id, decisions, goals)
              return (
                <li key={m.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="type-label-md text-fg-primary">{m.name}</span>
                    <span className="type-body-sm text-fg-secondary">{m.included[0]}</span>
                    {dep && <span className="type-caption text-fg-tertiary">Comes with {dep.name} ({priceLabel(dep)})</span>}
                  </span>
                  <span className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="type-body-sm text-fg-primary tabular-nums">{priceLabel(m)}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      leadingIcon={<Plus />}
                      onClick={() => (api.add(m.id), setNote(`${m.name} added${dep ? ` with ${dep.name}` : ""}${m.needsAccount ? " — it runs in test mode until you connect " + m.needsAccount.label : ""}. Ask the agent to build ${m.pages ? "its page" : "it into your pages"}.`))}
                    >
                      {m.id === "gallery" ? "I have patient consent — add" : "Add"}
                    </Button>
                  </span>
                </li>
              )
            })}
          </ul>
        </PanelSection>
      )}
    </div>
  )
}
