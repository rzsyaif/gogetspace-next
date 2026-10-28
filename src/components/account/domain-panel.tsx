"use client"

import { useState } from "react"
import Link from "next/link"
import { CircleCheck, Globe, Link2, ShoppingCart } from "lucide-react"
import { Alert, Badge, Button, Field, Input, RadioCard } from "@/components/ui"
import { planInfo } from "@/lib/plans"
import { accountActions, useAccountState } from "@/lib/account/store"
import { useEditorSite } from "@/components/generate/editor-site"
import { DetailCard, PanelSection } from "./panel"

/**
 * The editor's Domain tab: the free address, the connected domain, and "Connect a domain you own" — which
 * lists domains the account bought but isn't using yet, or takes one bought elsewhere (DNS steps).
 */
export function DomainPanel({ onOpenPlan }: { onOpenPlan: () => void }) {
  const { site, plan, mode } = useEditorSite()
  const { domains } = useAccountState()
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<string>("")
  const [other, setOther] = useState("")
  // the site being created in /generate isn't in the account yet: remember the choice until it's published
  const [draftDomain, setDraftDomain] = useState<string | null>(null)
  const unused = domains.filter((d) => d.siteId === null)
  const allowed = planInfo(plan).customDomain
  const connected = mode === "site" ? site.domain : draftDomain ? { name: draftDomain, status: "connected" as const } : null
  const live = site.status === "live"
  const otherOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(other.trim())
  const picked = choice || unused[0]?.name || ""

  const connect = (name: string, ownedHere: boolean) => {
    if (mode === "site") {
      if (ownedHere) accountActions.assignDomain(site.id, name)
      else accountActions.connectDomain(site.id, name.toLowerCase())
    } else setDraftDomain(name.toLowerCase())
    setOpen(false)
    setOther("")
  }

  return (
    <div className="flex flex-col gap-4">
      <DetailCard label="Free address" value={site.freeDomain} trailing={live ? <Badge tone="success">Live</Badge> : undefined} meta={live ? undefined : "Goes live when you publish"} />

      {connected && (
        <DetailCard
          label="Your domain"
          value={connected.name}
          trailing={<Badge tone={connected.status === "connected" ? "success" : "warning"}>{connected.status === "connected" ? "Connected" : "Waiting for DNS"}</Badge>}
          meta={connected.status === "pending" ? "Add an A record (76.76.21.21) and a CNAME for www (cname.get.space) where you bought it." : undefined}
        >
          <Button size="sm" variant="link" className="mt-1 self-start" onClick={() => (mode === "site" ? accountActions.disconnectDomain(site.id) : setDraftDomain(null))}>
            Disconnect
          </Button>
        </DetailCard>
      )}

      {!open ? (
        <Button variant="secondary" leadingIcon={<Link2 />} onClick={() => setOpen(true)}>
          {connected ? "Use a different domain" : "Connect a domain you own"}
        </Button>
      ) : !allowed ? (
        <Alert tone="info" size="sm" title="Custom domains come with Starter" actions={<Button size="sm" onClick={onOpenPlan}>See plans</Button>}>
          {site.name} is on the Free plan, so it uses {site.freeDomain}.
        </Alert>
      ) : (
        <PanelSection title="Connect a domain you own" className="gap-4 p-4 sm:p-4">
          {unused.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 type-label-md text-fg-secondary">Bought through GoGetSpace</legend>
              {unused.map((d) => (
                <RadioCard
                  key={d.name}
                  name="owned-domain"
                  checked={picked === d.name}
                  onChange={() => setChoice(d.name)}
                  title={d.name}
                  description={`Unused · ${d.autoRenew ? "renews" : "expires"} ${d.expires}`}
                />
              ))}
              <Button leadingIcon={<CircleCheck />} onClick={() => connect(picked, true)} disabled={!picked}>
                Connect {picked}
              </Button>
              <span className="type-caption text-fg-tertiary">Bought through GoGetSpace, so it works within minutes — no DNS steps.</span>
            </fieldset>
          )}
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (otherOk) connect(other.trim(), false)
            }}
          >
            <Field label={unused.length ? "Or one you bought elsewhere" : "A domain you bought elsewhere"} helper={other && !otherOk ? "e.g. baktianalisa.com.my" : undefined}>
              <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="yourpractice.com" leadingIcon={<Globe />} />
            </Field>
            <Button type="submit" variant="secondary" disabled={!otherOk}>
              Connect
            </Button>
          </form>
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </PanelSection>
      )}

      <Button asChild variant="ghost" leadingIcon={<ShoppingCart />} className="self-start">
        <Link href={`/dashboard/domains?buy=1${mode === "site" ? `&site=${site.id}` : ""}`}>Buy a new domain</Link>
      </Button>
    </div>
  )
}
