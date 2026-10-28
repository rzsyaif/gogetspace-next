"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Logo, SegmentedControl, Toast, TooltipProvider } from "@/components/ui"
import { cn } from "@/lib/cn"
import { GenProvider, useGen } from "./gen-provider"
import { Messages } from "./chat-blocks"
import { ChatInput } from "./chat-input"
import { ReviewSheet } from "./review-sheet"
import { AccountButton, MobileNav, PreviewPane, ProjectHeader, Rail, SidePanel, type Tab } from "./workspace"
import { ScenarioPanel } from "./scenario-panel"

const EASE = [0.65, 0, 0.25, 1] as const

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

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/**
 * One layout for both phases, so moving from planning to the editor is a single animation: the review sheet
 * closes, the centred chat shrinks into the left sidebar, the rail and the preview slide in, and the top bar
 * folds away (the editor has no top navbar — the logo lives on the rail).
 */
function Shell() {
  const { s } = useGen()
  const wide = useMedia("(min-width: 1024px)")
  const xl = useMedia("(min-width: 1440px)")
  // let the review sheet finish closing before the layout changes
  const [layout, setLayout] = useState(s.phase)
  useEffect(() => {
    if (layout === s.phase) return
    const t = window.setTimeout(() => setLayout(s.phase), s.phase === "create" ? 380 : 0)
    return () => window.clearTimeout(t)
  }, [s.phase, layout])
  const create = layout === "create"

  const [tab, setTab] = useState<Tab>("agent")
  const [chatOpen, setChatOpen] = useState(true)
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat")
  const [toast, setToast] = useState<string | null>(null)
  // phones: when the build finishes, show the site straight away
  const buildStatus = s.buildRun ? s.runs[s.buildRun]?.status : undefined
  const [seenBuild, setSeenBuild] = useState(buildStatus)
  if (buildStatus !== seenBuild) {
    setSeenBuild(buildStatus)
    if (buildStatus === "done" && !wide) {
      setMobileView("preview")
      setToast("Your site is ready")
    }
  }
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  const sidebar = xl ? 380 : 340
  const chatWidth = !create || !wide ? "100%" : chatOpen ? sidebar : 0

  return (
    <div data-theme="light" className="flex h-svh flex-col overflow-hidden bg-canvas text-fg-primary">
      {/* planning top bar — folds away in the editor */}
      <motion.header
        initial={false}
        animate={{ height: create ? 0 : 72, opacity: create ? 0 : 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="z-30 flex shrink-0 items-center justify-between overflow-hidden px-4 sm:px-6"
        aria-hidden={create}
      >
        <Link href="/" aria-label="GoGetSpace home" tabIndex={create ? -1 : 0} className="rounded-md focus-visible:outline-none focus-visible:focus-ring">
          <Logo markOnly size={36} />
        </Link>
        {s.account ? <AccountButton compact /> : (
          <a href="#" tabIndex={create ? -1 : 0} className="rounded-sm px-2 py-1 type-label-md text-fg-link hover:underline">Log in</a>
        )}
      </motion.header>

      {/* phone editor bar: logo, chat/preview switch, menu (tabs + account) */}
      {create && !wide && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 border-b border-line-default px-4 py-3">
          <Link href="/" aria-label="GoGetSpace home"><Logo markOnly size={32} /></Link>
          <SegmentedControl
            as="tablist"
            label="Editor view"
            size="sm"
            fill
            className="flex-1"
            value={mobileView}
            onChange={setMobileView}
            options={[
              { value: "chat", label: "Chat" },
              { value: "preview", label: "Preview" },
            ]}
          />
          <MobileNav
            tab={tab}
            onTab={(t) => {
              setTab(t)
              setMobileView("chat")
            }}
          />
        </motion.div>
      )}

      <div className="flex min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {create && wide && (
            <motion.div key="rail" initial={{ width: 0, opacity: 0 }} animate={{ width: 106, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.55, ease: EASE }} className="shrink-0 overflow-hidden">
              <Rail tab={tab} onTab={(t) => { setTab(t); setChatOpen(true) }} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section
          aria-label="Chat with the agent"
          initial={false}
          animate={{ width: chatWidth }}
          transition={{ duration: 0.6, ease: EASE }}
          className={cn("flex min-h-0 shrink-0 flex-col overflow-hidden", create && !wide && mobileView !== "chat" && "hidden")}
        >
          <div className={cn("flex min-h-0 flex-1 flex-col", create && wide && "min-w-[340px]")}>
            <AnimatePresence initial={false}>
              {create && (
                <motion.div key="project" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ delay: 0.3, duration: 0.35 }}>
                  <ProjectHeader onHide={() => setChatOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
            {create && tab !== "agent" ? <SidePanel tab={tab} onBack={() => setTab("agent")} /> : <ChatColumn compact={create} />}
          </div>
        </motion.section>

        <AnimatePresence initial={false}>
          {create && (
            <motion.section
              key="preview"
              aria-label="Preview"
              initial={{ opacity: 0, x: 64 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
              className={cn("min-h-0 min-w-0 flex-1 flex-col gap-1 p-1", wide || mobileView === "preview" ? "flex" : "hidden")}
            >
              <PreviewPane chatOpen={chatOpen} onShowChat={() => setChatOpen(true)} onToast={setToast} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <ReviewSheet />
      <ScenarioPanel />
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2">
            <Toast tone="success" message={toast} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChatColumn({ compact }: { compact: boolean }) {
  const { s } = useGen()
  const end = useRef<HTMLDivElement>(null)
  const count = s.msgs.length
  const shown = s.searchShown
  const run = s.runs[s.planRun]
  const doneCount = run?.tasks.filter((t) => t.status === "done").length ?? 0
  const pagesBuilt = Object.values(s.pages).filter((p) => p === "built").length
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [count, shown, doneCount, pagesBuilt, compact])
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={cn("mx-auto w-full", compact ? "px-4 pb-6" : "max-w-[792px] px-4 pt-6 pb-10 sm:pt-12")}>
          {!compact && <h1 className="sr-only">Planning your website</h1>}
          <Messages compact={compact} />
          <div ref={end} />
        </div>
      </div>
      <div className={cn("shrink-0", compact ? "p-4 pt-0" : "px-4 pt-2 pb-4 sm:pb-8")}>
        <ChatInput credits={compact} className={cn(!compact && "mx-auto w-full max-w-[760px]")} />
      </div>
    </>
  )
}
