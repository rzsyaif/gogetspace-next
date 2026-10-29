"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Check, CircleCheck, Clock, ExternalLink, Globe, Loader, ShieldCheck } from "lucide-react"
import { Alert, Badge, Button, CopyField, Dialog, DialogContent, Field, Input, Select, Stepper, copyText } from "@/components/ui"
import { cn } from "@/lib/cn"

/** where people usually buy domains in Malaysia, Singapore and Indonesia, and where each keeps its DNS settings */
const PROVIDERS: { id: string; name: string; path: string; tip?: string; url?: string }[] = [
  { id: "exabytes", name: "Exabytes", path: "Client Area → Domains → choose the domain → DNS Management", url: "https://www.exabytes.my" },
  { id: "godaddy", name: "GoDaddy", path: "My Products → Domains → choose the domain → DNS", url: "https://www.godaddy.com" },
  { id: "namecheap", name: "Namecheap", path: "Domain List → Manage → Advanced DNS", url: "https://www.namecheap.com" },
  { id: "cloudflare", name: "Cloudflare", path: "Choose the domain → DNS → Records", tip: "Set Proxy status to “DNS only” (grey cloud) for both records.", url: "https://dash.cloudflare.com" },
  { id: "niagahoster", name: "Niagahoster", path: "Member Area → Domain → Kelola DNS", url: "https://www.niagahoster.co.id" },
  { id: "other", name: "Somewhere else / not sure", path: "Sign in where you pay for the domain each year and look for “DNS”, “DNS records” or “Zone editor”.", tip: "Not sure who that is? Search your email for the domain's renewal notice." },
]

const SECOND_LEVEL = /\.(com|net|org|edu|gov|co|my|sg|id|ac|or|web)\.(my|sg|id|uk|au)$/i
const VALID = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i

/** the records for a domain: a root domain gets an A record and a www CNAME; a subdomain just a CNAME */
export function dnsRecords(domain: string) {
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
  const labels = d.split(".").length - (SECOND_LEVEL.test(d) ? 3 : 2)
  if (labels > 0) {
    const host = d.split(".").slice(0, labels).join(".")
    return { domain: d, root: false, records: [{ type: "CNAME", host, value: "cname.get.space", purpose: `Points ${d} to your website` }] }
  }
  return {
    domain: d,
    root: true,
    records: [
      { type: "A", host: "@", value: "76.76.21.21", purpose: `Points ${d} to your website` },
      { type: "CNAME", host: "www", value: "cname.get.space", purpose: `Makes www.${d} work too` },
    ],
  }
}

type StepId = "domain" | "records" | "check"
const STEPS: { id: StepId; title: string }[] = [
  { id: "domain", title: "Your domain" },
  { id: "records", title: "Add DNS records" },
  { id: "check", title: "Check connection" },
]

/**
 * Connect a domain bought from another provider in three steps: which domain (and website, from the dashboard) and
 * where it was bought; the DNS records to add, each with a copy button and instructions for that provider; then a
 * check that finds the records. If they haven't spread yet, it can finish as "waiting for DNS" and keep checking.
 */
export function ConnectDomainDialog({
  open,
  onOpenChange,
  siteName,
  freeDomain,
  initialDomain,
  startAt = "domain",
  sites,
  onConnect,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  siteName?: string
  freeDomain?: string
  initialDomain?: string
  startAt?: StepId
  /** from the dashboard: pick which website it's for */
  sites?: { id: string; name: string }[]
  onConnect: (domain: string, status: "pending" | "connected", siteId?: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ConnectFlow
          siteName={siteName}
          freeDomain={freeDomain}
          initialDomain={initialDomain}
          startAt={startAt}
          sites={sites}
          onClose={() => onOpenChange(false)}
          onConnect={(d, st, id) => {
            onConnect(d, st, id)
            onOpenChange(false)
          }}
        />
      )}
    </Dialog>
  )
}

type Check = "idle" | "checking" | "partial" | "done"

function ConnectFlow({
  siteName,
  freeDomain,
  initialDomain,
  startAt,
  sites,
  onClose,
  onConnect,
}: {
  siteName?: string
  freeDomain?: string
  initialDomain?: string
  startAt: StepId
  sites?: { id: string; name: string }[]
  onClose: () => void
  onConnect: (domain: string, status: "pending" | "connected", siteId?: string) => void
}) {
  const [step, setStep] = useState<StepId>(startAt)
  const [domain, setDomain] = useState(initialDomain ?? "")
  const [provider, setProvider] = useState("exabytes")
  const [siteId, setSiteId] = useState(sites?.[0]?.id ?? "")
  const [check, setCheck] = useState<Check>("idle")
  const [attempts, setAttempts] = useState(0)
  const [allCopied, setAllCopied] = useState(false)
  const valid = VALID.test(dnsRecords(domain).domain)
  const dns = dnsRecords(domain)
  const p = PROVIDERS.find((x) => x.id === provider)!
  const index = STEPS.findIndex((s) => s.id === step)
  const forName = sites ? sites.find((s) => s.id === siteId)?.name : siteName

  // the prototype's DNS check: the A record is found first, the CNAME on the next try
  useEffect(() => {
    if (check !== "checking") return
    const t = window.setTimeout(() => setCheck(attempts >= 2 || !dns.root ? "done" : "partial"), 1400)
    return () => window.clearTimeout(t)
  }, [check, attempts, dns.root])

  const runCheck = () => {
    setAttempts((a) => a + 1)
    setCheck("checking")
  }
  const recordFound = (i: number) => check === "done" || (check === "partial" && i === 0)

  const footer = (
    <div className="flex w-full gap-3 [&>*]:flex-1 sm:justify-end sm:[&>*]:flex-none">
      {step === "domain" ? (
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || (sites && !siteId)} onClick={() => setStep("records")}>
            Next: DNS records
          </Button>
        </>
      ) : step === "records" ? (
        <>
          <Button variant="secondary" leadingIcon={<ArrowLeft />} onClick={() => setStep("domain")}>
            Back
          </Button>
          <Button
            onClick={() => {
              setStep("check")
              runCheck()
            }}
          >
            <span className="sm:hidden">Check now</span>
            <span className="hidden sm:inline">I&apos;ve added them — check now</span>
          </Button>
        </>
      ) : check === "done" ? (
        <Button onClick={() => onConnect(dns.domain, "connected", siteId || undefined)}>Done</Button>
      ) : (
        <>
          <Button variant="secondary" disabled={check === "checking"} onClick={() => onConnect(dns.domain, "pending", siteId || undefined)}>
            Finish later
          </Button>
          <Button disabled={check === "checking"} leadingIcon={check === "checking" ? <Loader className="animate-spin" /> : undefined} onClick={runCheck}>
            {check === "checking" ? "Checking…" : "Check again"}
          </Button>
        </>
      )}
    </div>
  )

  return (
    <DialogContent
      title="Connect a domain you own"
      description={forName ? <>For <span className="text-fg-primary">{forName}</span>. You keep paying your provider for the domain; nothing moves.</> : undefined}
      className="max-w-[640px]"
      footer={footer}
    >
      <Stepper
        label="Connecting a domain"
        className="-mt-2"
        onSelect={(i) => i < index && check !== "checking" && setStep(STEPS[i].id)}
        steps={STEPS.map((s, i) => ({
          title: s.title,
          caption: i === 0 ? (valid ? dns.domain : "Domain & provider") : i === 1 ? `${dns.records.length} ${dns.records.length === 1 ? "record" : "records"}` : check === "done" ? "Connected" : check === "partial" ? "Waiting for DNS" : "Takes a minute",
          state: i < index || (i === 2 && check === "done") ? "done" : i === index ? (i === 2 && check === "partial" ? "warning" : "current") : "upcoming",
        }))}
      />

      {step === "domain" && (
        <div className="flex flex-col gap-4">
          {sites && (
            <Field label="Website">
              <Select value={siteId} onValueChange={setSiteId} options={sites.map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
          )}
          <Field label="Your domain" helper={domain && !valid ? "That doesn't look like a domain yet — e.g. rahmadental.com" : "Without https:// — e.g. baktianalisa.com.my"}>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourpractice.com" leadingIcon={<Globe />} autoFocus autoComplete="off" spellCheck={false} />
          </Field>
          <Field label="Where did you buy it?" helper="So we can show where its DNS settings are.">
            <Select value={provider} onValueChange={setProvider} options={PROVIDERS.map((x) => ({ value: x.id, label: x.name }))} />
          </Field>
          <Alert tone="neutral" size="sm" icon={<ShieldCheck />}>
            Email that uses this domain keeps working — we only add records for the website.
          </Alert>
        </div>
      )}

      {step === "records" && (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-4">
            <Instruction n={1} title={`Open the DNS settings at ${p.id === "other" ? "your provider" : p.name}`}>
              <p className="type-body-sm text-fg-secondary">{p.path}</p>
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 self-start type-label-md text-fg-link hover:underline">
                  Open {p.name} <ExternalLink className="size-3.5" />
                </a>
              )}
            </Instruction>
            <Instruction n={2} title={dns.root ? "Remove old records for @ and www" : `Remove any old record for ${dns.records[0].host}`}>
              <p className="type-body-sm text-fg-secondary">
                {dns.root
                  ? "If there's already an A record with the name @ (or blank), or a CNAME called www, delete or edit it — otherwise visitors may still land on the old site."
                  : "If there's already a record with this name, delete or edit it first."}{" "}
                Leave MX and TXT records alone; they&apos;re for email.
              </p>
            </Instruction>
            <Instruction n={3} title={`Add ${dns.records.length === 1 ? "this record" : "these two records"}`}>
              <div className="flex flex-col gap-2">
                {dns.records.map((r) => (
                  <div key={r.type + r.host} className="flex flex-col gap-2 rounded-md border border-line-default bg-subtle p-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand" dot={false}>
                        {r.type}
                      </Badge>
                      <span className="type-caption text-fg-tertiary">{r.purpose}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] sm:items-end">
                      <Labeled label="Name / Host">
                        <CopyField value={r.host} label={`Copy ${r.type} name`} />
                      </Labeled>
                      <Labeled label={r.type === "A" ? "Value / Points to (IP address)" : "Value / Points to"}>
                        <CopyField value={r.value} label={`Copy ${r.type} value`} />
                      </Labeled>
                      <Labeled label="TTL">
                        <span className="flex h-10 items-center type-body-sm text-fg-secondary">Automatic</span>
                      </Labeled>
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="link"
                  className="self-start"
                  onClick={async () => {
                    const text = dns.records.map((r) => `${r.type}\t${r.host}\t${r.value}`).join("\n")
                    if (await copyText(text)) {
                      setAllCopied(true)
                      window.setTimeout(() => setAllCopied(false), 1500)
                    }
                  }}
                >
                  {allCopied ? "Copied all records" : "Copy all records as text"}
                </Button>
                {p.tip && (
                  <Alert tone="info" size="sm">
                    {p.tip}
                  </Alert>
                )}
              </div>
            </Instruction>
            <Instruction n={4} title="Save, then come back here">
              <p className="type-body-sm text-fg-secondary">Most providers update within 10–30 minutes. Some take a few hours, rarely up to 48.</p>
            </Instruction>
          </ol>
        </div>
      )}

      {step === "check" && (
        <div className="flex flex-col gap-4">
          {check === "done" ? (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <CircleCheck className="size-12 text-status-success-text" strokeWidth={1.5} />
              <p className="type-h5 text-fg-primary">{dns.domain} is connected</p>
              <p className="type-body-sm text-fg-secondary">Secure https is being set up and will be ready within a few minutes. {freeDomain ? `${freeDomain} keeps working and sends visitors to the new address.` : ""}</p>
            </div>
          ) : (
            <p className="type-body-md text-fg-secondary">
              {check === "checking"
                ? `Looking up the DNS records for ${dns.domain}…`
                : "One record is in place. The other hasn't reached everyone yet — this is normal and usually sorts itself out within the hour."}
            </p>
          )}
          <ul className="flex flex-col divide-y divide-line-default rounded-md border border-line-default">
            {dns.records.map((r, i) => {
              const found = recordFound(i)
              return (
                <li key={r.type + r.host} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full [&_svg]:size-4",
                      check === "checking" ? "bg-subtle text-fg-secondary" : found ? "bg-status-success-bg text-status-success-text" : "bg-status-warning-bg text-status-warning-text",
                    )}
                  >
                    {check === "checking" ? <Loader className="animate-spin" /> : found ? <Check strokeWidth={2.5} /> : <Clock />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="type-label-md text-fg-primary">
                      {r.type} · {r.host === "@" ? dns.domain : `${r.host}.${dns.domain}`}
                    </span>
                    <span className="truncate type-caption text-fg-tertiary">
                      {check === "checking" ? "Checking…" : found ? `Points to ${r.value}` : `Not found yet — still points to the old host`}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
          {check === "partial" && (
            <Alert tone="neutral" size="sm" icon={<Clock />}>
              You can close this. We&apos;ll keep checking every few minutes and email you when {dns.domain} is live; the website stays on {freeDomain ?? "its free address"} until then.
            </Alert>
          )}
        </div>
      )}
    </DialogContent>
  )
}

function Instruction({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-blue-subtle type-label-sm text-fg-link">{n}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="type-label-md text-fg-primary">{title}</p>
        {children}
      </div>
    </li>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="type-caption text-fg-tertiary">{label}</span>
      {children}
    </span>
  )
}
