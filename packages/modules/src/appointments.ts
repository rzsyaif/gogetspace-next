/**
 * The Appointments module's data: when the practice takes bookings, what can be booked, and the reminders.
 * GoGetSpace's agent asks for the opening hours while building; everything else it sets up on its own (booking
 * types from the services, slot length, reminders). Ariyes is where the owner sees and changes it.
 */

/** a block of bookable time in a day, 24h "HH:MM" */
export interface Shift {
  start: string
  end: string
}

/** Monday first: week[0] is Monday … week[6] is Sunday; an empty day is closed */
export type WeekHours = Shift[][]

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

const d = (start: string, end: string): Shift[] => [{ start, end }]
const closed: Shift[] = []

/** the common shapes of a practice's week, offered as one-tap answers */
export const HOURS_PRESETS: { id: string; label: string; week: WeekHours }[] = [
  { id: "weekdays", label: "Weekdays, 9am–5pm", week: [d("09:00", "17:00"), d("09:00", "17:00"), d("09:00", "17:00"), d("09:00", "17:00"), d("09:00", "17:00"), closed, closed] },
  {
    id: "weekdays-lunch",
    label: "Weekdays with a lunch break, and Saturday mornings",
    week: [
      ...Array.from({ length: 5 }, () => [
        { start: "09:00", end: "13:00" },
        { start: "14:00", end: "18:00" },
      ]),
      d("09:00", "13:00"),
      closed,
    ],
  },
  { id: "six-days", label: "Monday to Saturday, 9am–6pm", week: [...Array.from({ length: 6 }, () => d("09:00", "18:00")), closed] },
  { id: "every-day", label: "Every day, 10am–8pm", week: Array.from({ length: 7 }, () => d("10:00", "20:00")) },
]

/** "09:00" → minutes since midnight */
export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}
/** minutes since midnight → "09:00" */
export const fromMinutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`

/** "09:00" → "9am", "13:30" → "1:30pm" */
export function formatTime(t: string) {
  const m = toMinutes(t)
  if (m >= 24 * 60) return "midnight"
  const h = Math.floor(m / 60), min = m % 60
  const h12 = ((h + 11) % 12) + 1
  return `${h12}${min ? `:${String(min).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`
}

const shiftsText = (shifts: Shift[]) => [...shifts].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)).map((s) => `${formatTime(s.start)}–${formatTime(s.end)}`).join(", ")

/** a week in one line, grouping days with the same hours: "Mon–Fri 9am–5pm · Sat 9am–1pm · Sun closed" */
export function describeWeek(week: WeekHours): string {
  const parts: string[] = []
  let i = 0
  while (i < 7) {
    const key = JSON.stringify(week[i])
    let j = i
    while (j + 1 < 7 && JSON.stringify(week[j + 1]) === key) j++
    const days = i === j ? WEEKDAYS_SHORT[i] : `${WEEKDAYS_SHORT[i]}–${WEEKDAYS_SHORT[j]}`
    parts.push(week[i].length ? `${days} ${shiftsText(week[i])}` : `${days} unavailable`)
    i = j + 1
  }
  return parts.join(" · ")
}

/** compact, URL-safe: "0-0900-1300.1400-1800_1-…" for days with hours (closed days left out) */
export function encodeWeek(week: WeekHours): string {
  return week
    .map((shifts, i) => (shifts.length ? `${i}-${shifts.map((s) => `${s.start.replace(":", "")}-${s.end.replace(":", "")}`).join(".")}` : ""))
    .filter(Boolean)
    .join("_")
}

export function decodeWeek(code: string): WeekHours | null {
  const week: WeekHours = Array.from({ length: 7 }, () => [])
  const t = (x: string) => (/^\d{4}$/.test(x) ? `${x.slice(0, 2)}:${x.slice(2)}` : null)
  for (const part of code.split("_")) {
    const [day, ...rest] = part.split("-")
    const i = Number(day)
    if (!(i >= 0 && i < 7)) return null
    const pairs = rest.join("-").split(".")
    for (const p of pairs) {
      const [a, b] = p.split("-").map(t)
      if (!a || !b || toMinutes(a) >= toMinutes(b)) return null
      week[i].push({ start: a, end: b })
    }
  }
  return week
}

/** what a patient or client can book, and how long it takes */
export interface BookingType {
  id: string
  name: string
  minutes: number
  /** shown on the booking page; empty when the price depends on the case */
  price?: number
}

export interface ReminderSettings {
  email: boolean
  sms: boolean
  /** how long before the appointment the reminder goes out */
  hoursBefore: number
  /** a confirmation right after booking */
  confirmation: boolean
}

export interface AppointmentSettings {
  /** null until the owner says when they take bookings (asked in the GoGetSpace chat, or on first visit to Ariyes) */
  hours: WeekHours | null
  types: BookingType[]
  reminders: ReminderSettings
  /** the length of each bookable slot */
  slotMinutes: number
  /** the earliest a booking can be made, before it starts */
  noticeHours: number
  /** how far ahead people can book */
  daysAhead: number
  /** the public booking page on the website */
  bookingUrl: string
}

export interface Booking {
  id: string
  /** YYYY-MM-DD, in the practice's time zone */
  date: string
  start: string
  minutes: number
  name: string
  type: string
  status: "confirmed" | "pending"
}

/** a booking type's length for people: "30 min", "1 h", "1 h 30 min" */
export const formatLength = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`)

/** the lengths a booking type can have */
export const TYPE_LENGTHS = [15, 20, 30, 45, 60, 90, 120]

/** "Check-up 30 min, Filling 1 h and 2 more" */
export function describeTypes(types: BookingType[], max = 3) {
  const shown = types.slice(0, max).map((t) => `${t.name} ${formatLength(t.minutes)}`)
  const rest = types.length - shown.length
  return rest > 0 ? `${shown.join(", ")} and ${rest} more` : shown.join(", ")
}

/** booking types in a link: "Check-up~30|Filling~60" (names URI-encoded) */
export const encodeTypes = (types: BookingType[]) => types.map((t) => `${encodeURIComponent(t.name)}~${t.minutes}`).join("|")

export function decodeTypes(code: string): BookingType[] | null {
  const out: BookingType[] = []
  for (const [i, part] of code.split("|").entries()) {
    const [name, min] = part.split("~")
    const minutes = Number(min)
    let n = ""
    try {
      n = decodeURIComponent(name ?? "").trim()
    } catch {
      return null
    }
    if (!n || !(minutes > 0 && minutes <= 480)) return null
    out.push({ id: `t${i}`, name: n.slice(0, 80), minutes })
  }
  return out.length ? out : null
}

/** a booking's reference for people, stable for its id: "APT-48213" (a real system stores its own) */
export function bookingRef(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `APT-${String(10000 + (h % 90000))}`
}
