"use client"

import { useState } from "react"
import Link from "next/link"
import { CircleCheck, Globe, Link2, ShoppingCart } from "lucide-react"
import { ConnectDomainDialog } from "./connect-domain"
import { Alert, Badge, Button, RadioCard } from "@/components/ui"
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
  const [external, setExternal] = useState<null | { at: "domain" | "records"; domain?: string }>(null)
  // the site being created in /generate isn't in the account yet: remember the choice until it's published
  const [draftDomain, setDraftDomain] = useState<{ name: string; status: "connected" | "pending" } | null>(null)
  const unused = domains.filter((d) => d.siteId === null)
  const allowed = planInfo(plan).customDomain
  const connected = mode === "site" ? site.domain : draftDomain
  const live = site.status === "live"
  const picked = choice || unused[0]?.name || ""

  const connect = (name: string, ownedHere: boolean, status: "connected" | "pending" = "connected") => {
    if (mode === "site") {
      if (ownedHere) accountActions.assignDomain(site.id, name)
      else accountActions.connectDomain(site.id, name.toLowerCase(), status)
    } else setDraftDomain({ name: name.toLowerCase(), status })
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <DetailCard label="Free address" value={site.freeDomain} trailing={live ? <Badge tone="success">Live</Badge> : undefined} meta={live ? undefined : "Goes live when you publish"} />

      {connected && (
        <DetailCard
          label="Your domain"
          value={connected.name}
          trailing={<Badge tone={connected.status === "connected" ? "success" : "warning"}>{connected.status === "connected" ? "Connected" : "Waiting for DNS"}</Badge>}
          meta={connected.status === "pending" ? `The site stays on ${site.freeDomain} until the DNS records are found. We check every few minutes.` : undefined}
        >
          {connected.status === "pending" && (
            <Button size="sm" variant="secondary" className="mt-2 self-start" onClick={() => setExternal({ at: "records", domain: connected.name })}>
              See DNS steps & check
            </Button>
          )}
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
          <div className="flex flex-col gap-2">
            <p className="type-label-md text-fg-secondary">{unused.length ? "Or one you bought elsewhere" : "A domain you bought elsewhere"}</p>
            <Button variant="secondary" leadingIcon={<Globe />} onClick={() => setExternal({ at: "domain" })}>
              Connect a domain from another provider
            </Button>
            <span className="type-caption text-fg-tertiary">Exabytes, GoDaddy, Namecheap, Cloudflare and others. We&apos;ll walk you through the two DNS records to add.</span>
          </div>
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </PanelSection>
      )}

      <ConnectDomainDialog
        open={external !== null}
        onOpenChange={(o) => !o && setExternal(null)}
        siteName={site.name}
        freeDomain={site.freeDomain}
        initialDomain={external?.domain}
        startAt={external?.at}
        onConnect={(name, status) => connect(name, false, status)}
      />

      <Button asChild variant="ghost" leadingIcon={<ShoppingCart />} className="self-start">
        <Link href={`/dashboard/domains?buy=1${mode === "site" ? `&site=${site.id}` : ""}`}>Buy a new domain</Link>
      </Button>
    </div>
  )
}
