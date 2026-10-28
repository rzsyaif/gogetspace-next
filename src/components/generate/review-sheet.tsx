"use client"

import { useState } from "react"
import { Dialog as D } from "radix-ui"
import { ArrowLeft, RefreshCw, X } from "lucide-react"
import { Alert, Button, Dialog, DialogContent, IconButton, Stepper, overlayClass } from "@/components/ui"
import { cn } from "@/lib/cn"
import { countAssumptions } from "@/lib/generation/brief"
import { flatten, unlockedIds } from "@/lib/bakti/sitemap"
import type { ArtifactKey } from "@/lib/generation/state"
import { useGen } from "./gen-provider"
import { ARTIFACTS, statusLabel } from "./chat-blocks"
import { BriefStep } from "./brief-step"
import { StyleStep } from "./style-step"
import { SitemapStep } from "./sitemap-step"

const COPY: Record<ArtifactKey, { title: string; intro: string }> = {
  brief: { title: "Project Brief", intro: "Click any point to edit it. Highlighted details are my guesses — check them before you confirm." },
  style: { title: "Design & Style", intro: "Choose how your website looks. Each option restyles the same hero, so you can compare the look side by side." },
  sitemap: { title: "Sitemap Plan", intro: "These are the pages I'll build. Rename, add or remove pages — the homepage always stays." },
}

/** Full-height sheet for reviewing the three planning artifacts, with a stepper and per-step confirm. */
export function ReviewSheet() {
  const { s, dispatch } = useGen()
  const step = s.review.step
  const key = ARTIFACTS[step].key
  const status = s.artifacts[key]
  const [checkGuesses, setCheckGuesses] = useState(false)
  const [creditWarn, setCreditWarn] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const guesses = countAssumptions(s.brief)
  // read-only once building — but not while the sheet is closing after "Start Creation"
  const readonly = s.phase === "create" && s.review.open

  const go = (n: number) => dispatch({ type: "reviewStep", step: n })
  const missing = ARTIFACTS.slice(0, 2).filter((a) => s.artifacts[a.key] !== "confirmed")

  const confirm = () => {
    if (key === "brief") {
      if (guesses > 0 && status !== "confirmed") return setCheckGuesses(true)
      if (status === "confirmed") return go(1)
      return dispatch({ type: "confirm", key: "brief" })
    }
    if (key === "style") return status === "confirmed" ? go(2) : dispatch({ type: "confirm", key: "style" })
    const needed = Math.min(unlockedIds(s.sitemap, s.plan).size, flatten(s.sitemap).length) * 3 + 8
    if (s.credits + needed > 100 && s.scenario === "credits-low") return setCreditWarn(true)
    dispatch({ type: "startCreation" })
  }
  const refresh = () => {
    setRefreshing(true)
    window.setTimeout(() => {
      dispatch({ type: "refreshed", key })
      setRefreshing(false)
    }, 1400 / s.speed)
  }

  let action = "Confirm & Next"
  let disabled = false
  let hint: string | null = null
  if (key === "brief" && status === "confirmed") action = "Next"
  if (key === "style") {
    if (status === "confirmed") action = "Next"
    else if (!s.styleId) {
      disabled = true
      hint = "Pick a style first"
    }
  }
  if (key === "sitemap") {
    action = readonly ? "Close" : "Start Creation"
    if (!readonly && missing.length) {
      disabled = true
      hint = `Confirm the ${missing.map((m) => m.title.toLowerCase()).join(" and ")} first`
    }
  }
  if (status === "stale") {
    disabled = true
    hint = "Refresh this step first"
  }

  return (
    <D.Root open={s.review.open} onOpenChange={(o) => !o && dispatch({ type: "closeReview" })}>
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(100svh-44px)] flex-col rounded-t-[32px] bg-surface outline-none data-[state=open]:animate-[bp-sheet-in_320ms_cubic-bezier(0.2,0.9,0.3,1)] data-[state=closed]:animate-[bp-sheet-out_280ms_cubic-bezier(0.6,0,0.8,0.2)] max-[809px]:h-svh max-[809px]:rounded-none min-[810px]:rounded-t-[48px]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <D.Close asChild>
            <IconButton aria-label="Close review" shape="round" tone="onDark" className="absolute -top-[38px] left-1/2 -translate-x-1/2 max-[809px]:hidden [&_svg]:size-5">
              <X />
            </IconButton>
          </D.Close>
          <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-8 min-[1500px]:px-0">
            <header className="flex items-start gap-3 pt-6 pb-5 min-[810px]:pt-8 min-[810px]:pb-6">
              <div className="flex flex-1 flex-col gap-2">
                <D.Title className="type-h3 text-fg-primary">{COPY[key].title}</D.Title>
                <p className="type-body-md text-fg-secondary">{readonly ? "Confirmed and used for the build. Changes here apply when you ask the agent to update the site." : COPY[key].intro}</p>
              </div>
              <D.Close asChild>
                <IconButton aria-label="Close review" size="lg" shape="round" tone="filled" className="min-[810px]:hidden">
                  <X />
                </IconButton>
              </D.Close>
            </header>

            {status === "stale" && (
              <Alert
                tone="warning"
                size="sm"
                className="mb-4"
                actions={
                  <>
                    <Button size="sm" leadingIcon={<RefreshCw className={cn(refreshing && "animate-spin")} />} disabled={refreshing} onClick={refresh}>
                      {refreshing ? "Refreshing…" : "Refresh"}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "confirm", key })}>Keep as is</Button>
                  </>
                }
              >
                <span className="text-fg-primary">You changed the brief after confirming this. Refresh it so it matches, or keep it as it is.</span>
              </Alert>
            )}

            <div className={cn("flex min-h-0 flex-1 flex-col", (refreshing || readonly) && "pointer-events-none", refreshing && "opacity-50")}>
              {key === "brief" && <BriefStep />}
              {key === "style" && <StyleStep />}
              {key === "sitemap" && <SitemapStep />}
            </div>

            <footer className="flex items-center gap-3 border-t border-line-default py-4 min-[810px]:gap-6 min-[810px]:border-0 min-[810px]:py-6">
              <div className="flex min-[1100px]:w-[240px]">
                {step > 0 && (
                  <Button size="lg" variant="secondary" leadingIcon={<ArrowLeft />} onClick={() => go(step - 1)} aria-label="Back" className="max-sm:px-4">
                    <span className="max-sm:sr-only">Back</span>
                  </Button>
                )}
              </div>
              <Stepper
                label="Review steps"
                className="hidden flex-1 min-[810px]:flex"
                onSelect={go}
                steps={ARTIFACTS.map((a, i) => {
                  const st = s.artifacts[a.key]
                  return {
                    title: a.title,
                    caption: statusLabel(st),
                    state: i === step ? "current" : st === "confirmed" ? "done" : st === "stale" ? "warning" : "upcoming",
                    tone: st === "confirmed" ? "success" : st === "stale" ? "warning" : undefined,
                  }
                })}
              />
              <p className="flex-1 text-center type-label-md text-fg-secondary min-[810px]:hidden">
                Step {step + 1} of 3
              </p>
              <div className="flex flex-col items-end gap-1 min-[1100px]:w-[240px]">
                <Button size="lg" disabled={disabled} onClick={readonly && key === "sitemap" ? () => dispatch({ type: "closeReview" }) : readonly ? () => go(step + 1) : confirm}>
                  {readonly && key !== "sitemap" ? "Next" : action}
                </Button>
                {hint && <span className="type-caption text-fg-tertiary">{hint}</span>}
              </div>
            </footer>
          </div>
        </D.Content>
      </D.Portal>

      <Dialog open={checkGuesses} onOpenChange={setCheckGuesses}>
        <DialogContent
          title={`${guesses} ${guesses === 1 ? "detail is" : "details are"} still my guesses`}
          description="Things like your accreditation or opening year will appear on the site exactly as written. You can check them now, or confirm and fix them later."
          footer={
            <>
              <Button variant="secondary" onClick={() => setCheckGuesses(false)}>Check them</Button>
              <Button onClick={() => { setCheckGuesses(false); dispatch({ type: "confirm", key: "brief" }) }}>Confirm anyway</Button>
            </>
          }
        />
      </Dialog>

      <Dialog open={creditWarn} onOpenChange={setCreditWarn}>
        <DialogContent
          title="You may run out of credits"
          description={`You've used ${s.credits}% of this month's credits. Building all the pages in your plan needs about ${Math.min(unlockedIds(s.sitemap, s.plan).size, flatten(s.sitemap).length) * 3 + 8}% — more than you have left.`}
          footer={
            <>
              <Button variant="secondary" onClick={() => { setCreditWarn(false); dispatch({ type: "startCreation", homepageOnly: true }) }}>Build the homepage only</Button>
              <Button onClick={() => { setCreditWarn(false); dispatch({ type: "creditsUpgrade" }); dispatch({ type: "startCreation" }) }}>Top up & build all</Button>
            </>
          }
        />
      </Dialog>
    </D.Root>
  )
}
