import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

/** Hairline separator; with children it becomes a labelled break ("or with email"). */
export function Divider({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return <hr className={cn("border-line-default", className)} />
  return (
    <div role="separator" className={cn("flex items-center gap-3 type-caption text-fg-tertiary", className)}>
      <span className="h-px flex-1 bg-line-default" />
      {children}
      <span className="h-px flex-1 bg-line-default" />
    </div>
  )
}
