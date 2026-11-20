import type { ToolId } from "./catalog"

/** what each tool shows on its home-screen tile: a few live numbers, never the whole tool */
export interface PeekMap {
  appointments: { today: number; next: { time: string; name: string; what: string }[] }
  payments: { thisMonth: number; lastSevenDays: number[]; pending: number }
  estimates: { open: number; awaitingReply: number }
  reviews: { rating: number; total: number; newThisWeek: number }
  locations: { count: number; busiest: string }
  inbox: { unread: number; latest?: { from: string; preview: string; when: string } }
  contacts: { total: number; newThisWeek: number }
  crm: { stages: { name: string; count: number }[] }
  campaigns: { active: number; top?: { name: string; openRate: number } }
  sequences: { running: number; enrolled: number }
  broadcasts: { scheduled: number; next?: string }
  helpdesk: { open: number; oldestHours: number }
  todo: { open: number; dueToday: number; next?: string }
  drive: { usedGb: number; totalGb: number; files: number }
  settings: { plan: string; domain: string; seats: number }
}

export type Peek<T extends ToolId = ToolId> = PeekMap[T]
export type Peeks = Partial<{ [K in ToolId]: PeekMap[K] }>
