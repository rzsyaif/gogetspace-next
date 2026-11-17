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

describe("every eval prompt reaches a plan and a build", () => {
  const prompts = [
    "Create a website for a dentist",
    "Website for my 2-branch orthodontic clinic. Patients should book consultations online and I want to show price ranges.",
    "Just build it, I'm a dentist",
    "Website for Rahma Family Dental in Penang. Say we're the best dentist in town and our treatments are painless",
    "Website for my children's dental clinic",
    "Dental clinic website — we take emergency patients 24 hours",
    "I need a platform to list dentists in my city",
    "A site for a dentist and a lawyer",
    "I'm a dentist and I want more patients",
    "Dental clinic: I want bookings, payments, an online shop and emergency slots",
    "I'm a dentist. I want patients to come back for check-ups",
  ]
  for (const prompt of prompts)
    it(prompt, () => {
      let s = initialState(prompt)
      expect(s.niche).toBe("dentist")
      for (let i = 0; i < 12; i++) {
        s = tick(s, 1)
        const o = s.msgs.find((m) => (m.type === "pb-question" || m.type === "pb-gate") && !m.answer)
        if (o?.type === "pb-gate") s = go(s, { type: "pbGate", id: o.id, answer: o.kind === "two-sites" ? "only" : "one" })
        else if (o?.type === "pb-question") s = go(s, { type: "pbAnswer", id: o.id, value: o.slot === "goals" ? (s.pb!.candidates?.goals.slice(0, 1) ?? ["G1"]) : "decide" })
      }
      s = tick(s)
      expect(s.msgs.filter((m) => m.type === "pb-plan")).toHaveLength(1)
      expect(s.pb!.asked.filter((q) => q !== "Q0").length).toBeLessThanOrEqual(4)
      s = tick(go(s, { type: "pbConfirmPlan" }))
      expect(s.runs[s.planRun].status).toBe("done")
      s = go(s, { type: "jump", to: "built" })
      expect(s.phase).toBe("create")
    })
})

describe("the question card", () => {
  it("answers quietly, goes back to undo, and skips the rest", () => {
    let s = go(initialState("Create a website for a dentist"), { type: "planStepDone" })
    const q1 = open(s)!
    s = go(s, { type: "pbAnswer", id: q1.id, value: ["G4"] })
    expect(s.msgs.some((m) => m.type === "user" && m.text.includes("coming back"))).toBe(false)
    const q2 = open(s)!
    expect(q2.qid).toBe("Q2")
    s = go(s, { type: "pbBack", id: q2.id })
    expect(open(s)?.id).toBe(q1.id)
    expect(open(s)?.value).toEqual(["G4"])
    expect(s.pb!.goals).toEqual([])
    s = go(s, { type: "pbAnswer", id: q1.id, value: ["G1"] })
    s = go(s, { type: "pbSkipAll" })
    expect(open(s)).toBeUndefined()
    s = tick(s)
    expect(s.msgs.filter((m) => m.type === "pb-plan")).toHaveLength(1)
  })
  it("a written answer is matched, or asked again", () => {
    let s = go(initialState("Create a website for a dentist"), { type: "planStepDone" })
    s = go(s, { type: "pbAnswer", id: open(s)!.id, value: ["G1"] })
    const q2 = open(s)!
    s = go(s, { type: "pbAnswerText", id: q2.id, text: "qwerty" })
    expect(open(s)?.unclear).toBe("qwerty")
    s = go(s, { type: "pbAnswerText", id: q2.id, text: "mostly braces" })
    expect(s.pb!.answers.focus?.value).toBe("ortho")
  })
})

describe("the prices question", () => {
  it("keeps the owner's price list with the answer and in the brief", () => {
    let s = go(initialState("Create a website for a dentist"), { type: "planStepDone" })
    s = go(s, { type: "pbAnswer", id: open(s)!.id, value: ["G6"] })
    let q = open(s)!
    for (let i = 0; i < 4 && q && q.slot !== "prices"; i++) {
      s = go(s, { type: "pbAnswer", id: q.id, value: "decide" })
      q = open(s)!
    }
    expect(q.slot).toBe("prices")
    s = go(s, { type: "pbAnswer", id: q.id, value: "exact", prices: { file: { name: "prices.xlsx", size: 12000 } } })
    expect(s.pb!.priceList?.file?.name).toBe("prices.xlsx")
    expect(s.msgs.find((m) => m.id === q.id && m.type === "pb-question")).toMatchObject({ answer: expect.stringContaining("prices.xlsx") })
    s = go(s, { type: "pbSkipAll" })
    s = tick(go(tick(s), { type: "pbConfirmPlan" }))
    expect(s.brief.flatMap((b) => b.items.map((i) => i.text)).join(" ")).toContain("prices.xlsx")
  })
})

describe("the size question", () => {
  it("keeps the dentists the owner typed, with registration numbers, in the brief", () => {
    let s = go(initialState("Website for my children's dental clinic"), { type: "planStepDone" })
    s = go(s, { type: "pbAnswer", id: open(s)!.id, value: ["G1"] })
    const q = open(s)!
    expect(q.slot).toBe("scale")
    s = go(s, { type: "pbAnswer", id: q.id, value: "dentists", team: { people: [{ name: "Dr. Aisyah Rahman", reg: "12345" }, { name: "Dr. Wei Tan" }] } })
    expect(s.msgs.find((m) => m.id === q.id && m.type === "pb-question")).toMatchObject({ answer: expect.stringContaining("2 dentists added") })
    s = go(s, { type: "pbSkipAll" })
    s = tick(go(tick(s), { type: "pbConfirmPlan" }))
    const brief = s.brief.flatMap((b) => b.items.map((i) => i.text)).join(" ")
    expect(brief).toContain("Dr. Aisyah Rahman — 12345")
    expect(brief).toContain("the other 1")
  })
})

describe("adding a module from the Modules page", () => {
  it("sends the request to the chat and builds the module's page", () => {
    let s = go(initialState("Website for Rahma Family Dental in Penang"), { type: "jump", to: "built" })
    expect(s.sitemap.children?.map((c) => c.id)).not.toContain("consultation")
    s = go(s, { type: "pbImplement", module: "estimates", at: 0 })
    expect(s.pb!.decisions.estimates).toBe("added")
    expect(s.sitemap.children?.map((c) => c.id)).toContain("consultation")
    expect(s.pages.consultation).toBe("built")
    const [user, card] = s.msgs.slice(-2)
    expect(user).toMatchObject({ type: "user", text: "Add Estimates to my website." })
    expect(card).toMatchObject({ type: "pb-implement", module: "estimates" })
  })
})
