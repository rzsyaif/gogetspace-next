/**
 * MOCK DATA. The prototype reads everything through these functions; replace their bodies with real API calls
 * and the screens stay the same. Each one is async on purpose, so the shape already matches a fetch.
 */
import type { Member, Project } from "../project"
import type { HomeLayout, Peeks } from "../peeks"

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
