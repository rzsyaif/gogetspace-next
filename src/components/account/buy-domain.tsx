"use client"

import { useState, type FormEvent } from "react"
import { ArrowLeft, CircleCheck, CreditCard, Loader, Search, ShieldCheck } from "lucide-react"
import { Badge, Button, Dialog, DialogContent, Field, Input, RadioCard, Select, Stepper } from "@/components/ui"
import { cn } from "@/lib/cn"
import { planInfo } from "@/lib/plans"
import { ACCOUNT, searchDomains } from "@/lib/account/data"
import { accountActions, useAccountState } from "@/lib/account/store"

type Step = "search" | "duration" | "payment" | "done"
const STEPS: { id: Step; label: string }[] = [
  { id: "search", label: "Find a domain" },
  { id: "duration", label: "Duration" },
  { id: "payment", label: "Payment" },
]
const YEARS = [1, 2, 3, 5]
const usd = (n: number) => `$${n.toFixed(2)}`

/**
 * Buy a domain in three steps — search, how long, pay — then (optionally) point it at a website. Bought domains
 * that aren't used yet show up in the editor's Domain tab under "Connect a domain you own".
 */
export function BuyDomainDialog({ open, onOpenChange, siteId }: { open: boolean; onOpenChange: (o: boolean) => void; siteId?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <BuyDomain onClose={() => onOpenChange(false)} siteId={siteId} />}
    </Dialog>
  )
}

function BuyDomain({ onClose, siteId }: { onClose: () => void; siteId?: string }) {
  const { sites, domains } = useAccountState()
  const [step, setStep] = useState<Step>("search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ReturnType<typeof searchDomains> | null>(null)
  const [pick, setPick] = useState<{ name: string; price: number } | null>(null)
  const [years, setYears] = useState(1)
  const usable = sites.filter((s) => planInfo(s.plan).customDomain)
  const [target, setTarget] = useState<string>(siteId && usable.some((s) => s.id === siteId) ? siteId : "later")
  const [card, setCard] = useState<"saved" | "new">("saved")
  const [paying, setPaying] = useState(false)
  const owned = new Set(domains.map((d) => d.name))

  const search = (e: FormEvent) => {
    e.preventDefault()
    setResults(searchDomains(query))
  }
  const total = pick ? pick.price * years : 0
  const pay = () => {
    if (!pick) return
    setPaying(true)
    window.setTimeout(() => {
      accountActions.buyDomain(pick.name, years, pick.price, target === "later" ? null : target)
      setPaying(false)
      setStep("done")
    }, 1100)
  }
  const index = STEPS.findIndex((s) => s.id === step)
  const back = () => setStep(step === "payment" ? "duration" : "search")

  if (step === "done" && pick)
    return (
      <DialogContent title={`${pick.name} is yours`} className="max-w-[560px]" footer={<Button onClick={onClose}>Done</Button>}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CircleCheck className="size-12 text-status-success-text" strokeWidth={1.5} />
          <p className="type-body-md text-fg-secondary">
            Registered for {years} {years === 1 ? "year" : "years"} and charged {usd(total)} to {card === "saved" ? `${ACCOUNT.card.brand} •••• ${ACCOUNT.card.last4}` : "your new card"}.
          </p>
          <p className="type-body-md text-fg-primary">
            {target === "later"
              ? "It isn't connected yet — open a website's Domain tab and choose “Connect a domain you own”."
              : `It now points at ${sites.find((s) => s.id === target)?.name}. Visitors can use it within a few minutes.`}
          </p>
        </div>
      </DialogContent>
    )

  return (
    <DialogContent
      title="Buy a domain"
      description="Search, choose how long, and pay. It connects to your website without any DNS steps."
      className="max-w-[560px]"
      footer={
        step === "search" ? (
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        ) : (
          <>
            <Button variant="secondary" leadingIcon={<ArrowLeft />} onClick={back} disabled={paying}>
              Back
            </Button>
            {step === "duration" ? (
              <Button onClick={() => setStep("payment")}>Continue · {usd(total)}</Button>
            ) : (
              <Button onClick={pay} disabled={paying} leadingIcon={paying ? <Loader className="animate-spin" /> : undefined}>
                {paying ? "Paying…" : `Pay ${usd(total)}`}
              </Button>
            )}
          </>
        )
      }
    >
      <Stepper
        label="Buying a domain"
        className="-mt-2"
        onSelect={(i) => i < index && !paying && setStep(STEPS[i].id)}
        steps={STEPS.map((st, i) => ({
          title: st.label,
          caption: i === 0 ? pick?.name ?? "Search a name" : i === 1 ? (pick && index > 1 ? `${years} ${years === 1 ? "year" : "years"} · ${usd(total)}` : "1–5 years") : "Card on file",
          state: i < index ? "done" : i === index ? "current" : "upcoming",
        }))}
      />

      {step === "search" && (
        <div className="flex flex-col gap-4">
          <form onSubmit={search} className="flex gap-2">
            <div className="flex-1">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="yourpractice.com" aria-label="Domain name" leadingIcon={<Search />} autoFocus />
            </div>
            <Button type="submit" disabled={!query.trim()}>
              Search
            </Button>
          </form>
          {results === null ? (
            <p className="type-body-sm text-fg-tertiary">Try your business name — we&apos;ll check .com, .my, .com.my and more.</p>
          ) : results.length === 0 ? (
            <p className="type-body-sm text-fg-secondary">Use letters, numbers and hyphens only.</p>
          ) : (
            <ul className="flex max-h-[320px] flex-col divide-y divide-line-default overflow-y-auto rounded-md border border-line-default">
              {results.map((r) => {
                const mine = owned.has(r.name)
                return (
                  <li key={r.name} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn("truncate type-label-md", r.available && !mine ? "text-fg-primary" : "text-fg-tertiary")}>{r.name}</span>
                      <span className="type-caption text-fg-tertiary">{mine ? "You already own this" : r.available ? `${usd(r.price)} / year` : "Taken"}</span>
                    </span>
                    {r.available && !mine ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setPick({ name: r.name, price: r.price })
                          setStep("duration")
                        }}
                      >
                        Select
                      </Button>
                    ) : (
                      <Badge dot={false}>{mine ? "Owned" : "Taken"}</Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {step === "duration" && pick && (
        <div className="flex flex-col gap-4">
          <p className="type-body-md text-fg-secondary">
            <strong className="font-semibold text-fg-primary">{pick.name}</strong> · {usd(pick.price)} per year. Renews automatically; you can turn that off anytime.
          </p>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">How long</legend>
            {YEARS.map((y) => (
              <RadioCard
                key={y}
                name="years"
                checked={years === y}
                onChange={() => setYears(y)}
                title={`${y} ${y === 1 ? "year" : "years"}`}
                description={`${usd(pick.price * y)}${y >= 3 ? " · fewer renewals to remember" : ""}`}
              />
            ))}
          </fieldset>
          <Field label="Use it on" helper={usable.length < sites.length ? "Custom domains work on Starter and Business websites." : undefined}>
            <Select value={target} onValueChange={setTarget} options={[{ value: "later", label: "Decide later" }, ...usable.map((s) => ({ value: s.id, label: s.name }))]} />
          </Field>
        </div>
      )}

      {step === "payment" && pick && (
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2 rounded-md bg-subtle p-4 type-body-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-fg-secondary">
                {pick.name} · {years} {years === 1 ? "year" : "years"}
              </dt>
              <dd className="text-fg-primary tabular-nums">{usd(total)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-fg-secondary">
                <ShieldCheck className="size-4" /> Privacy protection
              </dt>
              <dd className="text-fg-primary">Included</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line-default pt-2">
              <dt className="type-label-md text-fg-primary">Total today</dt>
              <dd className="type-label-md text-fg-primary tabular-nums">{usd(total)}</dd>
            </div>
          </dl>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 type-label-md text-fg-primary">Pay with</legend>
            <RadioCard name="card" checked={card === "saved"} onChange={() => setCard("saved")} title={`${ACCOUNT.card.brand} ending in ${ACCOUNT.card.last4}`} description={`Expires ${ACCOUNT.card.expires} · used for your plans`} />
            <RadioCard name="card" checked={card === "new"} onChange={() => setCard("new")} title="A different card">
              {card === "new" && (
                <span className="mt-2 grid grid-cols-2 gap-2">
                  <span className="col-span-2">
                    <Input placeholder="Card number" inputMode="numeric" autoComplete="cc-number" aria-label="Card number" leadingIcon={<CreditCard />} />
                  </span>
                  <Input placeholder="MM / YY" autoComplete="cc-exp" aria-label="Expiry" />
                  <Input placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" aria-label="Security code" />
                </span>
              )}
            </RadioCard>
          </fieldset>
        </div>
      )}
    </DialogContent>
  )
}
