"use client"

import { createContext, useContext, useEffect, useEffectEvent, useReducer, type Dispatch, type ReactNode } from "react"
import { BUILD_STEP_MS, PAGE_MS, PLAN_STEP_MS, SEARCH_RESULTS, initialState, reducer, type Action, type GenState } from "@/lib/generation/state"
import { flatten } from "@/lib/bakti/sitemap"

const KEY = "gogetspace-generation"
const Ctx = createContext<{ s: GenState; dispatch: Dispatch<Action> } | null>(null)

export function useGen() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useGen outside GenProvider")
  return c
}

/**
 * Holds the generation flow, plays the scripted agent (timers scaled by speed) and keeps the session in
 * sessionStorage, so a refresh resumes where it was. A new prompt from the homepage starts fresh.
 */
export function GenProvider({
  prompt,
  storageKey = KEY,
  initial,
  children,
}: {
  prompt: string | null
  /** sessionStorage key — the standalone editor keeps one per site */
  storageKey?: string
  /** starting state when nothing is saved (the flow starts planning from the prompt) */
  initial?: () => GenState
  children: ReactNode
}) {
  // only rendered in the browser (useSearchParams bails out of prerendering), so storage is available here
  const [s, dispatch] = useReducer(reducer, null, () => restore(prompt, storageKey, initial))

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(s))
    } catch {}
  }, [s, storageKey])

  usePlanRunner(s, dispatch)
  useBuildRunner(s, dispatch)
  useAutoReview(s, dispatch)

  return <Ctx.Provider value={{ s, dispatch }}>{children}</Ctx.Provider>
}

/** resume the saved session unless a different prompt arrived */
function restore(prompt: string | null, key: string, initial?: () => GenState): GenState {
  let saved: GenState | null = null
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(key) : null
    if (raw) saved = JSON.parse(raw) as GenState
  } catch {}
  if (saved?.v === 2 && (!prompt || prompt === saved.prompt)) return saved
  return initial ? initial() : initialState(prompt ?? undefined)
}

/** once the plan is ready, open the brief review by itself (closing it leaves the filled chat) */
function useAutoReview(s: GenState, dispatch: Dispatch<Action>) {
  const due = s.phase === "plan" && s.runs[s.planRun]?.status === "done" && s.autoReviewed !== s.planRun && !s.review.open
  const speed = s.speed
  useEffect(() => {
    if (!due) return
    const t = window.setTimeout(() => dispatch({ type: "autoReview" }), 900 / speed)
    return () => window.clearTimeout(t)
  }, [due, speed, dispatch])
}

function usePlanRunner(s: GenState, dispatch: Dispatch<Action>) {
  const run = s.runs[s.planRun]
  const i = run ? run.tasks.findIndex((t) => t.status === "running") : -1
  const task = i >= 0 ? run.tasks[i] : null
  const key = run?.status === "running" && task ? `${run.id}:${task.id}` : null
  const snapshot = useEffectEvent(() => s)

  useEffect(() => {
    if (!key) return
    const st = snapshot()
    const id = key.split(":")[1]
    const k = 1 / st.speed
    const timers: number[] = []
    const slow = st.scenario === "slow" && id === "brief"
    timers.push(window.setTimeout(() => dispatch({ type: "planStepDone" }), (slow ? 9000 : PLAN_STEP_MS[id]) * k))
    if (slow) timers.push(window.setTimeout(() => dispatch({ type: "taskNote", note: "Still working — this one is taking longer than usual." }), 3500 * k))
    if (id === "search" && st.scenario !== "no-results" && st.scenario !== "search-fail") {
      for (let n = st.searchShown; n < SEARCH_RESULTS.length; n++) timers.push(window.setTimeout(() => dispatch({ type: "revealResult" }), (700 + n * 800) * k))
    }
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [key, dispatch])
}

function useBuildRunner(s: GenState, dispatch: Dispatch<Action>) {
  const run = s.buildRun ? s.runs[s.buildRun] : null
  const task = run?.tasks.find((t) => t.status === "running")
  const building = flatten(s.sitemap).find((p) => s.pages[p.id] === "building")?.id
  let key: string | null = null
  if (run) {
    if (run.status === "running" && task) key = task.id === "pages" ? (building ? `page:${building}` : null) : `step:${task.id}`
    else if (run.status === "done" && building) key = `page:${building}`
  }
  const speed = s.speed

  useEffect(() => {
    if (!key) return
    const [kind, id] = key.split(":")
    const t = window.setTimeout(() => dispatch(kind === "page" ? { type: "pageDone" } : { type: "buildStepDone" }), (kind === "page" ? PAGE_MS : BUILD_STEP_MS[id]) / speed)
    return () => window.clearTimeout(t)
  }, [key, speed, dispatch])
}
