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

const GLYPH_TONES: Record<Tool["accent"], string> = {
  blue: "text-fg-link",
  green: "text-status-success-text",
  yellow: "text-status-warning-text",
  coral: "text-status-error-text",
  neutral: "text-fg-secondary",
}

/** a tool's icon as a widget shows it: large, with a hairline (0.75px) stroke */
export function ToolGlyph({ tool, className }: { tool: Tool; className?: string }) {
  const Icon = ICONS[tool.icon] ?? SquareCheck
  return <Icon aria-hidden absoluteStrokeWidth strokeWidth={0.75} className={cn("size-8 shrink-0", GLYPH_TONES[tool.accent], className)} />
}
