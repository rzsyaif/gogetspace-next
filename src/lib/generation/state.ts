/**
 * State of the scripted generation flow (plan → review → create → publish).
 * Pure reducer; timing lives in the provider's runner. Edge cases are driven by `scenario`.
 */
import { DEFAULT_BRIEF, DEFAULT_QUESTIONS, countAssumptions, type BriefSection, type OpenQuestion } from "./brief"
import { SITEMAP, flatten, unlockedIds, type PageNode, type Plan } from "@/lib/bakti/sitemap"
import { DENTIST } from "@/lib/playbooks/dentist"
import {
  analyze,
  checkGuardrails,
  decide,
  detect,
  goalLabel,
  initialPlaybookState,
  moduleById,
  newGoals,
  nextQuestion,
  offerFor,
  optionLabel,
  presetOf,
  withDefaults,
  type Decision,
  type PlaybookState,
} from "@/lib/playbooks/engine"
import { RAHMA, clinicName, dentistBrief, dentistPriority, dentistQuestions, dentistSitemap, domainFor, isDemoClinic } from "@/lib/playbooks/dentist-plan"
import type { NicheId, Slot } from "@/lib/playbooks/types"

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
  /** "How did it turn out?" card after the first build; `answer` once sent or skipped */
  | { id: string; type: "feedback"; answer?: FeedbackAnswer | "skipped" }
  /* ----- playbook conversation (dentist) ----- */
  /** a gate before planning: a directory instead of one practice, or two businesses in one prompt */
  | { id: string; type: "pb-gate"; kind: "directory" | "two-sites" | "directory-retry"; answer?: string }
  /** one of the playbook's questions (Q1 goals, Q2 focus, Q3 scale, Q4 the goal's follow-up) */
  | {
      id: string
      type: "pb-question"
      qid: string
      slot: Slot
      variant?: string
      answer?: string
      /** why the agent chose, when the owner let it decide or skipped */
      note?: string
      /** the plan as it was before this answer, so Back can undo it */
      prev?: PlaybookState
      /** a written answer that didn't match any option */
      unclear?: string
      /** the option(s) picked, kept when Back reopens the question */
      value?: string | string[]
    }
  /** a guardrail: declines a claim or field, offers the compliant alternative */
  | { id: string; type: "pb-guard"; rule: string; quote: string; resolved?: "accepted" | "declined" }
  /** the plan card: assumptions with Edit, the module offer and the running total */
  | { id: string; type: "pb-plan"; confirmed?: boolean }
  /** new goals after the plan: offers only their modules and patches the plan */
  | { id: string; type: "pb-patch"; goals: string[]; resolved?: "added" | "declined" }
  /** after the build: modules waiting for the owner's accounts (test mode) */
  | { id: string; type: "pb-activate" }

export interface FeedbackAnswer {
  rating: "good" | "fine" | "bad"
  tags: string[]
  comment: string
  research: boolean
  email: string | null
}

export type ArtifactStatus = "awaiting" | "confirmed" | "stale"
export type ArtifactKey = "brief" | "style" | "sitemap"
export type PageStatus = "queued" | "building" | "built" | "failed" | "locked" | "skipped"

export interface GenState {
  v: 3
  prompt: string
  /** the niche playbook this site is planned with (null: the general flow) */
  niche: NicheId | null
  pb: PlaybookState | null
  /** which pages each plan builds first (the playbook's order; general flow uses its own) */
  pagePriority?: string[]
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

/** what the web search looks for and finds, by niche (the dentist demo clinic is Rahma Family Dental) */
export function searchOf(s: Pick<GenState, "niche" | "pb">): { query: string; results: { title: string; site: string }[]; none?: string } {
  if (!s.pb) return { query: SEARCH_QUERY, results: SEARCH_RESULTS }
  const pb = s.pb
  if (!pb.business) return { query: `dental clinic ${pb.place ?? ""}`.trim(), results: [], none: "No clinic name yet — I'll use placeholders you can change in the brief" }
  const query = `${pb.business} ${pb.place ?? "dental clinic"}`
  if (!isDemoClinic(pb)) return { query, results: [], none: `Nothing found online for ${pb.business} — I'll work from your description` }
  return {
    query,
    results: [
      { title: `${RAHMA.name} — ${RAHMA.rating.replace(" from", " ·")}`, site: "www.google.com/maps" },
      { title: `${RAHMA.name} · ${RAHMA.dentists.join(" & ")}`, site: "www.facebook.com" },
      { title: `${RAHMA.dentists[0]} — dental practitioner register`, site: "mdc.moh.gov.my" },
    ],
  }
}

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

export function initialState(prompt = DEFAULT_PROMPT, scenario?: Scenario, speed = 1): GenState {
  const niche = detect(prompt).niche
  const pb = niche ? initialPlaybookState(prompt) : null
  // a short dental prompt isn't vague — the playbook asks its own goal question
  const sc = scenario ?? (niche && detectScenario(prompt) === "vague" ? "happy" : detectScenario(prompt))
  const brief = pb ? dentistBrief(withDefaults(pb)) : structuredClone(DEFAULT_BRIEF)
  return {
    v: 3,
    prompt,
    niche,
    pb,
    pagePriority: pb ? dentistPriority(withDefaults(pb)) : undefined,
    scenario: sc,
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
    brief,
    questions: pb ? dentistQuestions(pb) : structuredClone(DEFAULT_QUESTIONS),
    styleSet: "a",
    styleId: null,
    hasCustom: false,
    sitemap: pb ? dentistSitemap(withDefaults(pb)) : structuredClone(SITEMAP),
    plan: "free",
    review: { open: false, step: 0 },
    credits: sc === "credits-out" ? 86 : sc === "credits-low" ? 82 : 40,
    pages: {},
    queued: [],
    account: null,
    publish: { status: "idle", domain: pb ? domainFor(pb) : "bakti-analisa.get.space" },
    seq: 10,
  }
}

/** the business the site is for, as the builder names it */
export const siteName = (s: Pick<GenState, "pb">) => (s.pb ? clinicName(s.pb) : "Bakti Analisa")

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
  | { type: "feedback"; id: string; answer: FeedbackAnswer | "skipped" }
  | { type: "jump"; to: JumpTarget; scenario?: Scenario; plan?: Plan }
  /* playbook conversation */
  | { type: "pbAnswer"; id: string; value: string | string[]; text?: string }
  | { type: "pbBack"; id: string }
  | { type: "pbAnswerText"; id: string; text: string }
  | { type: "pbSkipAll" }
  | { type: "pbGate"; id: string; answer: string }
  | { type: "pbGuard"; id: string; resolution: "accepted" | "declined" }
  | { type: "pbEdit"; slot: Slot | "style"; value: string | string[] }
  | { type: "pbDecide"; module: string; decision: Decision }
  | { type: "pbConsent"; module: string }
  | { type: "pbConfirmPlan" }
  | { type: "pbPatch"; id: string; decisions: Record<string, Decision> | null }
  | { type: "pbActivate"; module: string }

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
  const unlocked = homepageOnly ? new Set(["home"]) : unlockedIds(s.sitemap, s.plan, s.pagePriority)
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
      return initialState(a.prompt ?? s.prompt, a.scenario ?? (a.prompt ? undefined : s.scenario), s.speed)
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
      if (s.pb && s.scenario !== "restricted" && (t.id === "read" || t.id === "search")) return t.id === "read" ? pbRead(s, i) : pbSearched(s, i)
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
      if (s.pb) {
        const handled = pbFollowUp(s, text)
        if (handled) return handled
      }
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
        pages[building] = s.scenario === "page-fail" && building === failingPage(s) && !s.failedOnce ? "failed" : "built"
        credits = Math.min(100, credits + 3)
      }
      let n: GenState = { ...s, pages, credits, failedOnce: s.failedOnce || (s.scenario === "page-fail" && building === failingPage(s)) }
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
    case "feedback":
      return { ...s, msgs: s.msgs.map((m) => (m.id === a.id && m.type === "feedback" ? { ...m, answer: a.answer } : m)) }

    case "jump":
      return jump(a.scenario ? { ...s, scenario: a.scenario } : s, a.to, a.plan)

    /* ----- playbook conversation ----- */
    case "pbAnswer":
      return pbAnswer(s, a.id, a.value, a.text)
    case "pbGate":
      return pbGate(s, a.id, a.answer)
    case "pbGuard":
      return pbGuard(s, a.id, a.resolution)
    case "pbEdit":
      return pbEdit(s, a.slot, a.value)
    case "pbDecide":
      return s.pb ? { ...s, pb: { ...s.pb, decisions: decide(s.pb.decisions, a.module, a.decision, s.pb.goals) } } : s
    case "pbConsent":
      return s.pb ? { ...s, pb: { ...s.pb, consent: [...new Set([...s.pb.consent, a.module])], decisions: decide(s.pb.decisions, a.module, "added", s.pb.goals) } } : s
    case "pbConfirmPlan":
      return pbConfirmPlan(s)
    case "pbBack":
      return pbBack(s, a.id)
    case "pbAnswerText": {
      const m = s.msgs.find((x) => x.id === a.id)
      if (!m || m.type !== "pb-question" || m.answer) return s
      const v = parseAnswer(m, a.text)
      if (v === null) return { ...s, msgs: s.msgs.map((x) => (x.id === a.id ? { ...x, unclear: a.text } : x)) }
      const n = pbAnswer(s, a.id, v)
      return { ...n, msgs: n.msgs.map((x) => (x.id === a.id && x.type === "pb-question" ? { ...x, answer: `${x.answer} — “${a.text}”`, unclear: undefined } : x)) }
    }
    case "pbSkipAll":
      return pbSkipAll(s)
    case "pbPatch":
      return pbPatch(s, a.id, a.decisions)
    case "pbActivate":
      if (!s.pb || s.pb.activated.includes(a.module)) return s
      return push({ ...s, pb: { ...s.pb, activated: [...s.pb.activated, a.module] } }, { type: "agent", text: `Connected — ${moduleById(a.module).name} is out of test mode and live.` })
  }
}

/* ---------- playbook conversation (dentist) ---------- */

const DECIDE_REASON: Record<string, string> = {
  focus: "it covers most clinics",
  scale: "it's the simplest setup — adding dentists later is easy",
  prices: "most clinics show from-prices for routine care and invite a consultation for bigger treatments",
  emergency: "patients calling you first is the safest default",
  insurance: "you can list insurers later if you take them",
}

const isPending = (m: Msg) => (m.type === "pb-question" || m.type === "pb-gate") && !m.answer
const searchDone = (s: GenState) => {
  const t = s.runs[s.planRun]?.tasks.find((x) => x.id === "search")
  return t?.status === "done" || t?.status === "warning"
}
const quoteOf = (re: RegExp, text: string) => text.match(re)?.[0] ?? ""
const joinAnd = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`)
const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)

/** asks the next playbook question, or shows the plan card when there's nothing left to ask */
function askNext(s: GenState): GenState {
  const pb = s.pb!
  if (pb.planConfirmed) return s
  const q = nextQuestion(pb)
  if (q) return push({ ...s, pb: { ...pb, asked: [...pb.asked, q.id] } }, { type: "pb-question", qid: q.id, slot: q.slot, variant: q.variant })
  return maybePlanCard(s)
}

/** the plan card waits for the search (it fills answers) and for any open question */
function maybePlanCard(s: GenState): GenState {
  if (!s.pb || s.pb.planConfirmed || s.msgs.some(isPending) || !searchDone(s) || s.msgs.some((m) => m.type === "pb-plan")) return s
  const raw = s.pb
  const pb = withDefaults(raw)
  const name = clinicName(pb)
  let text: string
  if (raw.justBuild) text = "Sure. I'll assume your main goal is getting more patients to book online, and I'll use sensible defaults for a general dental clinic. Every assumption is listed so you can change it."
  else if (raw.goalsSource === "prompt" && !raw.asked.includes("Q1"))
    text = `Got it. I read your goals as ${joinAnd(pb.goals.map((g) => lower(goalLabel(g))))}. Here's what I'll build for ${name}, and why — change anything that's off, then pick the tools you want.`
  else text = `Here's my plan for ${name}${pb.found ? ", including what I found online" : ""}. Anything marked “My default” is a guess — change it with Edit. Then pick the tools you want; nothing paid is added unless you tap Add.`
  return push({ ...s, pb }, { type: "agent", text }, { type: "pb-plan" })
}

function resumeSearch(s: GenState): GenState {
  return updateRun(s, s.planRun, (r) => ({ ...r, status: "running", tasks: r.tasks.map((t) => (t.id === "search" && t.status === "pending" ? { ...t, status: "running" } : t)) }))
}

/** the agent opens the conversation once it has read the prompt */
function opening(s: GenState): GenState {
  const pb = s.pb!
  const next = nextQuestion(pb)
  if (!next) return s
  if (pb.candidates?.kind === "several") return push(s, { type: "agent", text: "You've asked for a lot — let's start with the one that matters most right now. I'll set that up first and keep the rest under Add later." })
  if (pb.candidates?.kind === "vague") return s
  if (next.id === "Q1") return push(s, { type: "agent", text: "I'll build a website for a single dental clinic. Before I choose the tools you need, a few quick questions — I'll look you up online meanwhile." })
  if (pb.goals.length) return push(s, { type: "agent", text: `Got it — I read your goal${pb.goals.length > 1 ? "s" : ""} as ${joinAnd(pb.goals.map((g) => lower(goalLabel(g))))}. A few quick questions while I look you up.` })
  return s
}

function pbRead(s: GenState, i: number): GenState {
  const pb = s.pb!
  const d = detect(s.prompt)
  let n = updateRun(s, s.planRun, (r) => advance(r, i, { detail: `Looks like a ${DENTIST.unit} — I'll plan it with the Dentist playbook` }))
  for (const g of checkGuardrails(s.prompt)) n = push(n, { type: "pb-guard", rule: g.id, quote: quoteOf(g.match, s.prompt) })
  if (pb.unsupported.length)
    n = push(n, { type: "agent", text: `${pb.unsupported.join(", ")} isn't something I can set up yet. I can link to your existing shop instead — and I'll carry on with the rest.` })
  if (d.otherNiche || d.directory) {
    n = updateRun(n, s.planRun, (r) => ({ ...r, status: "waiting", tasks: r.tasks.map((t) => (t.id === "search" ? { ...t, status: "pending" } : t)) }))
    return push(n, { type: "pb-gate", kind: d.otherNiche ? "two-sites" : "directory" })
  }
  return askNext(opening(n))
}

function pbSearched(s: GenState, i: number): GenState {
  let pb = s.pb!
  const so = searchOf(s)
  const failed = s.scenario === "search-fail"
  let detail = failed ? "Search isn't available right now — I'll work from your description" : so.none
  if (!failed && !so.none) {
    detail = `Found ${RAHMA.name}: ${RAHMA.rating}, ${RAHMA.dentists.length} dentists`
    pb = { ...pb, found: { rating: RAHMA.rating, dentists: RAHMA.dentists.length, branches: 1, hours: RAHMA.hours } }
    if (!pb.answers.scale) pb = { ...pb, answers: { ...pb.answers, scale: { value: "dentists", source: "search" } } }
    if (!pb.place) pb = { ...pb, place: RAHMA.place }
  }
  let n: GenState = updateRun({ ...s, pb }, s.planRun, (r) => advance(r, i, failed ? { status: "warning", detail, duration: undefined } : { detail }))
  if (!pb.planConfirmed) n = updateRun(n, s.planRun, (r) => ({ ...r, status: "waiting", tasks: r.tasks.map((t) => (t.id === "brief" ? { ...t, status: "pending" } : t)) }))
  return maybePlanCard(n)
}

function markAnswered(s: GenState, id: string, answer: string): GenState {
  return { ...s, msgs: s.msgs.map((m) => (m.id === id && (m.type === "pb-question" || m.type === "pb-gate") ? { ...m, answer } : m)) }
}

function pbAnswer(s: GenState, id: string, value: string | string[], typed?: string): GenState {
  const m = s.msgs.find((x) => x.id === id)
  if (!s.pb || !m || m.type !== "pb-question" || m.answer) return s
  let pb = s.pb
  let label: string
  let reply: string | null = null
  if (m.slot === "goals") {
    if (value === "decide") {
      pb = { ...pb, goals: [DENTIST.defaultGoal, DENTIST.defaultSecondary], goalsSource: "default" }
      label = `${goalLabel(DENTIST.defaultGoal)} (main) · ${goalLabel(DENTIST.defaultSecondary)}`
      reply = "I chose getting more patients booking online, with being found and trusted as a second goal — that's where most clinics start."
    } else {
      const goals = (Array.isArray(value) ? value : [value]).slice(0, 3)
      const several = pb.candidates?.kind === "several"
      pb = { ...pb, goals, goalsSource: "owner" }
      label = goals.length === 1 ? goalLabel(goals[0]) : `${goalLabel(goals[0])} (main) · ${goals.slice(1).map((g) => goalLabel(g)).join(" · ")}`
      if (several) reply = "I'll set this up first and keep the rest under Add later."
    }
    pb = { ...pb, candidates: null }
  } else {
    const slot = m.slot as Exclude<Slot, "goals">
    if (value === "decide") {
      const v = DENTIST.defaults[slot as keyof typeof DENTIST.defaults] ?? "one"
      pb = { ...pb, answers: { ...pb.answers, [slot]: { value: v, source: "default" } } }
      label = optionLabel(slot, v)
      reply = `I chose this because ${DECIDE_REASON[slot] ?? "it's the usual choice"}.`
    } else {
      const v = String(value)
      pb = { ...pb, answers: { ...pb.answers, [slot]: { value: v, source: "owner" } } }
      label = optionLabel(slot, v)
    }
  }
  let n: GenState = { ...s, pb, msgs: s.msgs.map((x) => (x.id === id && x.type === "pb-question" ? { ...x, answer: label, note: reply ?? undefined, prev: s.pb!, value } : x)) }
  // answered in the chat box: show it as a message; answered on the card: the card moves on to the next question
  if (typed) n = push(n, { type: "user", text: typed })
  return askNext(n)
}

/** Back on the question card: reopens the previous question and undoes its answer (and whatever followed it) */
function pbBack(s: GenState, id: string): GenState {
  const i = s.msgs.findIndex((x) => x.id === id)
  if (i < 0) return s
  let j = -1
  for (let k = i - 1; k >= 0; k--) {
    const m = s.msgs[k]
    if (m.type === "pb-question") {
      j = k
      break
    }
    if (m.type !== "user" && m.type !== "agent" && m.type !== "pb-guard") break
  }
  const prevQ = s.msgs[j]
  if (j < 0 || prevQ.type !== "pb-question" || !prevQ.prev) return s
  const msgs = [...s.msgs.slice(0, j), { ...prevQ, answer: undefined, note: undefined, prev: undefined }, ...s.msgs.slice(j + 1).filter((m) => m.type === "pb-guard")]
  // what the web search found meanwhile stays
  const cur = s.pb!
  const keepScale = cur.answers.scale?.source === "search" && !prevQ.prev.answers.scale ? { scale: cur.answers.scale } : {}
  const pb = { ...prevQ.prev, found: cur.found, place: prevQ.prev.place ?? cur.place, answers: { ...prevQ.prev.answers, ...keepScale } }
  return { ...s, pb, msgs }
}

/** "Skip these questions": the agent decides everything still open, with its usual defaults */
function pbSkipAll(s: GenState): GenState {
  let n = s
  for (let k = 0; k < 6; k++) {
    const open = n.msgs.find((m): m is Extract<Msg, { type: "pb-question" }> => m.type === "pb-question" && !m.answer)
    if (!open) break
    n = pbAnswer(n, open.id, open.slot === "goals" ? (n.pb!.candidates?.goals.slice(0, 1) ?? "decide") : "decide")
  }
  return n
}

function pbGate(s: GenState, id: string, answer: string): GenState {
  const m = s.msgs.find((x) => x.id === id)
  if (!s.pb || !m || m.type !== "pb-gate" || m.answer) return s
  const LABEL: Record<string, string> = {
    one: "One practice",
    directory: "A directory",
    two: "Two separate websites — start with the dental clinic",
    only: "Just the dental clinic",
  }
  let n = push(markAnswered(s, id, LABEL[answer] ?? answer), { type: "user", text: LABEL[answer] ?? answer })
  if (answer === "directory") {
    n = push(n, { type: "agent", text: "A directory needs listings and search for many practices — GoGetSpace doesn't build those yet. If you run one of the practices, I can build its website instead." }, { type: "pb-gate", kind: "directory-retry" })
    return n
  }
  if (answer === "two") n = push(n, { type: "agent", text: "I'll build the dental clinic first and keep the two separate — start the other website from your dashboard afterwards." })
  n = { ...n, pb: { ...n.pb!, answers: { ...n.pb!.answers, build: { value: "one", source: "owner" } } } }
  n = resumeSearch(n)
  return askNext(opening(n))
}

function pbGuard(s: GenState, id: string, resolution: "accepted" | "declined"): GenState {
  const m = s.msgs.find((x) => x.id === id)
  if (!s.pb || !m || m.type !== "pb-guard" || m.resolved) return s
  const rule = DENTIST.guardrails.find((g) => g.id === m.rule)!
  let pb = s.pb
  let n: GenState = { ...s, msgs: s.msgs.map((x) => (x.id === id && x.type === "pb-guard" ? { ...x, resolved: resolution } : x)) }
  if (resolution === "accepted") {
    pb = { ...pb, notes: [...new Set([...pb.notes, rule.note])] }
    if (rule.id === "before-after") pb = { ...pb, consent: [...new Set([...pb.consent, "gallery"])], decisions: decide(pb.decisions, "gallery", "added", pb.goals) }
    if (rule.id === "discount") pb = { ...pb, notes: pb.notes }
    n = { ...n, pb }
    if (pb.planConfirmed) n = { ...n, brief: dentistBrief(pb), artifacts: { ...n.artifacts, brief: n.artifacts.brief === "confirmed" ? "awaiting" : n.artifacts.brief } }
    return push(n, { type: "agent", text: rule.id === "before-after" ? "Thanks — the before-and-after gallery is on, with a “results vary” note on every pair." : "Done — I'll use that wording." })
  }
  return push({ ...n, pb }, { type: "agent", text: "OK — I'll leave it out." })
}

function pbEdit(s: GenState, slot: Slot | "style", value: string | string[]): GenState {
  if (!s.pb) return s
  let pb = s.pb
  if (slot === "style") pb = { ...pb, style: String(value) }
  else if (slot === "goals") {
    const goals = (Array.isArray(value) ? value : [value]).slice(0, 3)
    const keep = new Set(offerFor(goals).flatMap((g) => g.modules.map((m) => m.id)))
    const decisions = Object.fromEntries(Object.entries(pb.decisions).filter(([k]) => keep.has(k)))
    pb = { ...pb, goals, goalsSource: "owner", decisions }
  } else pb = { ...pb, answers: { ...pb.answers, [slot]: { value: String(value), source: "owner" } } }
  return { ...s, pb }
}

function pbConfirmPlan(s: GenState): GenState {
  if (!s.pb || s.pb.planConfirmed) return s
  const pb = withDefaults({ ...s.pb, planConfirmed: true })
  const kept = Object.entries(pb.decisions)
    .filter(([, d]) => d === "added")
    .map(([id]) => moduleById(id).name)
  const total = Object.entries(pb.decisions).reduce((sum, [id, d]) => sum + (d === "added" ? moduleById(id).price : 0), 0)
  let n: GenState = {
    ...s,
    pb,
    brief: dentistBrief(pb),
    questions: dentistQuestions(pb),
    sitemap: dentistSitemap(pb),
    pagePriority: dentistPriority(pb),
    // the plan card's style preset is preselected in the style step
    styleId: s.styleId ?? presetOf(pb),
    msgs: s.msgs.map((m) => (m.type === "pb-plan" ? { ...m, confirmed: true } : m)),
  }
  n = push(
    n,
    { type: "user", text: "Looks right — create the plan." },
    {
      type: "agent",
      text: kept.length
        ? `Writing the brief, style and page plan with ${joinAnd(kept)}. ${total ? `The add-ons come to $${total}/month, charged from when you publish.` : "Everything you added is free."}`
        : "No problem — I'll plan the free parts now, and the rest will wait under Add later.",
    },
  )
  return updateRun(n, n.planRun, (r) => (r.status === "waiting" ? { ...r, status: "running", tasks: r.tasks.map((t) => (t.id === "brief" && t.status === "pending" ? { ...t, status: "running" } : t)) } : r))
}

/** reads a typed answer to the open question, or null if it doesn't match an option */
function parseAnswer(m: Extract<Msg, { type: "pb-question" }>, text: string): string | string[] | null {
  if (/\b(you decide|not sure|whatever|up to you|anything)\b/i.test(text)) return "decide"
  const a = analyze(text)
  if (m.slot === "goals") return a.goals.length ? a.goals.slice(0, 3) : a.vagueGoal ? [DENTIST.defaultGoal, DENTIST.defaultSecondary] : null
  const slot = m.slot as Exclude<Slot, "goals">
  if (a.answers[slot]) return a.answers[slot]!.value
  const q = DENTIST.questions.find((x) => x.slot === m.slot)
  const hit = q?.options.find((o) => new RegExp(`\\b${o.label.split(" ")[0]}`, "i").test(text))
  return hit?.id ?? null
}

/** typed messages during the playbook conversation: answers, guardrails, new goals and notes */
function pbFollowUp(s: GenState, text: string): GenState | null {
  let pb = s.pb!
  const hits = checkGuardrails(text)
  if (hits.length) {
    let n = push(s, { type: "user", text })
    for (const g of hits) n = push(n, { type: "pb-guard", rule: g.id, quote: quoteOf(g.match, text) })
    return n
  }
  const open = s.msgs.find(isPending)
  if (open?.type === "pb-question") {
    const v = parseAnswer(open, text)
    if (v !== null) return pbAnswer(s, open.id, v, text)
    const q = DENTIST.questions.find((x) => x.slot === open.slot && (!open.variant || x.variant === open.variant))
    const opts = open.slot === "goals" ? [goalLabel("G1"), goalLabel("G6")] : (q?.options ?? []).slice(0, 2).map((o) => o.label)
    return push(s, { type: "user", text }, { type: "agent", text: `I'm not sure I understood. Do you mean “${opts[0]}” or “${opts[1]}”? You can also tap one of the options.` })
  }
  if (open?.type === "pb-gate") {
    const ans = /director|platform|many/i.test(text) ? "directory" : /two|both|separate/i.test(text) ? "two" : "one"
    return pbGate(s, open.id, open.kind === "two-sites" ? (ans === "two" ? "two" : "only") : ans)
  }
  const goals = newGoals(text, pb)
  if (!pb.planConfirmed) {
    if (!s.msgs.some((m) => m.type === "pb-plan")) return null
    if (goals.length) {
      pb = { ...pb, goals: [...pb.goals, ...goals].slice(0, 4), goalsSource: "owner" }
      return push({ ...s, pb }, { type: "user", text }, { type: "agent", text: `Added ${joinAnd(goals.map((g) => lower(goalLabel(g))))} to your goals — the plan below is updated.` })
    }
    pb = { ...pb, notes: [...pb.notes, `From your note: ${text}`] }
    return push({ ...s, pb }, { type: "user", text }, { type: "agent", text: "Noted — that goes into the brief." })
  }
  if (goals.length) return push(s, { type: "user", text }, { type: "pb-patch", goals })
  if (s.phase === "plan") {
    pb = { ...pb, notes: [...pb.notes, `From your note: ${text}`] }
    const n: GenState = { ...s, pb, brief: dentistBrief(pb), artifacts: { ...s.artifacts, brief: s.artifacts.brief === "confirmed" ? "awaiting" : s.artifacts.brief } }
    return push(n, { type: "user", text }, { type: "agent", text: "Added to the brief — nothing else changes." })
  }
  return null
}

/** new goals after the plan: adds only their modules and patches the plan (and the site, if it's built) */
function pbPatch(s: GenState, id: string, decisions: Record<string, Decision> | null): GenState {
  const m = s.msgs.find((x) => x.id === id)
  if (!s.pb || !m || m.type !== "pb-patch" || m.resolved) return s
  if (!decisions || !Object.values(decisions).includes("added")) {
    const n: GenState = { ...s, msgs: s.msgs.map((x) => (x.id === id && x.type === "pb-patch" ? { ...x, resolved: "declined" as const } : x)) }
    return push(n, { type: "agent", text: "No problem — nothing changes. You can add these later from the Modules tab." })
  }
  let pb: PlaybookState = { ...s.pb, goals: [...new Set([...s.pb.goals, ...m.goals])] }
  for (const [mod, d] of Object.entries(decisions)) pb = { ...pb, decisions: decide(pb.decisions, mod, d, pb.goals) }
  const fresh = dentistSitemap(pb)
  const have = new Set(flatten(s.sitemap).map((p) => p.id))
  const extra = (fresh.children ?? []).filter((c) => !have.has(c.id))
  const children = [...(s.sitemap.children ?? [])]
  const at = Math.max(0, children.findIndex((c) => c.id === "privacy"))
  children.splice(at === 0 && children[0]?.id !== "privacy" ? children.length : at, 0, ...extra)
  let n: GenState = {
    ...s,
    pb,
    brief: dentistBrief(pb),
    sitemap: { ...s.sitemap, sections: fresh.sections, children },
    pagePriority: dentistPriority(pb),
    msgs: s.msgs.map((x) => (x.id === id && x.type === "pb-patch" ? { ...x, resolved: "added" as const } : x)),
  }
  const names = Object.entries(decisions)
    .filter(([, d]) => d === "added")
    .map(([k]) => moduleById(k).name)
  if (s.phase === "plan") {
    n = { ...n, artifacts: { ...n.artifacts, brief: n.artifacts.brief === "confirmed" ? "awaiting" : n.artifacts.brief, sitemap: extra.length && n.artifacts.sitemap === "confirmed" ? "awaiting" : n.artifacts.sitemap } }
    return push(n, { type: "agent", text: `Added. This only affects ${joinAnd(names)}${extra.length ? ` and adds ${extra.length === 1 ? "a page" : `${extra.length} pages`} to the plan` : ""} — nothing else changes.` })
  }
  const pages = { ...n.pages }
  for (const p of extra) pages[p.id] = "queued"
  n = { ...n, pages }
  if (s.buildRun && s.runs[s.buildRun].status === "done" && !Object.values(pages).includes("building")) n = startNextPage(n)
  return push(n, { type: "agent", text: `Added. This only affects ${joinAnd(names)}${extra.length ? ` — building ${extra.length === 1 ? "its page" : `${extra.length} new pages`} now` : ""}. Nothing else changes.` })
}

/** a dentist site planned with defaults, for the prototype's jumps and the editor's existing sites */
function fastForwardPlaybook(s: GenState): GenState {
  let pb = withDefaults({ ...s.pb!, candidates: null })
  if (isDemoClinic(pb)) pb = { ...pb, found: { rating: RAHMA.rating, dentists: RAHMA.dentists.length, branches: 1, hours: RAHMA.hours }, answers: { ...pb.answers, scale: pb.answers.scale?.source === "default" ? { value: "dentists", source: "search" } : pb.answers.scale } }
  if (!Object.keys(pb.decisions).length)
    for (const g of offerFor(pb.goals)) for (const mod of g.modules) if (mod.id !== "gallery") pb = { ...pb, decisions: decide(pb.decisions, mod.id, "added", pb.goals) }
  pb = { ...pb, planConfirmed: true }
  const n: GenState = { ...s, pb, brief: dentistBrief(pb), questions: dentistQuestions(pb), sitemap: dentistSitemap(pb), pagePriority: dentistPriority(pb), styleId: s.styleId ?? presetOf(pb) }
  return push(n, { type: "pb-plan", confirmed: true })
}

/** the page the "A page fails" edge case breaks: Corporate for the lab, the fourth page otherwise */
const failingPage = (s: GenState) => (s.pb ? flatten(s.sitemap)[3]?.id : "corporate")

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
  // modules that need the owner's own accounts start in test mode
  if (n.pb && !n.msgs.some((m) => m.type === "pb-activate") && Object.entries(n.pb.decisions).some(([id, d]) => d === "added" && moduleById(id).needsAccount)) n = push(n, { type: "pb-activate" })
  // ask how it went once, after the first build only
  if (!n.msgs.some((m) => m.type === "feedback")) n = push(n, { type: "feedback" })
  return { ...n, queued: [] }
}

/** jump straight to a stage of the flow (scenario switcher) */
function jump(s: GenState, to: JumpTarget, plan: Plan = "business"): GenState {
  let n = initialState(s.prompt, s.scenario === "restricted" || s.scenario === "vague" ? "happy" : s.scenario, s.speed)
  if (to === "generating") return n
  if (n.pb) n = fastForwardPlaybook(n)
  // finish the plan run
  n = updateRun(n, 1, (r) => ({ ...r, status: "done", tasks: r.tasks.map((t) => ({ ...t, status: "done", duration: DURATIONS[t.id], detail: t.id === "brief" ? `Drafted a profile from assumptions, flagging ${countAssumptions(n.brief)} details to confirm` : t.id === "style" ? "Sketched 4 style options, including colors, fonts, and vibe" : t.id === "sitemap" ? `Planned ${flatten(n.sitemap).length} pages, including the structure` : undefined })) }))
  n = { ...n, searchShown: SEARCH_RESULTS.length, autoReviewed: n.planRun }
  n = finishPlan(n)
  if (to === "ready") return n
  if (to === "review-brief") return { ...n, review: { open: true, step: 0 } }
  n = { ...n, artifacts: { ...n.artifacts, brief: "confirmed" } }
  if (to === "review-style") return { ...n, review: { open: true, step: 1 } }
  n = { ...n, styleId: n.styleId ?? (n.pb ? presetOf(n.pb) : "clinical-clarity"), artifacts: { ...n.artifacts, style: "confirmed" } }
  if (to === "review-sitemap") return { ...n, review: { open: true, step: 2 } }
  n = startBuild({ ...n, artifacts: { ...n.artifacts, sitemap: "confirmed" }, plan })
  if (to === "creating") return n
  // finish the build
  const pages = Object.fromEntries(Object.entries(n.pages).map(([k, v]) => [k, v === "queued" ? "built" : v])) as Record<string, PageStatus>
  n = { ...n, pages, credits: Math.min(99, n.credits + 38) }
  n = updateRun(n, n.buildRun!, (r) => ({ ...r, status: "done", tasks: r.tasks.map((t) => ({ ...t, status: "done", duration: DURATIONS[t.id], detail: t.id === "pages" ? `Built ${Object.values(pages).filter((p) => p === "built").length} pages` : undefined })) }))
  n = finishBuild(n)
  if (to === "built") return n
  return { ...n, account: { name: "Kiki", email: "kiki@example.com" }, publish: { status: "live", domain: n.publish.domain } }
}

export const isPlanActive = (s: GenState) => s.runs[s.planRun]?.status === "running"
export { nextId }

/**
 * A finished site, as the standalone editor opens it: planned, built with the site's plan and (when live)
 * published. `ready` gives a site that is still waiting for its plan to be reviewed.
 */
export function siteState(opts: {
  prompt: string
  plan: Plan
  live: boolean
  built: boolean
  account: { name: string; email: string }
  domain: string
  credits: number
  styleId?: string | null
  /** a playbook site's add-ons, as the account has them */
  modules?: { id: string; status: "live" | "test" }[]
}): GenState {
  let base = initialState(opts.prompt, "happy")
  if (base.pb && opts.modules) {
    const decisions = Object.fromEntries(opts.modules.map((m) => [m.id, "added" as Decision]))
    base = { ...base, styleId: opts.styleId ?? null, pb: { ...withDefaults(base.pb), decisions, activated: opts.modules.filter((m) => m.status === "live").map((m) => m.id) } }
  }
  const n = opts.built ? reducer(base, { type: "jump", to: opts.live ? "published" : "built", plan: opts.plan }) : reducer(base, { type: "jump", to: "ready" })
  // existing websites were rated (or skipped) back when they were first built
  const msgs = n.msgs.map((m) => (m.type === "feedback" ? { ...m, answer: "skipped" as const } : m))
  return { ...n, msgs, plan: opts.plan, credits: opts.credits, account: opts.account, publish: { status: opts.live ? "live" : "idle", domain: opts.domain } }
}
