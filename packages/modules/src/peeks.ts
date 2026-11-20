import type { ToolId } from "./catalog"

/**
 * What each tool shows on its home-screen widget: a few live numbers, never the whole tool. Small widgets use the
 * headline figures; wide and large ones also show the lists.
 */
export interface PeekMap {
  appointments: { today: number; next: { time: string; name: string; what: string }[] }
  payments: { thisMonth: number; lastSevenDays: number[]; pending: number; recent?: { name: string; amount: number; what: string }[] }
  estimates: { open: number; awaitingReply: number }
  reviews: { rating: number; total: number; newThisWeek: number; latest?: { name: string; stars: number; text: string }[] }
  locations: { count: number; busiest: string }
  inbox: { unread: number; recent?: { from: string; preview: string; when: string }[] }
  contacts: { total: number; newThisWeek: number; recent?: string[] }
  crm: { stages: { name: string; count: number }[] }
  campaigns: { active: number; list?: { name: string; openRate: number; sent: number }[] }
  sequences: { running: number; enrolled: number }
  broadcasts: { scheduled: number; next?: string }
  helpdesk: { open: number; oldestHours: number }
  todo: { open: number; dueToday: number; items?: { text: string; due?: string }[] }
  drive: { usedGb: number; totalGb: number; files: number; byType?: { label: string; gb: number }[] }
  settings: { plan: string; domain: string; seats: number }
}

export type Peek<T extends ToolId = ToolId> = PeekMap[T]
export type Peeks = Partial<{ [K in ToolId]: PeekMap[K] }>

/** home-screen widget sizes, in grid cells: small 1×1, wide 2×1, large 2×2 */
export type WidgetSize = "small" | "wide" | "large"

/** how a person arranged a project's home screen */
export interface HomeLayout {
  sizes: Partial<Record<ToolId, WidgetSize>>
}
