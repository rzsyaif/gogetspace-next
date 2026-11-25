/**
 * MOCK DATA for the CRM. `getCrm` builds a project's clients, enquiries and history relative to `now`, so the
 * follow-up list and "this month" always have something to show. Replace with an API call returning `CrmData`.
 */
import { HOURS_PRESETS, formatTime } from "../appointments"
import { weekBookings } from "./index"
import { STAGE_PRESETS, isoDay, type CrmActivity, type CrmClient, type CrmCompany, type CrmData, type CrmEnquiry, type LeadSource } from "../crm"

const DAY = 24 * 60 * 60 * 1000

interface Seed {
  name: string
  phone?: string
  email?: string
  company?: string
  source: LeadSource
  title: string
  value?: number
  stage: string
  /** days since the enquiry came in */
  age: number
  /** days since the last activity */
  quiet: number
  /** next step: text and due in days (negative = overdue) */
  next?: [string, number]
  /** what happened after the enquiry, oldest first: [days ago, kind, text] */
  history?: [number, CrmActivity["kind"], string][]
  lostReason?: string
}

const COMPANIES: CrmCompany[] = [
  { id: "co-lumen", name: "Lumen Logistics Sdn Bhd", industry: "Logistics" },
  { id: "co-kenanga", name: "Kenanga Bay Hotel", industry: "Hospitality" },
  { id: "co-seri", name: "Seri Mutiara International School", industry: "Education" },
]

const RAHMA: Seed[] = [
  { name: "Farah Iskandar", phone: "+60 12-418 2290", email: "farah.iskandar@gmail.com", source: "website", title: "Invisalign", value: 12000, stage: "plan", age: 16, quiet: 9, next: ["Call back about the treatment plan", -2], history: [[14, "booking", "Consultation, Wed 10am"], [9, "email", "Sent the treatment plan and quote"]] },
  { name: "Hafiz Musa", phone: "+60 17-332 0915", source: "website", title: "Wisdom tooth removal", value: 1200, stage: "new", age: 0, quiet: 0 },
  { name: "Grace Lee", email: "grace.lee@outlook.com", source: "website", title: "Teeth whitening", value: 900, stage: "new", age: 1, quiet: 1 },
  { name: "Kumar Raj", phone: "+60 16-220 7781", email: "kumar.raj@lumenlogistics.my", company: "co-lumen", source: "referral", title: "Staff dental plan, 40 people", value: 18000, stage: "plan", age: 21, quiet: 3, next: ["Send the revised plan to HR", 0], history: [[18, "call", "Intro call with Kumar (HR)"], [12, "booking", "Site visit at Lumen's office"], [3, "note", "They want check-ups twice a year included"]] },
  { name: "Lim Wei Jie", phone: "+60 11-5521 4408", source: "walk-in", title: "Crown", value: 1800, stage: "plan", age: 12, quiet: 8, history: [[10, "booking", "Consultation, Fri 3:30pm"], [8, "email", "Sent the quote for the crown"]] },
  { name: "Nadia Hassan", phone: "+60 13-660 1923", email: "nadia.h@kenangabay.com", company: "co-kenanga", source: "phone", title: "Front-desk team check-ups", value: 4200, stage: "consult", age: 9, quiet: 2, next: ["Confirm the group booking dates", 3], history: [[7, "call", "Called about group check-ups for 12 staff"], [2, "booking", "Meeting at the hotel, next Tue"]] },
  { name: "Aiman Zulkifli", phone: "+60 19-884 2210", source: "website", title: "Braces for his daughter", value: 6500, stage: "consult", age: 6, quiet: 6, history: [[5, "booking", "Consultation booked for Sat 10:30am"]] },
  { name: "Mei Ling Ong", email: "meiling.ong@gmail.com", source: "referral", title: "Veneers", value: 7200, stage: "consult", age: 4, quiet: 1, next: ["Prepare before-and-after examples", 1], history: [[1, "booking", "Consultation, Mon 4:45pm"]] },
  { name: "Arjun Pillai", phone: "+60 12-701 5563", source: "walk-in", title: "Implant", value: 5500, stage: "plan", age: 25, quiet: 13, history: [[22, "booking", "Consultation and X-ray"], [13, "email", "Sent the implant plan"]] },
  { name: "Siti Hajar", phone: "+60 14-338 9012", source: "website", title: "Braces review", stage: "consult", age: 3, quiet: 3, history: [[3, "booking", "Booked online for Mon 2pm"]] },
  { name: "Daniel Tan", phone: "+60 12-990 1182", email: "daniel.tan@seri.edu.my", company: "co-seri", source: "referral", title: "School dental day", value: 3000, stage: "new", age: 2, quiet: 2, next: ["Reply with available dates", -1] },
  { name: "Nur Aina", phone: "+60 18-221 4455", source: "website", title: "Scaling and polishing", value: 150, stage: "won", age: 11, quiet: 4, history: [[10, "booking", "Booked online"], [4, "stage", "Going ahead"]] },
  { name: "Priya Nair", email: "priya.nair@gmail.com", source: "website", title: "Invisalign", value: 11500, stage: "won", age: 30, quiet: 6, history: [[26, "booking", "Consultation"], [20, "email", "Sent the treatment plan"], [6, "stage", "Going ahead, paid the deposit"]] },
  { name: "Tan Boon Hock", phone: "+60 12-554 3020", source: "phone", title: "Dentures", value: 2400, stage: "won", age: 19, quiet: 2, history: [[15, "booking", "Fitting appointment"], [2, "stage", "Going ahead"]] },
  { name: "Chong Mei Yee", email: "meiyee.c@yahoo.com", source: "website", title: "Teeth whitening", value: 900, stage: "lost", age: 24, quiet: 10, lostReason: "Price", history: [[18, "email", "Sent the price list"], [10, "stage", "Not going ahead: price"]] },
  { name: "Ravi Shankar", phone: "+60 16-773 2041", source: "walk-in", title: "Root canal", value: 1500, stage: "lost", age: 40, quiet: 33, lostReason: "Went elsewhere", history: [[33, "stage", "Not going ahead: went elsewhere"]] },
]

let cache: { key: string; data: CrmData } | null = null

/** a project's CRM, as of `now` (the same `now` day gives the same data) */
export function getCrm(projectId: string, now: Date): CrmData {
  const key = `${projectId}:${isoDay(now)}`
  if (cache?.key === key) return structuredClone(cache.data)
  const rahma = projectId === "rahma-dental"
  const at = (daysAgo: number, hour = 10) => {
    const d = new Date(now.getTime() - daysAgo * DAY)
    d.setHours(Math.min(hour, daysAgo === 0 ? Math.max(8, now.getHours() - 1) : hour), 0, 0, 0)
    return d.toISOString()
  }
  const clients: CrmClient[] = []
  const enquiries: CrmEnquiry[] = []
  const activity: CrmActivity[] = []
  for (const [i, s] of (rahma ? RAHMA : []).entries()) {
    const id = `c${i + 1}`
    const eid = `e${i + 1}`
    clients.push({ id, name: s.name, phone: s.phone, email: s.email, companyId: s.company, source: s.source, createdAt: at(s.age, 9 + (i % 6)) })
    const due = s.next ? isoDay(new Date(now.getTime() + s.next[1] * DAY)) : undefined
    const closed = s.stage === "won" || s.stage === "lost"
    enquiries.push({
      id: eid,
      clientId: id,
      title: s.title,
      value: s.value,
      stageId: s.stage,
      updatedAt: at(s.quiet, 11 + (i % 5)),
      nextStep: s.next && due ? { text: s.next[0], due } : undefined,
      closedAt: closed ? at(s.quiet, 15) : undefined,
      lostReason: s.lostReason,
    })
    const via = s.source === "website" ? "Enquiry from your website" : s.source === "referral" ? "Referred by a client" : s.source === "phone" ? "Phoned in" : "Walked in"
    activity.push({ id: `a${i}-0`, clientId: id, enquiryId: eid, at: at(s.age, 9 + (i % 6)), kind: "enquiry", text: `${via}: ${s.title}` })
    for (const [k, [ago, kind, text]] of (s.history ?? []).entries()) activity.push({ id: `a${i}-${k + 1}`, clientId: id, enquiryId: eid, at: at(ago, 12 + k), kind, text })
  }
  // online bookings from people who aren't clients yet arrive as enquiries (Settings › New enquiries › new bookings)
  if (rahma) {
    const known = new Set(clients.map((c) => c.name.toLowerCase()))
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    const weeks = [0, 7].flatMap((n) => weekBookings(projectId, new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + n), HOURS_PRESETS[1].week, now))
    for (const b of weeks.filter((b) => new Date(`${b.date}T${b.start}`) > now).sort((a, b) => (`${a.date}${a.start}` < `${b.date}${b.start}` ? -1 : 1))) {
      if (known.has(b.name.toLowerCase())) continue
      known.add(b.name.toLowerCase())
      const n = clients.length + 1
      const booked = at(Math.min(2, (n % 3) + 1), 20)
      const day = new Date(`${b.date}T00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      clients.push({ id: `c${n}`, name: b.name, email: `${b.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`, source: "website", createdAt: booked })
      enquiries.push({ id: `e${n}`, clientId: `c${n}`, title: b.type, stageId: "consult", updatedAt: booked })
      activity.push({ id: `a-b${n}`, clientId: `c${n}`, enquiryId: `e${n}`, at: booked, kind: "booking", text: `Booked online: ${b.type}, ${day} ${formatTime(b.start)}` })
    }
  }
  const data: CrmData = {
    settings: { stages: STAGE_PRESETS[rahma ? "dentist" : "general"], quietDays: 7, companies: rahma, auto: { website: true, appointments: true } },
    clients,
    companies: rahma ? COMPANIES : [],
    enquiries,
    activity,
  }
  cache = { key, data }
  return structuredClone(data)
}
