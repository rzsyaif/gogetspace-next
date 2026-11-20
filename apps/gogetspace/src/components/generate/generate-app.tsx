"use client"

import { LAUNCH_KEY } from "@/components/site/launch-overlay"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Button, Logo, SegmentedControl, Toast, TooltipProvider } from "@gogetspace/baseplate"
import { cn } from "@gogetspace/baseplate/cn"
import { useMedia } from "@/lib/use-media"
import { GenProvider, useGen } from "./gen-provider"
import { Messages } from "./chat-blocks"
import { ChatInput } from "./chat-input"
import { EditorNavProvider } from "./editor-nav"
import { AccountButton, FULL_TABS, MobileNav, PreviewPane, ProjectHeader, Rail, SidePanel, type Tab } from "./workspace"
import { FlowSiteProvider, useEditorSite } from "./editor-site"
import { DraftChat, DraftPreview, SitePanel } from "./site-panels"
import { ScenarioPanel } from "./scenario-panel"

const EASE = [0.65, 0, 0.25, 1] as const

/** /generate — the scripted agent turns the homepage prompt into a plan, then a site. */
export function GenerateApp() {
  const q = useSearchParams().get("q")
  return (
    <TooltipProvider>
      <GenProvider prompt={q?.trim() || null}>
        <FlowSiteProvider>
          <Shell />
        </FlowSiteProvider>
      </GenProvider>
    </TooltipProvider>
  )
}

/**
 * The editor from the first second: the chat plans and builds on the left while the preview fills in on the
 * right. (The planning top bar is kept, folded away, for the planning-only states.)
 */
export function Shell({ initialTab = "agent" }: { initialTab?: Tab }) {
  const { s } = useGen()
  const editor = useEditorSite()
  const flow = editor.mode === "flow"
  const wide = useMedia("(min-width: 1024px)")
  const xl = useMedia("(min-width: 1440px)")
  // planning happens in the editor too: the brief, style and pages are no longer reviewed on a separate screen
  const create = true

  const [tab, setTab] = useState<Tab>(initialTab)
  const fullPanel = create && FULL_TABS.includes(tab)
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
  // arriving from the homepage prompt: the launch animation already built the editor frame, so it doesn't play again
  const [launched] = useState(() => {
    try {
      return Date.now() - Number(sessionStorage.getItem(LAUNCH_KEY) ?? 0) < 4000
    } catch {
      return false
    }
  })
  const chatWidth = !create || !wide ? "100%" : chatOpen && !fullPanel ? sidebar : 0

  const goTo = (t: Tab) => {
    setTab(t)
    setChatOpen(true)
    if (!FULL_TABS.includes(t)) setMobileView("chat")
  }

  return (
    <EditorNavProvider goTo={goTo}>
      {/* relative: absolutely positioned bits inside (sr-only labels, menus) stay in the editor instead of
          lengthening the page, which would let the whole editor scroll away */}
      <div data-theme="light" className="relative flex h-svh flex-col overflow-hidden bg-canvas text-fg-primary">
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
            <Button asChild variant="link" size="sm">
              <a href="#" tabIndex={create ? -1 : 0}>Log in</a>
            </Button>
          )}
        </motion.header>

        {/* phone editor bar: logo, chat/preview switch, menu (tabs + account) */}
        {create && !wide && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 border-b border-line-default px-4 py-3">
            <Link href="/dashboard" aria-label="Back to the dashboard"><Logo markOnly size={32} /></Link>
            <SegmentedControl
              as="tablist"
              label="Editor view"
              size="sm"
              fill
              className="flex-1"
              value={fullPanel ? null : mobileView}
              onChange={(v) => {
                setMobileView(v)
                if (fullPanel) setTab("agent")
              }}
              options={[
                { value: "chat", label: "Chat" },
                { value: "preview", label: "Preview" },
              ]}
            />
            <MobileNav
              tab={tab}
              onTab={(t) => {
                setTab(t)
                if (!FULL_TABS.includes(t)) setMobileView("chat")
              }}
            />
          </motion.div>
        )}

        <div className="flex min-h-0 flex-1">
          <AnimatePresence initial={!launched}>
            {create && wide && (
              <motion.div key="rail" initial={{ width: 0, opacity: 0 }} animate={{ width: 84, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.55, ease: EASE }} className="shrink-0 overflow-hidden">
                <Rail tab={tab} onTab={(t) => { setTab(t); setChatOpen(true) }} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.section
            aria-label="Chat with the agent"
            initial={false}
            animate={{ width: chatWidth }}
            transition={{ duration: 0.6, ease: EASE }}
            className={cn("flex min-h-0 shrink-0 flex-col overflow-hidden", create && !wide && (mobileView !== "chat" || fullPanel) && "hidden")}
          >
            <div className={cn("flex min-h-0 flex-1 flex-col", create && wide && "min-w-[340px]")}>
              <AnimatePresence initial={false}>
                {create && (
                  <motion.div key="project" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ delay: 0.3, duration: 0.35 }}>
                    <ProjectHeader onHide={() => setChatOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
              {create && (tab === "domain" || tab === "settings") ? (
                <SidePanel tab={tab} onBack={() => setTab("agent")} onOpenPlan={() => setTab("plan")} />
              ) : editor.site.built || flow ? (
                <ChatColumn compact={create} />
              ) : (
                <DraftChat />
              )}
            </div>
          </motion.section>

          {fullPanel && (
            <section aria-label={tab} className="flex min-h-0 min-w-0 flex-1 flex-col p-1">
              <div className="relative min-h-0 flex-1 overflow-y-auto rounded-xl border border-line-default bg-surface">
                <SitePanel tab={tab} onTab={setTab} />
              </div>
            </section>
          )}

          <AnimatePresence initial={false}>
            {create && !fullPanel && (
              <motion.section
                key="preview"
                aria-label="Preview"
                initial={launched ? false : { opacity: 0, x: 64 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
                className={cn("min-h-0 min-w-0 flex-1 flex-col gap-1 p-1", wide || mobileView === "preview" ? "flex" : "hidden")}
              >
                {editor.site.built || flow ? <PreviewPane chatOpen={chatOpen} onShowChat={() => setChatOpen(true)} onToast={setToast} /> : <DraftPreview />}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {flow && <ScenarioPanel />}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2">
              <Toast tone="success" message={toast} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </EditorNavProvider>
  )
}

function ChatColumn({ compact }: { compact: boolean }) {
  const { s } = useGen()
  const count = s.msgs.length
  const shown = s.searchShown
  const run = s.runs[s.planRun]
  const doneCount = run?.tasks.filter((t) => t.status === "done").length ?? 0
  const pagesBuilt = Object.values(s.pages).filter((p) => p === "built").length
  // the questions and the plan that concludes them are answered on their cards, so the chat input steps aside
  // (after the build they don't hold anything up: the chat stays open for change requests)
  const asking = s.phase === "plan" && s.msgs.some((m) => ((m.type === "pb-question" || m.type === "pb-gate") && !m.answer) || (m.type === "pb-plan" && !m.confirmed))
  const scroller = useRef<HTMLDivElement>(null)
  // follow new messages only while the reader is at the bottom; if they scrolled up to read, leave them there
  const following = useRef(true)
  const lastCount = useRef(count)
  const lastTop = useRef(0)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const newMessage = count !== lastCount.current
    lastCount.current = count
    if (!following.current && !newMessage) return
    // an open question card is read from its top (on phones it's taller than the screen); scroll only the chat
    const card = el.querySelector<HTMLElement>("[data-question-open]")
    const top = card ? card.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 16 : el.scrollHeight
    el.scrollTo({ top, behavior: "smooth" })
  }, [count, shown, doneCount, pagesBuilt, compact])
  // cards that grow in place (an agent working through a checklist) keep the bottom in view while following
  useEffect(() => {
    const el = scroller.current
    const content = el?.firstElementChild
    if (!el || !content || typeof ResizeObserver === "undefined") return
    let last = content.getBoundingClientRect().height
    const ro = new ResizeObserver(() => {
      const h = content.getBoundingClientRect().height
      const grew = h > last + 1
      last = h
      if (grew && following.current && !el.querySelector("[data-question-open]")) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    })
    ro.observe(content)
    return () => ro.disconnect()
  }, [])
  return (
    <>
      <div
        ref={scroller}
        onScroll={(e) => {
          // scrolling up stops following; coming back near the bottom resumes it (our own smooth scrolls only go down,
          // or up to an open question card, which should hold still anyway)
          const el = e.currentTarget
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) following.current = true
          else if (el.scrollTop < lastTop.current - 2) following.current = false
          lastTop.current = el.scrollTop
        }}
        className="relative min-h-0 flex-1 overflow-y-auto"
      >
        <div className={cn("mx-auto w-full", compact ? "px-4 pb-6" : "max-w-[792px] px-4 pt-6 pb-10 sm:pt-12")}>
          {!compact && <h1 className="sr-only">Planning your website</h1>}
          <Messages compact={compact} />
        </div>
      </div>
      <div className={cn("shrink-0", compact ? "p-4 pt-0" : "px-4 pt-2 pb-4 sm:pb-8")}>
        {/* while a question card or the plan is open, answers (including "Something else") go on the card */}
        {!asking && <ChatInput credits={compact} className={cn(!compact && "mx-auto w-full max-w-[760px]")} />}
      </div>
    </>
  )
}
