/** walks the reducer through a dentist conversation the way the timers and the owner would */
import { describe, expect, it } from "vitest"
import { SHARPEN_INTRO, initialState, reducer, type Action, type GenState, type Msg } from "./state"

function tick(s: GenState, max = 20): GenState {
  for (let i = 0; i < max; i++) {
    const r = s.runs[s.planRun]
    if (r.status !== "running" || !r.tasks.some((t) => t.status === "running")) break
    s = reducer(s, { type: "planStepDone" })
  }
  return s
}
/** runs the plan and the build to the end, like the timers would */
function build(s: GenState): GenState {
  s = tick(s)
  for (let i = 0; i < 200 && s.buildRun; i++) {
    const r = s.runs[s.buildRun]
    if (r.status !== "running") break
    s = reducer(s, Object.values(s.pages).includes("building") ? { type: "pageDone" } : { type: "buildStepDone" })
  }
  // the owner opens the questions from the to-do list
  return reducer(s, { type: "showQuestions" })
}
const open = (s: GenState) => s.msgs.find((m) => (m.type === "pb-question" || m.type === "pb-gate") && !m.answer) as Extract<Msg, { type: "pb-question" }> | undefined
const go = (s: GenState, a: Action) => reducer(s, a)
const built = (s: GenState) => s.phase === "create" && s.runs[s.buildRun!].status === "done"

describe("dentist conversation", () => {
  it("builds from guesses straight away, then asks what it guessed", () => {
    let s = initialState("Create a website for a dentist")
    expect(s.niche).toBe("dentist")
    s = tick(s)
    // nothing waits on the owner: the plan runs through and the build starts
    expect(open(s)).toBeUndefined()
    expect(s.phase).toBe("create")
    expect(s.msgs.some((m) => m.type === "artifacts" || m.type === "pb-plan")).toBe(false)
    s = build(s)
    expect(built(s)).toBe(true)
    expect(s.msgs.some((m) => m.type === "agent" && m.text === SHARPEN_INTRO)).toBe(true)
    const q1 = open(s)!
    expect(q1.qid).toBe("Q1")
    s = go(s, { type: "pbAnswer", id: q1.id, value: ["G1"] })
    expect(open(s)!.qid).toBe("Q2")
    s = go(s, { type: "followUp", text: "Mostly braces and aligners" })
    expect(s.pb!.answers.focus?.value).toBe("ortho")
    for (let i = 0; i < 4 && open(s); i++) s = go(s, { type: "pbAnswer", id: open(s)!.id, value: "decide" })
    expect(open(s)).toBeUndefined()
    expect(s.msgs.at(-1)).toMatchObject({ type: "agent", text: expect.stringContaining("updated your site") })
  })

  it("a change request while a question is open goes to the site, not the question", () => {
    let s = build(initialState("Create a website for a dentist"))
    const q = open(s)!
    s = go(s, { type: "followUp", text: "Make the header darker" })
    expect(open(s)?.id).toBe(q.id)
    expect(s.msgs.at(-1)).toMatchObject({ type: "agent", text: expect.stringContaining("Done") })
  })

  it("'just build it' asks nothing, before or after", () => {
    const s = build(initialState("Just build it, I'm a dentist"))
    expect(built(s)).toBe(true)
    expect(open(s)).toBeUndefined()
  })

  it("guardrails show up as cards and new goals after the build become a patch", () => {
    let s = build(initialState("Just build it, I'm a dentist. Say we're the best dentist in Penang"))
    expect(s.msgs.some((m) => m.type === "pb-guard" && m.rule === "best")).toBe(true)
    s = go(s, { type: "followUp", text: "I also want emergency patients" })
    const patch = s.msgs.find((m) => m.type === "pb-patch")!
    s = go(s, { type: "pbPatch", id: patch.id, decisions: { emergency: "added" } })
    expect(s.sitemap.children?.map((c) => c.id)).toContain("emergency")
  })

  it("a directory is gated before anything is planned", () => {
    const s = go(initialState("I need a platform to list dentists in my city"), { type: "planStepDone" })
    expect(open(s)?.type).toBe("pb-gate")
    expect(s.phase).toBe("plan")
  })

  it("jumping to the editor fast-forwards a dentist plan", () => {
    const s = go(initialState("Website for Rahma Family Dental in Penang"), { type: "jump", to: "built" })
    expect(s.pb?.planConfirmed).toBe(true)
    expect(s.artifacts.brief).toBe("awaiting")
  })

  it("the brief is confirmed from the to-do list, and edits after the build update the site", () => {
    let s = build(initialState("Website for Rahma Family Dental in Penang"))
    expect(s.artifacts.brief).toBe("awaiting")
    s = go(s, { type: "editBrief", brief: s.brief.slice(1) })
    s = go(s, { type: "confirmBrief" })
    expect(s.artifacts.brief).toBe("confirmed")
    expect(s.msgs.at(-1)).toMatchObject({ type: "agent", text: expect.stringContaining("Brief confirmed") })
  })
})

describe("every eval prompt reaches a build, then its questions", () => {
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
      for (let i = 0; i < 4; i++) {
        s = tick(s, 1)
        const o = open(s) as Msg | undefined
        if (o?.type === "pb-gate") s = go(s, { type: "pbGate", id: o.id, answer: o.kind === "two-sites" ? "only" : "one" })
      }
      s = build(s)
      expect(built(s)).toBe(true)
      for (let i = 0; i < 8 && open(s); i++) {
        const o = open(s)!
        s = go(s, { type: "pbAnswer", id: o.id, value: o.slot === "goals" ? (s.pb!.candidates?.goals.slice(0, 1) ?? ["G1"]) : "decide" })
      }
      expect(open(s)).toBeUndefined()
      expect(s.pb!.asked.filter((q) => q !== "Q0" && q !== "QJ").length).toBeLessThanOrEqual(4)
    })
})

describe("the question card", () => {
  it("answers quietly, goes back to undo, and skips the rest", () => {
    let s = build(initialState("Create a website for a dentist"))
    const q1 = open(s)!
    s = go(s, { type: "pbAnswer", id: q1.id, value: ["G4"] })
    expect(s.msgs.some((m) => m.type === "user" && m.text.includes("coming back"))).toBe(false)
    const q2 = open(s)!
    expect(q2.qid).toBe("Q2")
    s = go(s, { type: "pbBack", id: q2.id })
    expect(open(s)?.id).toBe(q1.id)
    expect(open(s)?.value).toEqual(["G4"])
    s = go(s, { type: "pbAnswer", id: q1.id, value: ["G1"] })
    s = go(s, { type: "pbSkipAll" })
    expect(open(s)).toBeUndefined()
    expect(s.msgs.filter((m) => m.type === "agent" && m.text.includes("updated your site"))).toHaveLength(1)
  })
  it("a written answer is matched, or asked again", () => {
    let s = build(initialState("Create a website for a dentist"))
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
    let s = build(initialState("Create a website for a dentist"))
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
    expect(s.brief.flatMap((b) => b.items.map((i) => i.text)).join(" ")).toContain("prices.xlsx")
  })
})

describe("the size question", () => {
  it("keeps the dentists the owner typed, with registration numbers, in the brief", () => {
    let s = build(initialState("Website for my children's dental clinic"))
    s = go(s, { type: "pbAnswer", id: open(s)!.id, value: ["G1"] })
    const q = open(s)!
    expect(q.slot).toBe("scale")
    s = go(s, { type: "pbAnswer", id: q.id, value: "dentists", team: { people: [{ name: "Dr. Aisyah Rahman", reg: "12345" }, { name: "Dr. Wei Tan" }] } })
    expect(s.msgs.find((m) => m.id === q.id && m.type === "pb-question")).toMatchObject({ answer: expect.stringContaining("2 dentists added") })
    s = go(s, { type: "pbSkipAll" })
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

describe("the questions after the build", () => {
  it("wait in the to-do list: typing doesn't answer them until they're opened", () => {
    let s = initialState("Create a website for a dentist")
    for (let i = 0; i < 200 && !(s.buildRun && s.runs[s.buildRun].status === "done"); i++)
      s = reducer(s, s.phase === "plan" ? { type: "planStepDone" } : Object.values(s.pages).includes("building") ? { type: "pageDone" } : { type: "buildStepDone" })
    expect(s.sharpenOpen).toBeFalsy()
    s = reducer(s, { type: "followUp", text: "Mostly braces and aligners" })
    expect(s.pb!.answers.focus?.source).not.toBe("owner")
  })
})
