import { toMinutes, fromMinutes, type AppointmentSettings, type Booking } from "@gogetspace/modules"
import { isoDate, weekBookings } from "@gogetspace/modules/mock"

/** what the owner changed: a booking's new version (or a new booking), or that it was cancelled */
export type Edits = Record<string, Booking | "cancelled">

export const mondayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const fromIso = (iso: string) => new Date(`${iso}T00:00`)

/**
 * The calendar's rules, shared by Appointments and the CRM's "Book an appointment": which bookings a week has (with
 * the owner's edits and new bookings), whether a booking fits somewhere, and the free start times on a day.
 */
export function schedule(projectId: string, settings: AppointmentSettings, edits: Edits, now: Date) {
  const hours = settings.hours

  /** the bookings in the week starting `mon`, with edits applied */
  const inWeek = (mon: Date): Booking[] => {
    if (!hours) return []
    const dates = new Set(Array.from({ length: 7 }, (_, i) => isoDate(addDays(mon, i))))
    const changed = Object.values(edits).filter((e): e is Booking => e !== "cancelled" && dates.has(e.date))
    return [...weekBookings(projectId, mon, hours, now).filter((b) => !(b.id in edits)), ...changed]
  }

  /** inside availability, not in the past, and not overlapping another booking */
  const canPlace = (b: Pick<Booking, "id" | "minutes">, date: string, start: string) => {
    if (!hours) return false
    const from = toMinutes(start)
    const to = from + b.minutes
    const d = fromIso(date)
    if (!hours[(d.getDay() + 6) % 7].some((s) => toMinutes(s.start) <= from && to <= toMinutes(s.end))) return false
    if (new Date(`${date}T${start}`) <= now) return false
    return !inWeek(mondayOf(d)).some((o) => o.id !== b.id && o.date === date && toMinutes(o.start) < to && from < toMinutes(o.start) + o.minutes)
  }

  /** free start times on `date` (a booking's own time counts as free, so it can be shown as current) */
  const freeSlots = (b: Pick<Booking, "id" | "minutes"> & Partial<Pick<Booking, "date" | "start">>, date: string) => {
    if (!hours) return []
    const out: string[] = []
    for (const s of hours[(fromIso(date).getDay() + 6) % 7])
      for (let t = toMinutes(s.start); t + b.minutes <= toMinutes(s.end); t += settings.slotMinutes) if (canPlace(b, date, fromMinutes(t)) || (date === b.date && fromMinutes(t) === b.start)) out.push(fromMinutes(t))
    return out.sort()
  }

  /** the next days (up to 4 weeks, within "book up to") with a free time other than the booking's own */
  const freeDays = (b: Pick<Booking, "id" | "minutes"> & Partial<Pick<Booking, "date" | "start">>) =>
    Array.from({ length: Math.min(settings.daysAhead, 28) }, (_, i) => isoDate(addDays(now, i))).filter((d) => freeSlots(b, d).some((t) => d !== b.date || t !== b.start))

  /** someone's coming bookings, soonest first, looking `weeks` ahead */
  const upcomingFor = (name: string, weeks = 3) => {
    const key = name.trim().toLowerCase()
    const out: Booking[] = []
    for (let w = 0; w < weeks; w++) out.push(...inWeek(addDays(mondayOf(now), w * 7)).filter((b) => b.name.toLowerCase() === key && new Date(`${b.date}T${b.start}`) > now))
    return out.sort((a, b) => (`${a.date}${a.start}` < `${b.date}${b.start}` ? -1 : 1))
  }

  return { inWeek, canPlace, freeSlots, freeDays, upcomingFor }
}
