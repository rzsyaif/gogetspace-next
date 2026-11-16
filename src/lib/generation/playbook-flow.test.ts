/** walks the reducer through a dentist conversation the way the timers and the owner would */
import { describe, expect, it } from "vitest"
import { initialState, reducer, type Action, type GenState, type Msg } from "./state"

function tick(s: GenState, max = 20): GenState {
  for (let i = 0; i < max; i++) {
    const r = s.runs[s.planRun]
    if (r.status !== "running" || !r.tasks.some((t) => t.status === "running")) break
    s = reducer(s, { type: "planStepDone" })
  }
  return s
}
const open = (s: GenState) => s.msgs.find((m) => (m.type === "pb-question" || m.type === "pb-gate") && !m.answer) as Extract<Msg, { type: "pb-question" }> | undefined
const go = (s: GenState, a: Action) => reducer(s, a)

describe("dentist conversation", () => {
  it("asks the goal, then focus, shows one plan card and plans after confirming", () => {
    let s = initialState("Create a website for a dentist")
    expect(s.niche).toBe("dentist")
    s = go(s, { type: "planStepDone" }) // read
    const q1 = open(s)!
    expect(q1.qid).toBe("Q1")
    s = go(s, { type: "pbAnswer", id: q1.id, value: ["G1"] })
    const q2 = open(s)!
    expect(q2.qid).toBe("Q2")
    s = go(s, { type: "followUp", text: "Mostly braces and aligners" })
    expect(s.pb!.answers.focus?.value).toBe("ortho")
    // answer whatever is left
    for (let i = 0; i < 4 && open(s); i++) s = go(s, { type: "pbAnswer", id: open(s)!.id, value: "decide" })
    expect(s.msgs.some((m) => m.type === "pb-plan")).toBe(false) // waits for the search
    s = tick(s)
    expect(s.runs[s.planRun].status).toBe("waiting")
    expect(s.msgs.filter((m) => m.type === "pb-plan")).toHaveLength(1)
    s = go(s, { type: "pbDecide", module: "appointments", decision: "added" })
    s = go(s, { type: "pbConfirmPlan" })
    expect(s.runs[s.planRun].status).toBe("running")
    s = tick(s)
    expect(s.runs[s.planRun].status).toBe("done")
    expect(s.sitemap.children?.map((c) => c.id)).toContain("book")
  })

  it("'just build it' asks nothing and goes straight to the plan card", () => {
    const s = tick(initialState("Just build it, I'm a dentist"))
    expect(open(s)).toBeUndefined()
    expect(s.msgs.some((m) => m.type === "pb-plan")).toBe(true)
  })

  it("guardrails show up as cards and new goals after the plan become a patch", () => {
    let s = tick(initialState("Just build it, I'm a dentist. Say we're the best dentist in Penang"))
    expect(s.msgs.some((m) => m.type === "pb-guard" && m.rule === "best")).toBe(true)
    s = tick(go(s, { type: "pbConfirmPlan" }))
    s = go(s, { type: "followUp", text: "I also want emergency patients" })
    const patch = s.msgs.find((m) => m.type === "pb-patch")!
    s = go(s, { type: "pbPatch", id: patch.id, decisions: { emergency: "added" } })
    expect(s.sitemap.children?.map((c) => c.id)).toContain("emergency")
  })

  it("a directory is gated before anything is planned", () => {
    const s = go(initialState("I need a platform to list dentists in my city"), { type: "planStepDone" })
    expect(open(s)?.type).toBe("pb-gate")
  })

  it("jumping to the editor fast-forwards a dentist plan", () => {
    const s = go(initialState("Website for Rahma Family Dental in Penang"), { type: "jump", to: "built" })
    expect(s.pb?.planConfirmed).toBe(true)
  })
})
