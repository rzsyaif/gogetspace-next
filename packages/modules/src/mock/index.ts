/**
 * MOCK DATA. The prototype reads everything through these functions; replace their bodies with real API calls
 * and the screens stay the same. Each one is async on purpose, so the shape already matches a fetch.
 */
import type { Member, Project } from "../project"
import type { HomeLayout, Peeks } from "../peeks"
import { HOURS_PRESETS, fromMinutes, toMinutes, type AppointmentSettings, type Booking, type BookingType, type WeekHours } from "../appointments"

const PROJECTS: Project[] = [
  {
    id: "rahma-dental",
    name: "Rahma Family Dental",
    domain: "rahma-family-dental.get.space",
    plan: "Starter",
    installed: ["appointments", "payments", "crm", "campaigns", "reviews"],
    currency: "RM",
  },
  { id: "bakti-analisa", name: "Bakti Analisa Clinical Laboratory Penang", domain: "baktianalisa.my", plan: "Starter", installed: [], currency: "RM" },
]

const ME: Member = { name: "Aisyah Rahman", email: "aisyah@rahmadental.com", role: "Owner" }

const PEEKS: Record<string, Peeks> = {
  "rahma-dental": {
    appointments: {
      today: 6,
      next: [
        { time: "10:30", name: "Nur Aina", what: "Scaling and polishing" },
        { time: "11:15", name: "Daniel Tan", what: "Check-up" },
        { time: "14:00", name: "Siti Hajar", what: "Braces review" },
        { time: "15:30", name: "Arjun Pillai", what: "Filling" },
        { time: "16:45", name: "Mei Ling Ong", what: "Whitening consult" },
      ],
    },
    payments: {
      thisMonth: 4820,
      lastSevenDays: [320, 180, 640, 0, 410, 760, 290],
      pending: 2,
      recent: [
        { name: "Daniel Tan", amount: 150, what: "Check-up and X-ray" },
        { name: "Siti Hajar", amount: 290, what: "Braces instalment" },
        { name: "Farah Iskandar", amount: 50, what: "Booking deposit" },
      ],
    },
    reviews: {
      rating: 4.8,
      total: 126,
      newThisWeek: 3,
      latest: [
        { name: "Hafiz M.", stars: 5, text: "Dr. Aisyah explained everything before starting. My kids aren't scared of the dentist anymore." },
        { name: "Grace L.", stars: 5, text: "Booked online at night, got a reminder the day before. Easy." },
      ],
    },
    inbox: {
      unread: 4,
      recent: [
        { from: "Farah Iskandar", preview: "Hi, do you take walk-ins on Saturday morning?", when: "12m" },
        { from: "Kumar Raj", preview: "Can I change my appointment to next week?", when: "1h" },
        { from: "Website form", preview: "New enquiry: braces for a 12-year-old", when: "3h" },
      ],
    },
    contacts: { total: 1284, newThisWeek: 23, recent: ["Farah Iskandar", "Kumar Raj", "Lim Wei Jie", "Nadia Hassan"] },
    crm: {
      stages: [
        { name: "Enquiry", count: 12 },
        { name: "Consultation", count: 5 },
        { name: "In treatment", count: 8 },
        { name: "Recall due", count: 31 },
      ],
    },
    campaigns: {
      active: 2,
      list: [
        { name: "Six-month check-up reminder", openRate: 48, sent: 412 },
        { name: "School holiday kids' check-up", openRate: 36, sent: 188 },
      ],
    },
    todo: {
      open: 5,
      dueToday: 2,
      items: [
        { text: "Call back Mr. Lim about his implant estimate", due: "Today" },
        { text: "Reply to the Google review from Hafiz", due: "Today" },
        { text: "Order more fluoride varnish", due: "Fri" },
        { text: "Update Saturday opening hours on the website" },
      ],
    },
    drive: {
      usedGb: 3.2,
      totalGb: 10,
      files: 214,
      byType: [
        { label: "X-rays and scans", gb: 1.9 },
        { label: "Photos", gb: 0.8 },
        { label: "Documents", gb: 0.5 },
      ],
    },
    settings: { plan: "Starter", domain: "rahma-family-dental.get.space", seats: 4 },
  },
  "bakti-analisa": {
    inbox: { unread: 2, recent: [{ from: "Website form", preview: "Corporate screening quote for 40 staff", when: "2h" }] },
    contacts: { total: 0, newThisWeek: 0 },
    todo: { open: 0, dueToday: 0 },
    drive: { usedGb: 0.1, totalGb: 5, files: 6 },
    settings: { plan: "Starter", domain: "baktianalisa.my", seats: 1 },
  },
}

export async function getMe(): Promise<Member> {
  return ME
}

export async function listProjects(): Promise<Project[]> {
  return PROJECTS
}

/**
 * A project's id is its GoGetSpace site's id. A site published in this session isn't in the list above, so the mock
 * makes a fresh project for it (named after the id, nothing installed yet): what a brand-new account would see.
 */
export async function getProject(id?: string): Promise<Project> {
  if (!id) return PROJECTS[0]
  return (
    PROJECTS.find((p) => p.id === id) ?? {
      id,
      name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      domain: `${id}.get.space`,
      plan: "Free",
      installed: [],
      currency: "RM",
    }
  )
}

/** the numbers on each tile of a project's home screen */
export async function getPeeks(projectId: string): Promise<Peeks> {
  return PEEKS[projectId] ?? {}
}

/** the size and order of the widgets on a project's home screen; every widget is small, in the default order, until the person changes it */
export async function getHomeLayout(projectId: string): Promise<HomeLayout> {
  void projectId
  return { sizes: {} }
}

/* ---------- Appointments ---------- */

/**
 * The booking types the agent suggests from a site's services, by kind of business. In the real product the agent
 * derives them from the services it wrote for the site.
 */
export const SUGGESTED_TYPES: Record<"dentist" | "lawyer" | "general", BookingType[]> = {
  dentist: [
    { id: "checkup", name: "Check-up", minutes: 30, price: 80 },
    { id: "scaling", name: "Scaling and polishing", minutes: 45, price: 150 },
    { id: "filling", name: "Filling", minutes: 60 },
    { id: "braces", name: "Braces review", minutes: 30 },
    { id: "whitening", name: "Whitening consult", minutes: 30, price: 0 },
  ],
  lawyer: [
    { id: "initial", name: "First consultation", minutes: 60 },
    { id: "followup", name: "Follow-up meeting", minutes: 30 },
    { id: "review", name: "Document review", minutes: 45 },
    { id: "call", name: "Phone call", minutes: 15 },
  ],
  general: [
    { id: "meeting", name: "Meeting", minutes: 30 },
    { id: "long", name: "Long meeting", minutes: 60 },
  ],
}

const DENTAL_TYPES = SUGGESTED_TYPES.dentist

/**
 * A project's Appointments setup. `hoursFromLink` / `typesFromLink` are the availability and booking types the
 * GoGetSpace chat collected, passed in the Manage link for a site this mock doesn't know (a real app has them saved with the project already).
 */
export async function getAppointmentSettings(projectId: string, hoursFromLink?: WeekHours | null, typesFromLink?: BookingType[] | null): Promise<AppointmentSettings> {
  const project = await getProject(projectId)
  const known = projectId === "rahma-dental"
  return {
    hours: known ? HOURS_PRESETS[1].week : (hoursFromLink ?? null),
    types: known ? DENTAL_TYPES : (typesFromLink ?? SUGGESTED_TYPES.dentist),
    reminders: { email: true, sms: false, hoursBefore: 24, confirmation: true },
    slotMinutes: 15,
    noticeHours: 2,
    daysAhead: 60,
    bookingUrl: `https://${project.domain}/book`,
  }
}

const NAMES = ["Nur Aina", "Daniel Tan", "Siti Hajar", "Arjun Pillai", "Mei Ling Ong", "Farah Iskandar", "Kumar Raj", "Lim Wei Jie", "Nadia Hassan", "Hafiz Musa", "Grace Lee", "Aiman Zulkifli"]
const TODAY_RAHMA = [
  { start: "10:30", name: "Nur Aina", type: "Scaling and polishing" },
  { start: "11:15", name: "Daniel Tan", type: "Check-up" },
  { start: "14:00", name: "Siti Hajar", type: "Braces review" },
  { start: "15:30", name: "Arjun Pillai", type: "Filling" },
  { start: "16:45", name: "Mei Ling Ong", type: "Whitening consult" },
]

/** YYYY-MM-DD of a local date */
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/**
 * The bookings in the week starting `monday` (local dates). Made up from a seed so every week looks lived-in; today
 * matches the home screen's Appointments widget. Replace with a fetch of that week's bookings.
 */
export function weekBookings(projectId: string, monday: Date, hours: WeekHours | null, today = new Date()): Booking[] {
  if (projectId !== "rahma-dental" || !hours) return []
  const out: Booking[] = []
  const todayIso = isoDate(today)
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const date = isoDate(day)
    if (date === todayIso && hours[i].length) {
      TODAY_RAHMA.forEach((b, k) => {
        const t = DENTAL_TYPES.find((x) => x.name === b.type)!
        out.push({ id: `${date}-${k}`, date, start: b.start, minutes: t.minutes, name: b.name, type: t.name, status: k === 4 ? "pending" : "confirmed" })
      })
      continue
    }
    // mulberry32, seeded by the date
    let seed = Number(date.replace(/-/g, ""))
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
    for (const shift of hours[i]) {
      let t = toMinutes(shift.start)
      const end = toMinutes(shift.end)
      while (t < end) {
        const type = DENTAL_TYPES[Math.floor(rand() * DENTAL_TYPES.length)]
        if (t + type.minutes <= end && rand() < 0.5) {
          out.push({ id: `${date}-${t}`, date, start: fromMinutes(t), minutes: type.minutes, name: NAMES[Math.floor(rand() * NAMES.length)], type: type.name, status: rand() < 0.15 ? "pending" : "confirmed" })
          t += type.minutes
        } else t += 30
      }
    }
  }
  return out
}
export { getCrm } from "./crm"
