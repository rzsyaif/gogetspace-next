"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Logo, TooltipProvider } from "@/components/ui"
import { cn } from "@/lib/cn"
import { GenProvider, useGen } from "./gen-provider"
import { Messages } from "./chat-blocks"
import { ChatInput } from "./chat-input"
import { ReviewSheet } from "./review-sheet"
import { Workspace } from "./workspace"
import { ScenarioPanel } from "./scenario-panel"

/** /generate — the scripted agent turns the homepage prompt into a plan, then a site. */
export function GenerateApp() {
  const q = useSearchParams().get("q")
  return (
    <TooltipProvider>
      <GenProvider prompt={q?.trim() || null}>
        <Shell />
      </GenProvider>
    </TooltipProvider>
  )
}

function Shell() {
  const { s } = useGen()
  return (
    <div data-theme="light" className={cn("flex flex-col bg-canvas text-fg-primary", s.phase === "create" ? "h-svh overflow-hidden" : "min-h-svh")}>
      <header className={cn("z-30 flex h-[72px] shrink-0 items-center justify-between px-4 sm:px-6", s.phase === "plan" && "sticky top-0 bg-canvas/85 backdrop-blur-md")}>
        <Link href="/" aria-label="GoGetSpace home" className="rounded-md focus-visible:outline-none focus-visible:focus-ring">
          <Logo markOnly size={36} />
        </Link>
        {s.account ? (
          <span className="flex items-center gap-2 type-label-md text-fg-primary">
            <span className="grid size-8 place-items-center rounded-full bg-blue-500 type-label-sm text-white">{s.account.name[0]}</span>
            <span className="hidden sm:inline">{s.account.name}</span>
          </span>
        ) : (
          <a href="#" className="rounded-sm px-2 py-1 type-label-md text-fg-link hover:underline">Log in</a>
        )}
      </header>
      {s.phase === "plan" ? <PlanView /> : <Workspace />}
      <ReviewSheet />
      <ScenarioPanel />
    </div>
  )
}

function PlanView() {
  const { s } = useGen()
  const end = useRef<HTMLDivElement>(null)
  const count = s.msgs.length
  const shown = s.searchShown
  const run = s.runs[s.planRun]
  const doneCount = run?.tasks.filter((t) => t.status === "done").length ?? 0
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [count, shown, doneCount])
  return (
    <>
      <main className="mx-auto flex w-full max-w-[792px] flex-1 flex-col px-4 pt-6 pb-60 sm:pt-12">
        <h1 className="sr-only">Planning your website</h1>
        <Messages />
        <div ref={end} />
      </main>
      <div className="sticky bottom-0 z-20 bg-linear-to-t from-canvas from-70% to-transparent px-4 pt-8 pb-4 sm:pb-8">
        <ChatInput className="mx-auto w-full max-w-[792px]" />
      </div>
    </>
  )
}
