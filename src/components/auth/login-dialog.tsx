"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "lucide-react"
import { Button, Dialog, DialogContent, Field, Input } from "@/components/ui"

export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7H2a11 11 0 0 0 0 9.9L5.7 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7l3.7 2.9C6.6 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  )
}

/**
 * Log in (or create an account) from the marketing site, then go to the dashboard. Prototype only: any valid
 * email and an 8+ character password work, and Google signs in straight away.
 */
export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <LoginForm />}
    </Dialog>
  )
}

function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [pw, setPw] = useState("")
  const [touched, setTouched] = useState(false)
  const [going, setGoing] = useState<"google" | "email" | null>(null)
  const emailOk = /^\S+@\S+\.\S+$/.test(email)
  const signup = mode === "signup"

  const go = (how: "google" | "email") => {
    setGoing(how)
    router.prefetch("/dashboard")
    window.setTimeout(() => router.push("/dashboard"), 700)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if ((signup && !name.trim()) || !emailOk || pw.length < 8) return
    go("email")
  }

  return (
    <DialogContent
      title={signup ? "Create your account" : "Welcome back"}
      description={signup ? "Build and publish websites for your business. It takes a few seconds." : "Log in to see your websites, enquiries and plans."}
    >
      <Button variant="secondary" className="w-full" leadingIcon={going === "google" ? <Loader className="animate-spin" /> : <GoogleMark />} disabled={going !== null} onClick={() => go("google")}>
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 type-caption text-fg-tertiary">
        <span className="h-px flex-1 bg-line-default" /> or with email <span className="h-px flex-1 bg-line-default" />
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 pb-4">
        {signup && (
          <Field label="Your name" error={touched && !name.trim() ? "Enter your name" : undefined}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
        )}
        <Field label="Email" error={touched && !emailOk ? "Enter a valid email address" : undefined}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
        </Field>
        <Field
          label="Password"
          helper={signup ? "At least 8 characters" : undefined}
          error={touched && pw.length < 8 ? (signup ? "Use at least 8 characters" : "Enter your password (8+ characters)") : undefined}
        >
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} />
        </Field>
        {!signup && (
          <button type="button" className="-mt-2 self-end type-label-sm text-fg-link hover:underline">
            Forgot password?
          </button>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={going !== null} leadingIcon={going === "email" ? <Loader className="animate-spin" /> : undefined}>
          {going === "email" ? "Opening your dashboard…" : signup ? "Create account" : "Log in"}
        </Button>
        <p className="text-center type-body-sm text-fg-secondary">
          {signup ? "Already have an account?" : "New to GoGetSpace?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(signup ? "login" : "signup")
              setTouched(false)
            }}
            className="type-label-md text-fg-link hover:underline"
          >
            {signup ? "Log in" : "Create an account"}
          </button>
        </p>
      </form>
    </DialogContent>
  )
}
