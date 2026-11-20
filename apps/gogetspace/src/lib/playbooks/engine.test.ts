/**
 * The dentist playbook's evals (§11), checked against the engine. Ids match the document (E1–E28); the ones
 * that are about screens rather than decisions are covered by the walkthroughs instead.
 */
import { describe, expect, it } from "vitest"
import { DENTIST } from "./dentist"
import {
  addLater,
  analyze,
  automationsOf,
  bringsWith,
  bundleOf,
  checkGuardrails,
  decide,
  detect,
  initialPlaybookState,
  mainButton,
  monthlyTotal,
  newGoals,
  nextQuestion,
  offerFor,
  presetOf,
  scenariosOf,
  withDefaults,
  type PlaybookState,
} from "./engine"

/** answers questions the way an owner would, until the engine stops asking */
function converse(prompt: string, answers: Record<string, string | string[]> = {}): { st: PlaybookState; asked: string[] } {
  let st = initialPlaybookState(prompt)
  for (let i = 0; i < 10; i++) {
    const q = nextQuestion(st)
    if (!q) break
    st = { ...st, asked: [...st.asked, q.id] }
    const a = answers[q.variant ?? q.slot]
    if (q.slot === "goals") st = { ...st, goals: (a as string[]) ?? [DENTIST.defaultGoal, DENTIST.defaultSecondary], goalsSource: "owner" }
    else st = { ...st, answers: { ...st.answers, [q.slot]: { value: (a as string) ?? "decide", source: "owner" } } }
  }
  return { st, asked: st.asked }
}

describe("detection", () => {
  it("detects a dental practice", () => {
    expect(detect("Create a website for a dentist").niche).toBe("dentist")
    expect(detect("Website for my 2-branch orthodontic clinic").niche).toBe("dentist")
    expect(detect("Website for clinical laboratory in penang named BAKTI ANALISA").niche).toBeNull()
  })
  it("sends dental labs and supply shops elsewhere", () => {
    expect(detect("A site for our dental lab").niche).toBeNull()
  })
  it("E8: a directory of dentists asks Q0 first and doesn't start a practice site", () => {
    const st = initialPlaybookState("I need a platform to list dentists in my city")
    expect(detect("I need a platform to list dentists in my city").directory).toBe(true)
    expect(nextQuestion(st)?.id).toBe("Q0")
  })
  it("E9: a dentist and a lawyer is flagged as possibly two sites", () => {
    expect(detect("A site for a dentist and a lawyer").otherNiche).toBe(true)
  })
})

describe("questions", () => {
  it("E1/E13: a vague prompt asks the goal question first, then at most four in total", () => {
    const st = initialPlaybookState("Create a website for a dentist")
    expect(nextQuestion(st)?.id).toBe("Q1")
    const { asked } = converse("Create a website for a dentist", { goals: ["G1"] })
    expect(asked[0]).toBe("Q1")
    expect(asked.filter((q) => q !== "Q0").length).toBeLessThanOrEqual(4)
    expect(new Set(asked).size).toBe(asked.length)
  })

  it("E2: stated goals are confirmed, not asked; S4 with S7, price ranges", () => {
    const prompt = "Website for my 2-branch orthodontic clinic. Patients should book consultations online and I want to show price ranges."
    const { st, asked } = converse(prompt)
    expect(st.goals).toEqual(["G2", "G7"])
    expect(asked).not.toContain("Q1")
    expect(asked).toEqual([])
    expect(st.answers.prices?.value).toBe("range")
    expect(scenariosOf(st)).toEqual(expect.arrayContaining(["S4", "S7"]))
    expect(bundleOf(st.goals)).toEqual(expect.arrayContaining(["estimates", "appointments", "branches"]))
  })

  it("E3: 'just build it' asks nothing, assumes G1 and flags the defaults", () => {
    const st = initialPlaybookState("Just build it, I'm a dentist")
    expect(nextQuestion(st)).toBeNull()
    expect(st.goals).toEqual(["G1"])
    const full = withDefaults(st)
    expect(Object.values(full.answers).every((a) => a.source === "default")).toBe(true)
    expect(scenariosOf(full)).toEqual(["S1"])
  })

  it("E6: a children's clinic uses the warm preset and asks goals, then scale", () => {
    const st = initialPlaybookState("Website for my children's dental clinic")
    expect(st.answers.focus?.value).toBe("pediatric")
    const { st: done, asked } = converse("Website for my children's dental clinic", { goals: ["G1"] })
    expect(asked.slice(0, 2)).toEqual(["Q1", "Q3"])
    expect(presetOf(done)).toBe("warm-family")
  })

  it("E7: 24-hour emergencies put the emergency path first without asking about hours", () => {
    const st = initialPlaybookState("We take emergency patients 24 hours")
    expect(st.goals[0]).toBe("G3")
    expect(st.answers.emergency?.value).toBe("daily")
    const { asked } = converse("We take emergency patients 24 hours")
    expect(asked).not.toContain("Q4")
    expect(scenariosOf(withDefaults(st))).toContain("S6")
  })

  it("E12: no prices switches to 'Ask us' without asking", () => {
    const st = initialPlaybookState("Dental clinic website. No prices on the site, and patients should book online")
    expect(st.answers.prices?.value).toBe("ask")
    const { asked } = converse("Dental clinic website. No prices on the site, and patients should book online")
    expect(asked).not.toContain("Q4")
  })

  it("E14: booking online with reminders skips Q1 and offers the G1 bundle", () => {
    const st = initialPlaybookState("I want patients to book online and get reminders — I'm a dentist")
    expect(st.goals).toEqual(["G1"])
    expect(nextQuestion(st)?.id).not.toBe("Q1")
    expect(bundleOf(st.goals)).toEqual(["appointments", "reviews"])
  })

  it("E15: 'more patients' is vague — proposes G1 with G6 to confirm", () => {
    const st = initialPlaybookState("I'm a dentist and I want more patients")
    expect(st.goals).toEqual([])
    expect(st.candidates).toEqual({ goals: ["G1", "G6"], kind: "vague" })
  })

  it("E16: several goals and a shop asks for the top goal and says the shop isn't supported", () => {
    const st = initialPlaybookState("Dental clinic: I want bookings, payments, an online shop and emergency slots")
    expect(st.candidates?.kind).toBe("several")
    expect(st.candidates?.goals).toEqual(expect.arrayContaining(["G1", "G3", "G5"]))
    expect(st.unsupported).toEqual(["Selling products online"])
  })

  it("E17: coming back for check-ups offers G4 with recall, and no Payments", () => {
    const st = initialPlaybookState("I'm a dentist. I want patients to come back for check-ups")
    expect(st.goals).toEqual(["G4"])
    const b = bundleOf(st.goals)
    expect(b).toEqual(["crm", "appointments", "reviews"])
    expect(b).not.toContain("payments")
    let d = {}
    for (const m of b) d = decide(d, m, "added", st.goals)
    expect(automationsOf({ ...st, decisions: d })).toEqual(expect.arrayContaining(["Recall", "Reactivation"]))
  })

  it("E18: deposits offers Payments, which brings Appointments with it", () => {
    const st = initialPlaybookState("Dentist here, I want to take deposits")
    expect(st.goals).toEqual(["G5"])
    expect(bringsWith("payments", {}, st.goals)?.id).toBe("appointments")
    const d = decide({}, "payments", "added", st.goals)
    expect(d).toEqual({ payments: "added", appointments: "added" })
  })

  it("E19: just being found asks neither scale nor emergency, and has no booking", () => {
    const { st, asked } = converse("I'm a dentist and I just want to be found online")
    expect(st.goals).toEqual(["G6"])
    expect(asked).not.toContain("Q3")
    expect(asked).not.toContain("Q2")
    expect(bundleOf(st.goals)).toEqual(["reviews"])
    expect(mainButton(st).label).toBe("Call or message us")
  })
})

describe("modules", () => {
  it("the mapping is fixed: the same goals give the same bundle", () => {
    expect(bundleOf(["G1", "G6"])).toEqual(bundleOf(["G1", "G6"]))
    expect(offerFor(["G1", "G4"]).map((g) => g.modules.map((m) => m.id))).toEqual([["appointments", "reviews"], ["crm"]])
  })

  it("E22: declining Appointments while the main goal is booking switches the main button", () => {
    const st = { ...initialPlaybookState("Dentist, patients should book online"), decisions: { appointments: "later" as const } }
    expect(mainButton(st)).toMatchObject({ label: "Call or message us", fallback: true })
  })

  it("E23: Payments and its parent are added or declined together", () => {
    const goals = ["G2", "G5"]
    let d = decide({}, "estimates", "later", goals)
    d = decide(d, "payments", "added", goals)
    expect(d.payments).toBe("added")
    expect(d.appointments === "added" || d.estimates === "added").toBe(true)
    d = decide(d, "appointments", "later", goals)
    if (d.estimates !== "added") expect(d.payments).toBe("later")
  })

  it("E24: every paid module has a price on its card", () => {
    for (const m of DENTIST.modules.filter((x) => !x.core && x.price > 0)) expect(m.price).toBeGreaterThan(0)
    expect(DENTIST.modules.filter((m) => m.core).every((m) => m.price === 0)).toBe(true)
  })

  it("E26: declining everything leaves only the free core, and the rest under Add later", () => {
    const st = initialPlaybookState("Dentist, patients should book online")
    let d = {}
    for (const m of bundleOf(st.goals)) d = decide(d, m, "later", st.goals)
    const s2 = { ...st, decisions: d }
    expect(monthlyTotal(s2)).toBe(0)
    expect(addLater(s2).map((m) => m.id)).toEqual(expect.arrayContaining(["appointments", "reviews"]))
  })

  it("E20: a new goal after the plan only offers the new modules", () => {
    const st = { ...initialPlaybookState("Dentist, patients should book online"), decisions: { appointments: "added" as const, reviews: "added" as const } }
    expect(newGoals("I also want emergency patients", st)).toEqual(["G3"])
    const patch = offerFor(["G3"], DENTIST, (m) => !st.decisions[m as keyof typeof st.decisions])
    expect(patch.flatMap((g) => g.modules.map((m) => m.id))).toEqual(["emergency"])
  })
})

describe("guardrails", () => {
  it("E4: 'best dentist' and 'painless' are declined with alternatives", () => {
    const hits = checkGuardrails("Say we're the best dentist in town and our treatments are painless")
    expect(hits.map((h) => h.id)).toEqual(expect.arrayContaining(["best", "painless"]))
    hits.forEach((h) => expect(h.alternative.length).toBeGreaterThan(10))
  })
  it("E5: medical history on the form is kept off the public form", () => {
    expect(checkGuardrails("Ask patients for their full medical history on the booking form").map((h) => h.id)).toContain("medical-history")
  })
  it("E11: before-and-after photos need consent", () => {
    const g = checkGuardrails("Show before and after photos of our veneers").find((h) => h.id === "before-after")
    expect(g?.confirm).toBeTruthy()
  })
  it("ordinary prompts don't trip the guardrails", () => {
    expect(checkGuardrails("Website for a family dental clinic in Penang called Rahma Family Dental")).toEqual([])
    expect(analyze("Website for a family dental clinic in Penang called Rahma Family Dental").business).toBe("Rahma Family Dental")
  })
})
