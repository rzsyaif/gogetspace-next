import {
  CalendarCheck,
  CreditCard,
  FileText,
  HardDrive,
  Inbox,
  KanbanSquare,
  LifeBuoy,
  MapPin,
  Megaphone,
  RadioTower,
  Repeat,
  Settings,
  SquareCheck,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Tool } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"

const ICONS: Record<string, LucideIcon> = {
  CalendarCheck, CreditCard, FileText, HardDrive, Inbox, KanbanSquare, LifeBuoy, MapPin, Megaphone, RadioTower, Repeat, Settings, SquareCheck, Star, Users,
}

const ACCENTS: Record<Tool["accent"], string> = {
  blue: "bg-accent-blue-subtle text-fg-link",
  green: "bg-status-success-bg text-status-success-text",
  yellow: "bg-status-warning-bg text-status-warning-text",
  coral: "bg-accent-coral-subtle text-status-error-text",
  neutral: "bg-subtle text-fg-secondary",
}

/** a tool's icon in its tinted square */
export function ToolIcon({ tool, size = "md" }: { tool: Tool; size?: "sm" | "md" }) {
  const Icon = ICONS[tool.icon] ?? SquareCheck
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-md", size === "md" ? "size-10" : "size-8", ACCENTS[tool.accent])}>
      <Icon className={size === "md" ? "size-5" : "size-4"} strokeWidth={2} />
    </span>
  )
}
