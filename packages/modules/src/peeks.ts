import type { ToolId } from "./catalog"

/**
 * What each tool shows on its home-screen widget: a few live numbers, never the whole tool. Small widgets use the
 * headline figures; wide and large ones also show the lists.
 */
export interface PeekMap {
  appointments: { today: number; next: { time: string; name: string; what: string }[] }
  payments: { thisMonth: number; lastSevenDays: number[]; pending: number; recent?: { name: string; amount: number; what: string }[] }
  estimates: { open: number; awaitingReply: number; list?: { name: string; matter: string; amount?: number; status: "awaiting" | "draft" }[] }
  reviews: { rating: number; total: number; newThisWeek: number; latest?: { name: string; stars: number; text: string }[] }
  locations: { count: number; busiest: string; list?: { name: string; detail: string; status: "open" | "closing" | "closed" }[] }
  inbox: { unread: number; recent?: { from: string; preview: string; when: string }[] }
  contacts: { total: number; newThisWeek: number; recent?: string[] }
  crm: { stages: { name: string; count: number }[] }
  campaigns: { active: number; list?: { name: string; openRate: number; sent: number }[] }
  sequences: { running: number; enrolled: number; list?: { name: string; steps: number; people: number; sentToday: number }[] }
  broadcasts: { scheduled: number; next?: string; list?: { name: string; when: string; channel: string; audience: number }[] }
  /** `tickets` oldest first */
  helpdesk: { open: number; oldestHours: number; tickets?: { from: string; subject: string; when: string }[] }
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
  /** widgets in the order the person put them; tools not in it follow in the default order */
  order?: ToolId[]
}
