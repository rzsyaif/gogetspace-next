/**
 * The lawyer playbook's evals (§11), checked against the engine. Ids match the document. Module-offer evals
 * (E21–E28) are covered by the Modules page now that modules are suggested after the first build.
 */
import { describe, expect, it } from "vitest"
import { LAWYER } from "./lawyer"
import { lawyerBrief, lawyerSitemap } from "./lawyer-plan"
import { analyze, checkGuardrails, decide, detect, initialPlaybookState, mainButton, nextQuestion, offerFor, presetOf, restriction, scenariosOf, withDefaults, type PlaybookState } from "./engine"

/** answers questions the way an owner would, until the engine stops asking */
function converse(prompt: string, answers: Record<string, string | string[]> = {}): { st: PlaybookState; asked: string[] } {
  let st = initialPlaybookState(prompt)
  for (let i = 0; i < 10; i++) {
    const q = nextQuestion(st)
    if (!q) break
    st = { ...st, asked: [...st.asked, q.id] }
    const a = answers[q.variant ?? q.slot]
    if (q.slot === "goals") st = { ...st, goals: (a as string[]) ?? [LAWYER.defaultGoal, LAWYER.defaultSecondary], goalsSource: "owner" }
    else st = { ...st, answers: { ...st.answers, [q.slot]: { value: Array.isArray(a) ? a.join(",") : (a ?? LAWYER.defaults[q.slot as "focus"] ?? "decide"), source: "owner" } } }
  }
  return { st, asked: st.asked }
}

const counted = (asked: string[]) => asked.filter((q) => q !== "Q0" && q !== "QJ").length

describe("detection", () => {
  it("detects a law practice", () => {
    expect(detect("Create a website for a lawyer").niche).toBe("lawyer")
    expect(detect("Website for my family law firm in Kuala Lumpur").niche).toBe("lawyer")
    expect(initialPlaybookState("Create a website for a lawyer").niche).toBe("lawyer")
  })
  it("sends legal tech and law schools elsewhere", () => {
    expect(detect("A landing page for our legal tech startup").niche).toBeNull()
  })
  it("E7: a directory of lawyers asks Q0 and doesn't start a practice site", () => {
    const st = initialPlaybookState("I need a platform to list lawyers in my city")
    expect(nextQuestion(st)?.id).toBe("Q0")
  })
})

describe("questions", () => {
  it("E1: asks where the lawyer practices first, then the goal, then at most four counted questions", () => {
    const { asked } = converse("Create a website for a lawyer")
    expect(asked[0]).toBe("QJ")
    expect(asked[1]).toBe("Q1")
    expect(counted(asked)).toBeLessThanOrEqual(4)
  })
  it("E13: a stated jurisdiction skips QJ and asks the goal first", () => {
    const st = initialPlaybookState("Create a website for a lawyer in Singapore")
    expect(st.answers.jurisdiction?.value).toBe("sg")
    expect(nextQuestion(st)?.id).toBe("Q1")
  })
  it("E2: family law in a named country with a stated goal skips QJ and Q1, and uses the warm preset", () => {
    const { st, asked } = converse("Website for my family law practice in Malaysia. People should book confidential consultations.")
    expect(asked).not.toContain("QJ")
    expect(asked).not.toContain("Q1")
    expect(st.goals[0]).toBe("LG1")
    expect(scenariosOf(withDefaults(st))).toContain("L2")
    expect(presetOf(withDefaults(st))).toBe("warm-discreet")
  })
  it("E3: just build it asks nothing and assumes LG1 with the strictest defaults", () => {
    const { st, asked } = converse("Just build it, I'm a lawyer")
    expect(asked).toEqual([])
    const full = withDefaults(st)
    expect(full.goals[0]).toBe("LG1")
    expect(full.answers.jurisdiction?.value).toBe("unsure")
    expect(full.answers.jurisdiction?.source).toBe("default")
  })
  it("E6: criminal defense, calls any time — the urgent goal, Call now, direct preset", () => {
    const st = withDefaults(initialPlaybookState("Website for my criminal defense practice in London. We take calls any time."))
    expect(st.goals[0]).toBe("LG3")
    expect(mainButton(st).label).toBe("Call now")
    expect(presetOf(st)).toBe("direct-clear")
    expect(st.answers.urgent?.value).toBe("always")
  })
  it("practice areas are a multi-answer question, and family-only areas settle who the clients are", () => {
    const q2 = LAWYER.questions.find((q) => q.id === "Q2")!
    expect(q2.multi).toBe(3)
    const { asked } = converse("Lawyer website in Malaysia", { goals: ["LG1"], focus: ["family", "estates"] })
    expect(asked).toContain("Q2")
    expect(asked.filter((q) => q === "Q3")).toHaveLength(0)
  })
  it("the follow-up belongs to the main goal: first meeting, urgent hours or fees", () => {
    const ask = (goals: string[]) => converse("Lawyer website in Malaysia", { goals, focus: ["family"] }).st
    const last = (st: PlaybookState) => Object.keys(st.answers)
    expect(last(ask(["LG1"]))).toContain("meeting")
    expect(last(ask(["LG3"]))).toContain("urgent")
    expect(last(ask(["LG5"]))).toContain("prices")
  })
  it("E19: just be found asks neither the size nor urgent hours", () => {
    const { asked, st } = converse("I'm a lawyer in Singapore and I just want to be found online")
    expect(st.goals).toEqual(["LG7"])
    expect(st.answers.scale).toBeUndefined()
    expect(st.answers.urgent).toBeUndefined()
    expect(counted(asked)).toBeLessThanOrEqual(4)
  })
  it("E15: more clients is vague and proposes LG1 with LG7", () => {
    const st = initialPlaybookState("I'm a lawyer and I want more clients")
    expect(st.candidates).toEqual({ goals: ["LG1", "LG7"], kind: "vague" })
  })
})

describe("goals and modules", () => {
  it("E14: booking consultations brings Appointments, and Reviews only where the rules allow", () => {
    const my = withDefaults(initialPlaybookState("Lawyer in Malaysia — I want people to book consultations online and get reminders"))
    expect(my.goals[0]).toBe("LG1")
    expect(offerFor(my.goals).flatMap((g) => g.modules.map((m) => m.id))).toContain("consultations")
    expect(restriction(my, "legal-reviews")).toMatch(/restricted/)
    const uk = withDefaults(initialPlaybookState("Solicitor in London — I want people to book consultations online"))
    expect(restriction(uk, "legal-reviews")).toBeNull()
  })
  it("E29: no location and no answer keeps reviews off and says why", () => {
    const st = withDefaults(initialPlaybookState("Just build it, I'm a lawyer"))
    expect(restriction(st, "legal-reviews")).toMatch(/where you practice/)
  })
  it("E17: keeping clients informed offers Client updates with Clients and enquiries", () => {
    const st = initialPlaybookState("I'm a lawyer in Singapore. I want to keep my clients updated on their matters")
    expect(st.goals).toContain("LG6")
    const ids = offerFor(["LG6"]).flatMap((g) => g.modules.map((m) => m.id))
    expect(ids).toEqual(["client-updates", "law-clients"])
  })
  it("E18 / E23: Payments needs Appointments or Fee proposals, and comes with its notice to confirm", () => {
    const d = decide({}, "legal-payments", "added", ["LG4"])
    expect(d.consultations).toBe("added")
    const pay = LAWYER.modules.find((m) => m.id === "legal-payments")!
    expect(pay.notice).toMatch(/trust account/)
    expect(pay.confirm).toBeTruthy()
  })
  it("E16 / E9: a client portal is out of scope and said so", () => {
    expect(analyze("Lawyer site: bookings, payments, a client portal and urgent call-backs", LAWYER).unsupported).toContain("A client portal")
  })
  it("E22: without Appointments the main button falls back to call or message", () => {
    const st = withDefaults({ ...initialPlaybookState("Lawyer in Malaysia, more consultations booked online"), decisions: { consultations: "later" } })
    expect(mainButton(st)).toMatchObject({ label: "Call or message us", fallback: true })
  })
})

describe("guardrails", () => {
  it("E4: best lawyer and always win are declined", () => {
    const ids = checkGuardrails("Say we're the best lawyer in town and we always win", LAWYER).map((g) => g.id)
    expect(ids).toEqual(expect.arrayContaining(["best", "win"]))
  })
  it("E5: describing the whole case on the form is declined", () => {
    expect(checkGuardrails("Ask people to describe their whole case on the form", LAWYER).map((g) => g.id)).toContain("whole-case")
  })
  it("E11 / E12: case results and guaranteed approvals are declined", () => {
    expect(checkGuardrails("Show our past case results and client names", LAWYER).map((g) => g.id)).toContain("case-results")
    expect(checkGuardrails("Our visa applications are guaranteed to be approved", LAWYER).map((g) => g.id)).toContain("win")
  })
})

describe("plan", () => {
  it("names the rules followed and builds a page per practice area", () => {
    const st = withDefaults(initialPlaybookState("Website for Aziz & Lim Advocates, a family and property law firm in Kuala Lumpur"))
    expect(st.business).toBe("Aziz & Lim Advocates")
    const brief = lawyerBrief(st)
    expect(brief.find((s) => s.id === "rules")!.items[0].text).toMatch(/Malaysia/)
    const map = lawyerSitemap(st)
    const ids = map.children!.flatMap((c) => [c.id, ...(c.children ?? []).map((x) => x.id)])
    expect(ids).toEqual(expect.arrayContaining(["areas", "a-family", "a-property", "lawyers", "how", "fees", "contact"]))
    expect(ids).not.toContain("book")
  })
})
