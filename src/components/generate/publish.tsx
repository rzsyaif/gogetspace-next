"use client"

import { useEffect, useEffectEvent, useState, type FormEvent } from "react"
import { Check, Copy, ExternalLink, Globe, Link2, Loader } from "lucide-react"
import { Button, Dialog, DialogContent, Field, Input, RadioCard } from "@/components/ui"
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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [touched, setTouched] = useState(false)
  const emailOk = /^\S+@\S+\.\S+$/.test(email)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!name.trim() || !emailOk || pw.length < 8) return
    dispatch({ type: "signUp", name: name.trim(), email })
    onDone()
  }
  return (
    <DialogContent title={title} description="Your site and everything you've confirmed is saved to the account. It takes a few seconds.">
      <Button
        variant="secondary"
        className="w-full"
        leadingIcon={<GoogleMark />}
        onClick={() => {
          dispatch({ type: "signUp", name: "Kiki", email: "kiki@gmail.com" })
          onDone()
        }}
      >
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 type-caption text-fg-tertiary">
        <span className="h-px flex-1 bg-line-default" /> or with email <span className="h-px flex-1 bg-line-default" />
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 pb-4">
        <Field label="Your name" error={touched && !name.trim() ? "Enter your name" : undefined}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email" error={touched && !emailOk ? "Enter a valid email address" : undefined}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password" helper="At least 8 characters" error={touched && pw.length < 8 ? "Use at least 8 characters" : undefined}>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" size="lg" className="w-full">Create account & continue</Button>
        <p className="text-center type-caption text-fg-tertiary">By continuing you agree to the Terms and Privacy Policy.</p>
      </form>
    </DialogContent>
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

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2a11 11 0 0 0 0 9.9L5.7 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7l3.7 2.9C6.6 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  )
}
