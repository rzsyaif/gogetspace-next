/**
 * State of the scripted generation flow (plan → review → create → publish).
 * Pure reducer; timing lives in the provider's runner. Edge cases are driven by `scenario`.
 */
import { DEFAULT_BRIEF, DEFAULT_QUESTIONS, countAssumptions, type BriefSection, type OpenQuestion } from "./brief"
import { SITEMAP, flatten, unlockedIds, type PageNode, type Plan } from "@/lib/bakti/sitemap"

export type Scenario =
  | "happy"
  | "vague"
  | "no-results"
  | "ambiguous"
  | "search-fail"
  | "step-fail"
  | "slow"
  | "restricted"
  | "credits-low"
  | "credits-out"
  | "page-fail"

export const SCENARIOS: { id: Scenario; label: string; note: string }[] = [
  { id: "happy", label: "Happy path", note: "Everything works" },
  { id: "vague", label: "Vague prompt", note: "Asks a question before planning" },
  { id: "no-results", label: "Nothing found online", note: "New business, brief from description only" },
  { id: "ambiguous", label: "Several matches", note: "“Is this you?” before continuing" },
  { id: "search-fail", label: "Search unavailable", note: "Continues without the web" },
  { id: "step-fail", label: "Step fails", note: "Writing the brief fails once, with Retry" },
  { id: "slow", label: "Slow step", note: "“Taking longer than usual” note" },
  { id: "restricted", label: "Can't help with this", note: "Request is declined politely" },
  { id: "credits-low", label: "Credits low", note: "Warned before Start Creation" },
  { id: "credits-out", label: "Credits run out", note: "Build pauses midway" },
  { id: "page-fail", label: "A page fails", note: "One page fails to build, with Retry" },
]

export type TaskStatus = "pending" | "running" | "done" | "failed" | "warning"
export interface Task {
  id: string
  label: string
  /** what the agent says it did, shown under the label once done */
  detail?: string
  status: TaskStatus
  /** shown next to finished tasks */
  duration?: string
  /** extra line while running (e.g. "taking longer") */
  note?: string
}
export type RunStatus = "running" | "stopped" | "waiting" | "failed" | "blocked" | "done" | "restarted" | "paused"
export interface Run {
  id: number
  kind: "plan" | "build"
  status: RunStatus
  tasks: Task[]
}

export type Msg =
  | { id: string; type: "user"; text: string }
  | { id: string; type: "agent"; text: string }
  | { id: string; type: "plan"; runId: number }
  | { id: string; type: "artifacts" }
  | { id: string; type: "clarify"; answer?: string }
  | { id: string; type: "pick"; picked?: string }
  | { id: string; type: "refused" }
  | { id: string; type: "build"; runId: number }
  | { id: string; type: "credits-out"; resolved?: "upgrade" | "stop" }

export type ArtifactStatus = "awaiting" | "confirmed" | "stale"
export type ArtifactKey = "brief" | "style" | "sitemap"
export type PageStatus = "queued" | "building" | "built" | "failed" | "locked" | "skipped"

export interface GenState {
  v: 2
  prompt: string
  scenario: Scenario
  speed: number
  phase: "plan" | "create"
  msgs: Msg[]
  runs: Record<number, Run>
  planRun: number
  buildRun: number | null
  searchShown: number
  failedOnce: boolean
  artifacts: Record<ArtifactKey, ArtifactStatus>
  brief: BriefSection[]
  questions: OpenQuestion[]
  styleSet: "a" | "b"
  styleId: string | null
  hasCustom: boolean
  sitemap: PageNode
  plan: Plan
  review: { open: boolean; step: number }
  credits: number
  pages: Record<string, PageStatus>
  queued: string[]
  account: { name: string; email: string } | null
  publish: { status: "idle" | "live"; domain: string }
  /** plan run whose brief review has already been opened automatically */
  autoReviewed?: number
  seq: number
}

/* ---------- task scripts ---------- */

export const SEARCH_QUERY = "Bakti Analisa clinical laboratory Penang"
export const SEARCH_RESULTS = [
  { title: "Bakti Analisa — Klinik & Makmal, Jalan Burmah", site: "www.google.com/maps" },
  { title: "Medical laboratories in George Town, Penang", site: "www.penang-traveltips.com" },
  { title: "MS ISO 15189 accredited laboratories list", site: "www.jsm.gov.my" },
]
export const BUSINESS_MATCHES = [
  { id: "penang", name: "Bakti Analisa", place: "Jalan Burmah, George Town, Penang", kind: "Clinical laboratory" },
  { id: "kedah", name: "Bakti Analisa Diagnostik", place: "Sungai Petani, Kedah", kind: "Medical lab & X-ray" },
  { id: "kl", name: "Analisa Bakti Consulting", place: "Petaling Jaya, Selangor", kind: "Data consultancy" },
]

const planTasks = (): Task[] => [
  { id: "read", label: "Reading & analyzing the prompt", status: "running" },
  { id: "search", label: "Searching the web", status: "pending" },
  { id: "brief", label: "Write the brief", status: "pending" },
  { id: "style", label: "Sketch the style guideline", status: "pending" },
  { id: "sitemap", label: "Create the sitemap", status: "pending" },
]
const buildTasks = (): Task[] => [
  { id: "read-plan", label: "Reading the confirmed plan", status: "running" },
  { id: "setup", label: "Setting up pages and navigation", status: "pending" },
  { id: "copy", label: "Writing the copy", status: "pending" },
  { id: "pages", label: "Building pages", status: "pending" },
  { id: "checks", label: "Checking links and mobile layout", status: "pending" },
]

/** fake "how long it took" labels so finished tasks read like real work */
const DURATIONS: Record<string, string> = {
  read: "18s", search: "41s", brief: "1m 12s", style: "52s", sitemap: "34s",
  "read-plan": "12s", setup: "28s", copy: "1m 46s", pages: "3m 20s", checks: "38s",
}

export const PLAN_STEP_MS: Record<string, number> = { read: 1800, search: 3200, brief: 3000, style: 2600, sitemap: 2200 }
export const BUILD_STEP_MS: Record<string, number> = { "read-plan": 1400, setup: 1800, copy: 2400, checks: 1600 }
export const PAGE_MS = 1100

export function detectScenario(prompt: string): Scenario {
  if (/casino|gambl|betting|vape|replica/i.test(prompt)) return "restricted"
  if (prompt.trim().split(/\s+/).filter(Boolean).length < 4) return "vague"
  return "happy"
}

export const DEFAULT_PROMPT = "Website for clinical laboratory in penang named BAKTI ANALISA"

export function initialState(prompt = DEFAULT_PROMPT, scenario: Scenario = detectScenario(prompt), speed = 1): GenState {
  return {
    v: 2,
    prompt,
    scenario,
    speed,
    phase: "plan",
    msgs: [
      { id: "m1", type: "user", text: prompt },
      { id: "m2", type: "plan", runId: 1 },
    ],
    runs: { 1: { id: 1, kind: "plan", status: "running", tasks: planTasks() } },
    planRun: 1,
    buildRun: null,
    searchShown: 0,
    failedOnce: false,
    artifacts: { brief: "awaiting", style: "awaiting", sitemap: "awaiting" },
    brief: structuredClone(DEFAULT_BRIEF),
    questions: structuredClone(DEFAULT_QUESTIONS),
    styleSet: "a",
    styleId: null,
    hasCustom: false,
    sitemap: structuredClone(SITEMAP),
    plan: "free",
    review: { open: false, step: 0 },
    credits: scenario === "credits-out" ? 86 : scenario === "credits-low" ? 82 : 40,
    pages: {},
    queued: [],
    account: null,
    publish: { status: "idle", domain: "bakti-analisa.get.space" },
    seq: 10,
  }
}

/* ---------- actions ---------- */

export type Action =
  | { type: "reset"; prompt?: string; scenario?: Scenario }
  | { type: "load"; state: GenState }
  | { type: "speed"; speed: number }
  | { type: "planStepDone" }
  | { type: "revealResult" }
  | { type: "taskNote"; note: string }
  | { type: "retryStep" }
  | { type: "stop" }
  | { type: "resume" }
  | { type: "followUp"; text: string }
  | { type: "answerClarify"; answer: string }
  | { type: "pickBusiness"; id: string }
  | { type: "openReview"; step: number }
  | { type: "autoReview" }
  | { type: "closeReview" }
  | { type: "reviewStep"; step: number }
  | { type: "editBrief"; brief: BriefSection[] }
  | { type: "answerQuestion"; id: string; answer: string }
  | { type: "confirm"; key: ArtifactKey }
  | { type: "refreshed"; key: ArtifactKey }
  | { type: "pickStyle"; id: string }
  | { type: "styleSet"; set: "a" | "b" }
  | { type: "addCustomStyle" }
  | { type: "sitemap"; sitemap: PageNode }
  | { type: "plan"; plan: Plan }
  | { type: "startCreation"; homepageOnly?: boolean }
  | { type: "buildStepDone" }
  | { type: "pageDone" }
  | { type: "retryPage"; id: string }
  | { type: "creditsUpgrade" }
  | { type: "upgradePlan" }
  | { type: "creditsStop" }
  | { type: "signUp"; name: string; email: string }
  | { type: "signOut" }
  | { type: "agentNote"; text: string }
  | { type: "published"; domain: string }
  | { type: "jump"; to: JumpTarget; scenario?: Scenario }

export type JumpTarget = "generating" | "ready" | "review-brief" | "review-style" | "review-sitemap" | "creating" | "built" | "published"

const nextId = (s: GenState) => `m${s.seq + 1}`
type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, "id"> : never) : never
function push(s: GenState, ...msgs: NewMsg[]): GenState {
  let seq = s.seq
  const added = msgs.map((m) => ({ ...m, id: `m${++seq}` }) as Msg)
  return { ...s, msgs: [...s.msgs, ...added], seq }
}
function updateRun(s: GenState, id: number, fn: (r: Run) => Run): GenState {
  return { ...s, runs: { ...s.runs, [id]: fn(s.runs[id]) } }
}
const current = (r: Run) => r.tasks.findIndex((t) => t.status === "running" || t.status === "pending" || t.status === "failed")

function advance(r: Run, i: number, patch: Partial<Task>): Run {
  const tasks = r.tasks.map((t, j) => (j === i ? { ...t, duration: DURATIONS[t.id], note: undefined, status: "done" as TaskStatus, ...patch } : j === i + 1 ? { ...t, status: "running" as TaskStatus } : t))
  return { ...r, tasks, status: i + 1 >= tasks.length ? "done" : r.status }
}

function finishPlan(s: GenState): GenState {
  return push(s, { type: "artifacts" })
}

function startBuild(s: GenState, homepageOnly = false): GenState {
  const id = Math.max(...Object.keys(s.runs).map(Number)) + 1
  const unlocked = homepageOnly ? new Set(["home"]) : unlockedIds(s.sitemap, s.plan)
  const pages: Record<string, PageStatus> = {}
  for (const p of flatten(s.sitemap)) pages[p.id] = unlocked.has(p.id) ? "queued" : "locked"
  let next: GenState = {
    ...s,
    phase: "create",
    review: { open: false, step: 2 },
    buildRun: id,
    pages,
    runs: { ...s.runs, [id]: { id, kind: "build", status: "running", tasks: buildTasks() } },
  }
  next = push(next, { type: "user", text: "All three are confirmed — go ahead and build it." }, { type: "agent", text: "Solid plan. Creating your website now." }, { type: "build", runId: id })
  return next
}

function allConfirmed(s: GenState) {
  return s.artifacts.brief === "confirmed" && s.artifacts.style === "confirmed" && s.artifacts.sitemap === "confirmed"
}

export function reducer(s: GenState, a: Action): GenState {
  switch (a.type) {
    case "reset":
      return initialState(a.prompt ?? s.prompt, a.scenario ?? (a.prompt ? detectScenario(a.prompt) : s.scenario), s.speed)
    case "load":
      return a.state
    case "speed":
      return { ...s, speed: a.speed }

    /* ----- plan run ----- */
    case "revealResult":
      return { ...s, searchShown: s.searchShown + 1 }
    case "taskNote": {
      const runId = s.phase === "plan" ? s.planRun : s.buildRun!
      return updateRun(s, runId, (r) => ({ ...r, tasks: r.tasks.map((t) => (t.status === "running" ? { ...t, note: a.note } : t)) }))
    }
    case "planStepDone": {
      const r = s.runs[s.planRun]
      const i = current(r)
      if (i < 0 || r.status !== "running") return s
      const t = r.tasks[i]
      if (t.id === "read") {
        if (s.scenario === "restricted") {
          const n = updateRun(s, r.id, (r) => ({ ...r, status: "blocked", tasks: r.tasks.map((x, j) => (j === i ? { ...x, status: "done", duration: "6s" } : x)) }))
          return push(n, { type: "refused" })
        }
        if (s.scenario === "vague" && !s.msgs.some((m) => m.type === "clarify")) {
          const n = updateRun(s, r.id, (r) => ({ ...r, status: "waiting", tasks: r.tasks.map((x, j) => (j === i ? { ...x, status: "done", duration: "9s" } : j === i + 1 ? { ...x, status: "pending" } : x)) }))
          return push(n, { type: "clarify" })
        }
      }
      if (t.id === "search") {
        if (s.scenario === "ambiguous" && !s.msgs.some((m) => m.type === "pick")) {
          const n = updateRun(s, r.id, (r) => ({ ...r, status: "waiting", tasks: r.tasks.map((x, j) => (j === i ? { ...x, status: "done", duration: DURATIONS.search, detail: "Found 3 businesses with a similar name" } : x)) }))
          return push(n, { type: "pick" })
        }
        if (s.scenario === "no-results") return updateRun(s, r.id, (r) => advance(r, i, { detail: "Nothing found online — I'll work from your description" }))
        if (s.scenario === "search-fail") return updateRun(s, r.id, (r) => advance(r, i, { status: "warning", detail: "Search isn't available right now — I'll work from your description", duration: undefined }))
      }
      if (t.id === "brief" && s.scenario === "step-fail" && !s.failedOnce) {
        const n = updateRun(s, r.id, (r) => ({ ...r, status: "failed", tasks: r.tasks.map((x, j) => (j === i ? { ...x, status: "failed", note: undefined, detail: "Something went wrong while writing the brief." } : x)) }))
        return { ...n, failedOnce: true }
      }
      const detail: Record<string, string | undefined> = {
        brief: `Drafted a profile from assumptions, flagging ${countAssumptions(s.brief)} details to confirm`,
        style: "Sketched 4 style options, including colors, fonts, and vibe",
        sitemap: `Planned ${flatten(s.sitemap).length} pages, including the structure`,
      }
      let n = updateRun(s, r.id, (r) => advance(r, i, { detail: detail[t.id] ?? t.detail }))
      if (n.runs[r.id].status === "done") n = finishPlan(n)
      return n
    }
    case "retryStep": {
      const runId = s.phase === "plan" ? s.planRun : s.buildRun!
      return updateRun(s, runId, (r) => ({ ...r, status: "running", tasks: r.tasks.map((t) => (t.status === "failed" ? { ...t, status: "running", detail: undefined } : t)) }))
    }
    case "stop":
      return updateRun(s, s.planRun, (r) => (r.status === "running" ? { ...r, status: "stopped" } : r))
    case "resume":
      return updateRun(s, s.planRun, (r) => (r.status === "stopped" ? { ...r, status: "running" } : r))
    case "answerClarify": {
      const n = push(
        { ...s, msgs: s.msgs.map((m) => (m.type === "clarify" ? { ...m, answer: a.answer } : m)) },
        { type: "user", text: a.answer },
      )
      return updateRun(n, s.planRun, (r) => ({ ...r, status: "running", tasks: r.tasks.map((t) => (t.id === "search" ? { ...t, status: "running" } : t)) }))
    }
    case "pickBusiness": {
      const pick = BUSINESS_MATCHES.find((b) => b.id === a.id)
      let n: GenState = { ...s, msgs: s.msgs.map((m) => (m.type === "pick" ? { ...m, picked: a.id } : m)) }
      n = push(n, { type: "user", text: pick ? `It's ${pick.name} in ${pick.place.split(", ").slice(-1)[0]}.` : "None of these — it's a new business." })
      return updateRun(n, s.planRun, (r) => ({ ...r, status: "running", tasks: r.tasks.map((t) => (t.id === "brief" ? { ...t, status: "running" } : t)) }))
    }
    case "followUp": {
      const text = a.text.trim()
      if (!text) return s
      if (s.phase === "create") {
        const build = s.buildRun ? s.runs[s.buildRun] : null
        if (build && build.status !== "done") {
          return push({ ...s, queued: [...s.queued, text] }, { type: "user", text }, { type: "agent", text: "Got it — I'll do this as soon as the build finishes." })
        }
        return push(s, { type: "user", text }, { type: "agent", text: `Done — I've applied “${text}” to the site. Check the preview.` })
      }
      // during planning a follow-up restarts the plan with the new information
      const id = Math.max(...Object.keys(s.runs).map(Number)) + 1
      const brief = s.brief.map((sec) =>
        sec.id === "features" ? { ...sec, items: [...sec.items, { id: `note${id}`, text: `From your note: ${text}` }] } : sec,
      )
      let n: GenState = {
        ...s,
        brief,
        planRun: id,
        searchShown: 0,
        artifacts: { brief: "awaiting", style: "awaiting", sitemap: "awaiting" },
        review: { open: false, step: 0 },
        msgs: s.msgs.filter((m) => m.type !== "artifacts"),
        runs: {
          ...s.runs,
          [s.planRun]: { ...s.runs[s.planRun], status: s.runs[s.planRun].status === "done" ? "done" : "restarted" },
          [id]: { id, kind: "plan", status: "running", tasks: planTasks() },
        },
      }
      // planning edge cases have been seen once already; build-time ones (credits, page failure) stay
      if (["vague", "no-results", "ambiguous", "search-fail", "step-fail", "slow"].includes(n.scenario)) n.scenario = "happy"
      if (n.scenario === "restricted" && detectScenario(text) !== "restricted") n.scenario = "happy"
      n = push(n, { type: "user", text }, { type: "agent", text: "Got it — I'll restart the plan with that in mind." }, { type: "plan", runId: id })
      return n
    }

    /* ----- review ----- */
    case "openReview":
      return { ...s, autoReviewed: s.planRun, review: { open: true, step: a.step } }
    case "autoReview":
      return { ...s, autoReviewed: s.planRun, review: { open: true, step: 0 } }
    case "closeReview":
      return { ...s, review: { ...s.review, open: false } }
    case "reviewStep":
      return { ...s, review: { ...s.review, step: a.step } }
    case "editBrief": {
      const artifacts = { ...s.artifacts }
      if (artifacts.brief === "confirmed") artifacts.brief = "awaiting"
      if (artifacts.style === "confirmed") artifacts.style = "stale"
      if (artifacts.sitemap === "confirmed") artifacts.sitemap = "stale"
      return { ...s, brief: a.brief, artifacts }
    }
    case "answerQuestion":
      return { ...s, questions: s.questions.map((q) => (q.id === a.id ? { ...q, answer: a.answer } : q)) }
    case "confirm": {
      const order: ArtifactKey[] = ["brief", "style", "sitemap"]
      const step = Math.min(2, order.indexOf(a.key) + 1)
      return { ...s, artifacts: { ...s.artifacts, [a.key]: "confirmed" }, review: { ...s.review, step: a.key === "sitemap" ? 2 : step } }
    }
    case "refreshed":
      return { ...s, artifacts: { ...s.artifacts, [a.key]: "awaiting" } }
    case "pickStyle": {
      const artifacts = { ...s.artifacts }
      if (artifacts.style === "confirmed") artifacts.style = "awaiting"
      return { ...s, styleId: a.id, artifacts }
    }
    case "styleSet":
      return { ...s, styleSet: a.set }
    case "addCustomStyle":
      return { ...s, hasCustom: true, styleId: "custom", artifacts: { ...s.artifacts, style: s.artifacts.style === "confirmed" ? "awaiting" : s.artifacts.style } }
    case "sitemap": {
      const artifacts = { ...s.artifacts }
      if (artifacts.sitemap === "confirmed") artifacts.sitemap = "awaiting"
      return { ...s, sitemap: a.sitemap, artifacts }
    }
    case "plan":
      return { ...s, plan: a.plan }
    case "startCreation": {
      const n: GenState = { ...s, artifacts: { ...s.artifacts, sitemap: "confirmed" } }
      if (!allConfirmed(n)) return s
      return startBuild(n, a.homepageOnly)
    }

    /* ----- build run ----- */
    case "buildStepDone": {
      if (!s.buildRun) return s
      const r = s.runs[s.buildRun]
      const i = current(r)
      if (i < 0 || r.status !== "running") return s
      let n = updateRun(s, r.id, (r) => advance(r, i, {}))
      n = { ...n, credits: Math.min(100, n.credits + 2) }
      if (r.tasks[i + 1]?.id === "pages") n = startNextPage(n)
      if (n.runs[r.id].status === "done") n = finishBuild(n)
      return n
    }
    case "pageDone": {
      if (!s.buildRun) return s
      const r = s.runs[s.buildRun]
      const order = flatten(s.sitemap).map((p) => p.id)
      const building = order.find((id) => s.pages[id] === "building")
      // a retried or newly unlocked page after the build has finished
      if (r.status === "done") return building ? startNextPage({ ...s, pages: { ...s.pages, [building]: "built" }, credits: Math.min(99, s.credits + 3) }) : s
      if (r.status !== "running") return s
      const pages = { ...s.pages }
      let credits = s.credits
      if (building) {
        pages[building] = s.scenario === "page-fail" && building === "corporate" && !s.failedOnce ? "failed" : "built"
        credits = Math.min(100, credits + 3)
      }
      let n: GenState = { ...s, pages, credits, failedOnce: s.failedOnce || (s.scenario === "page-fail" && building === "corporate") }
      if (credits >= 100 && order.some((id) => pages[id] === "queued")) {
        n = updateRun(n, r.id, (r) => ({ ...r, status: "paused" }))
        return push(n, { type: "credits-out" })
      }
      const next = order.find((id) => pages[id] === "queued")
      if (next) n.pages = { ...pages, [next]: "building" }
      else {
        const i = current(r)
        const failed = order.filter((id) => pages[id] === "failed").length
        n = updateRun(n, r.id, (r) => advance(r, i, failed ? { status: "warning", detail: `${failed} page didn't build — retry it from the page list` } : { detail: `Built ${order.filter((id) => pages[id] === "built").length} pages` }))
      }
      return n
    }
    case "retryPage":
      return { ...s, pages: { ...s.pages, [a.id]: "building" } }
    case "creditsUpgrade": {
      const pages = Object.fromEntries(Object.entries(s.pages).map(([k, v]) => [k, v === "skipped" ? "queued" : v])) as Record<string, PageStatus>
      const n: GenState = { ...s, pages, credits: 30, msgs: s.msgs.map((m) => (m.type === "credits-out" && !m.resolved ? { ...m, resolved: "upgrade" } : m)) }
      if (!s.buildRun) return n
      if (s.runs[s.buildRun].status === "done") return startNextPage(n)
      return startNextPage(updateRun(n, s.buildRun, (r) => ({ ...r, status: "running" })))
    }
    case "upgradePlan": {
      const pages = Object.fromEntries(Object.entries(s.pages).map(([k, v]) => [k, v === "locked" ? "queued" : v])) as Record<string, PageStatus>
      let n: GenState = { ...s, plan: "business", pages }
      if (s.buildRun && s.runs[s.buildRun].status === "done" && !Object.values(pages).includes("building")) n = startNextPage(n)
      return push(n, { type: "agent", text: "Upgraded to Business — building the remaining pages now." })
    }
    case "creditsStop": {
      const pages = Object.fromEntries(Object.entries(s.pages).map(([k, v]) => [k, v === "queued" ? "skipped" : v])) as Record<string, PageStatus>
      let n: GenState = { ...s, pages, msgs: s.msgs.map((m) => (m.type === "credits-out" && !m.resolved ? { ...m, resolved: "stop" } : m)) }
      if (s.buildRun) {
        n = updateRun(n, s.buildRun, (r) => {
          const i = current(r)
          const tasks = r.tasks.map((t, j) => (j === i ? { ...t, status: "warning" as TaskStatus, detail: "Stopped when credits ran out" } : j > i ? { ...t, status: "done" as TaskStatus, duration: DURATIONS[t.id] } : t))
          return { ...r, status: "done", tasks }
        })
        n = finishBuild(n)
      }
      return n
    }
    case "signUp":
      return { ...s, account: { name: a.name, email: a.email } }
    case "signOut":
      return { ...s, account: null }
    case "agentNote":
      return push(s, { type: "agent", text: a.text })
    case "published":
      return { ...s, publish: { status: "live", domain: a.domain } }

    case "jump":
      return jump(a.scenario ? { ...s, scenario: a.scenario } : s, a.to)
  }
}

function startNextPage(s: GenState): GenState {
  const next = flatten(s.sitemap).find((p) => s.pages[p.id] === "queued")
  return next ? { ...s, pages: { ...s.pages, [next.id]: "building" } } : s
}

function finishBuild(s: GenState): GenState {
  const built = Object.values(s.pages).filter((p) => p === "built").length
  const locked = Object.values(s.pages).filter((p) => p === "locked").length
  let text = `Your site is ready — ${built} ${built === 1 ? "page" : "pages"} built.`
  if (locked) text += ` ${locked} more ${locked === 1 ? "page is" : "pages are"} planned and will be built when you upgrade.`
  text += " Have a look around the preview, then publish when you're happy."
  let n = push(s, { type: "agent", text })
  for (const q of s.queued) n = push(n, { type: "agent", text: `Done — I've applied your note: “${q}”.` })
  return { ...n, queued: [] }
}

/** jump straight to a stage of the flow (scenario switcher) */
function jump(s: GenState, to: JumpTarget): GenState {
  let n = initialState(s.prompt, s.scenario === "restricted" || s.scenario === "vague" ? "happy" : s.scenario, s.speed)
  if (to === "generating") return n
  // finish the plan run
  n = updateRun(n, 1, (r) => ({ ...r, status: "done", tasks: r.tasks.map((t) => ({ ...t, status: "done", duration: DURATIONS[t.id], detail: t.id === "brief" ? `Drafted a profile from assumptions, flagging ${countAssumptions(n.brief)} details to confirm` : t.id === "style" ? "Sketched 4 style options, including colors, fonts, and vibe" : t.id === "sitemap" ? `Planned ${flatten(n.sitemap).length} pages, including the structure` : undefined })) }))
  n = { ...n, searchShown: SEARCH_RESULTS.length, autoReviewed: n.planRun }
  n = finishPlan(n)
  if (to === "ready") return n
  if (to === "review-brief") return { ...n, review: { open: true, step: 0 } }
  n = { ...n, artifacts: { ...n.artifacts, brief: "confirmed" } }
  if (to === "review-style") return { ...n, review: { open: true, step: 1 } }
  n = { ...n, styleId: n.styleId ?? "clinical-clarity", artifacts: { ...n.artifacts, style: "confirmed" } }
  if (to === "review-sitemap") return { ...n, review: { open: true, step: 2 } }
  n = startBuild({ ...n, artifacts: { ...n.artifacts, sitemap: "confirmed" }, plan: "business" })
  if (to === "creating") return n
  // finish the build
  const pages = Object.fromEntries(Object.entries(n.pages).map(([k, v]) => [k, v === "queued" ? "built" : v])) as Record<string, PageStatus>
  n = { ...n, pages, credits: Math.min(99, n.credits + 38) }
  n = updateRun(n, n.buildRun!, (r) => ({ ...r, status: "done", tasks: r.tasks.map((t) => ({ ...t, status: "done", duration: DURATIONS[t.id], detail: t.id === "pages" ? `Built ${Object.values(pages).filter((p) => p === "built").length} pages` : undefined })) }))
  n = finishBuild(n)
  if (to === "built") return n
  return { ...n, account: { name: "Kiki", email: "kiki@example.com" }, publish: { status: "live", domain: "bakti-analisa.get.space" } }
}

export const isPlanActive = (s: GenState) => s.runs[s.planRun]?.status === "running"
export { nextId }
