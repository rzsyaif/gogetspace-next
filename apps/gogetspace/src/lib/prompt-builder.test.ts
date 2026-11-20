import { describe, expect, it } from "vitest"
import { BUSINESS_TYPES, apply, detailOf, goalChoices, missing, read, styleChoices } from "./prompt-builder"
import { initialPlaybookState } from "./playbooks/engine"

describe("prompt builder", () => {
  it("reads back every blank it writes, for every business type, goal and speciality", () => {
    for (const t of BUSINESS_TYPES)
      for (const g of goalChoices(t))
        for (const d of detailOf(t)?.choices ?? [null]) {
          let p = apply("", "type", t.id)
          p = apply(p, "name", "Harbour View")
          p = apply(p, "place", "Penang")
          p = apply(p, "goal", g.phrase)
          if (d) p = apply(p, "detail", d.phrase)
          p = apply(p, "style", styleChoices(t)[1].name)
          const r = read(p)
          expect(r.type?.id, p).toBe(t.id)
          expect(r.name, p).toBe("Harbour View")
          expect(r.place, p).toBe("Penang")
          expect(r.goal?.id, p).toBe(g.id)
          if (d) expect(r.detail?.id, p).toBe(d.id)
          expect(r.style?.id, p).toBe(styleChoices(t)[1].id)
          expect(missing(r, true), p).toEqual([])
        }
  })
  it("the agent reads the same goal and name", () => {
    const p = "Build a website for a dental clinic named Rahma Family Dental in Penang, to keep patients coming back for check-ups"
    const st = initialPlaybookState(p)
    expect(st.goals[0]).toBe("G4")
    expect(st.business).toBe("Rahma Family Dental")
  })
  it("a free-form prompt keeps what it says", () => {
    const r = read("Website for my kids' dental clinic in Penang")
    expect(r.type?.id).toBe("dentist")
    expect(r.place).toBe("Penang")
    expect(missing(r, false)).toEqual(["name", "goal", "style", "logo"])
  })
})

describe("what the builder sends", () => {
  it("the picked style is the one the build uses", async () => {
    const { initialState } = await import("./generation/state")
    const s = initialState("Build a website for a dental clinic named Rahma Family Dental in Penang, in the Warm Family style")
    expect(s.styleId).toBe("warm-family")
    expect(s.pb?.style).toBe("warm-family")
  })
})
