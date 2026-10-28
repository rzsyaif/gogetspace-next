"use client"

import { useEffect, useEffectEvent, useState } from "react"
import { Check, Copy, ExternalLink, Globe, Link2, Loader } from "lucide-react"
import { AuthForm } from "@/components/auth/login-dialog"
import { Button, Dialog, DialogContent, Input, RadioCard } from "@/components/ui"
import { useGen } from "./gen-provider"

type Stage = "signup" | "publish" | "publishing" | "live"

/** Publish flow: sign-up is only asked for here, then pick a domain and go live. */
export function PublishFlow({ open, onOpenChange, styleId }: { open: boolean; onOpenChange: (o: boolean) => void; styleId: string }) {
  const { s, dispatch } = useGen()
  const [stage, setStage] = useState<Stage>("publish")
  const [opened, setOpened] = useState(false)
  if (open !== opened) {
    setOpened(open)
    if (open) setStage(s.account ? (s.publish.status === "live" ? "live" : "publish") : "signup")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {stage === "signup" && <SignUp onDone={() => setStage("publish")} />}
      {stage === "publish" && <ChooseDomain onPublish={() => setStage("publishing")} />}
      {stage === "publishing" && <Publishing onDone={(domain) => { dispatch({ type: "published", domain }); setStage("live") }} />}
      {stage === "live" && <Live styleId={styleId} onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}

/** Sign-up on its own (from the Account button) */
export function AccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <SignUp onDone={() => onOpenChange(false)} title="Log in or create your account" />}
    </Dialog>
  )
}

function SignUp({ onDone, title = "Create your account to publish" }: { onDone: () => void; title?: string }) {
  const { dispatch } = useGen()
  return (
    <AuthForm
      initialMode="signup"
      title={title}
      description="Your site and everything you've confirmed is saved to the account. It takes a few seconds."
      onSuccess={(account) => {
        dispatch({ type: "signUp", ...account })
        onDone()
      }}
    />
  )
}

function ChooseDomain({ onPublish }: { onPublish: () => void }) {
  const { s } = useGen()
  const [mode, setMode] = useState<"free" | "own">("free")
  const [own, setOwn] = useState("")
  const ownOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(own.trim())
  const built = Object.values(s.pages).filter((p) => p === "built").length
  const locked = Object.values(s.pages).filter((p) => p === "locked" || p === "skipped" || p === "failed").length
  return (
    <DialogContent
      title="Publish your site"
      description={`${built} ${built === 1 ? "page" : "pages"} will go live${locked ? `; ${locked} unbuilt ${locked === 1 ? "page stays" : "pages stay"} hidden until they're built` : ""}.`}
      footer={
        <Button size="lg" disabled={mode === "own" && !ownOk} onClick={onPublish} leadingIcon={<Globe />}>
          Publish now
        </Button>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 type-label-md text-fg-primary">Where should it live?</legend>
        <RadioCard name="domain" checked={mode === "free"} onChange={() => setMode("free")} title={s.publish.domain} description="Free address, ready instantly. You can add your own domain later." />
        <RadioCard name="domain" checked={mode === "own"} onChange={() => setMode("own")} title="Use a domain I already own">
          {mode === "own" && (
            <span className="mt-1.5 flex flex-col gap-2">
              <Input value={own} onChange={(e) => setOwn(e.target.value)} placeholder="baktianalisa.my" aria-label="Your domain" leadingIcon={<Link2 />} />
              <span className="type-body-sm text-fg-secondary">
                {own && !ownOk ? "That doesn't look like a domain yet — e.g. baktianalisa.my" : "After publishing we'll show the two DNS records to add at your registrar. It usually connects within an hour."}
              </span>
            </span>
          )}
        </RadioCard>
      </fieldset>
    </DialogContent>
  )
}

const STEPS = ["Uploading pages", "Setting up SSL certificate", "Going live"]

function Publishing({ onDone }: { onDone: (domain: string) => void }) {
  const { s } = useGen()
  const [i, setI] = useState(0)
  const finish = useEffectEvent(() => onDone(s.publish.domain))
  const speed = s.speed
  useEffect(() => {
    const t = window.setTimeout(() => (i + 1 >= STEPS.length ? finish() : setI(i + 1)), 1100 / speed)
    return () => window.clearTimeout(t)
  }, [i, speed])
  return (
    <DialogContent title="Publishing…" description="This takes a few seconds.">
      <ol className="flex flex-col gap-3 pb-6">
        {STEPS.map((st, j) => (
          <li key={st} className="flex items-center gap-3 type-body-md">
            {j < i ? <Check className="size-5 text-status-success-text" /> : j === i ? <Loader className="size-5 animate-spin text-blue-500" /> : <span className="size-5 rounded-full border border-line-strong" />}
            <span className={j <= i ? "text-fg-primary" : "text-fg-tertiary"}>{st}</span>
          </li>
        ))}
      </ol>
    </DialogContent>
  )
}

function Live({ styleId, onClose }: { styleId: string; onClose: () => void }) {
  const { s } = useGen()
  const [copied, setCopied] = useState(false)
  const url = `https://${s.publish.domain}`
  return (
    <DialogContent
      title="Your site is live 🎉"
      description={`Bakti Analisa is now online${s.account ? `, ${s.account.name.split(" ")[0]}` : ""}. Share the link with your team and patients.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Keep editing</Button>
          <Button asChild>
            <a href={`/preview/${styleId}`} target="_blank" rel="noreferrer">
              Open site <ExternalLink />
            </a>
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2 rounded-md border border-line-default bg-canvas p-2 pl-3">
        <Globe className="size-4 shrink-0 text-status-success-text" />
        <span className="min-w-0 flex-1 truncate type-body-md text-fg-primary">{url}</span>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={copied ? <Check /> : <Copy />}
          onClick={() => {
            navigator.clipboard?.writeText(url).catch(() => {})
            setCopied(true)
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="pb-2 type-body-sm text-fg-tertiary">This is a prototype — the address isn&apos;t really registered. “Open site” shows the published pages.</p>
    </DialogContent>
  )
}
