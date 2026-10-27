import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/cn"

/** Baseplate Card: surface, 1px border, 16px radius, block shadow. `interactive` adds the hover lift. */
export function Card({ interactive, selected, className, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; selected?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-surface shadow-block-md",
        selected ? "border-2 border-blue-500 shadow-[0_4px_0_0_var(--color-blue-200)]" : "border-line-default",
        interactive && "transition-[translate,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-block-lg",
        className,
      )}
      {...props}
    />
  )
}

/** Blue block covered in lego studs — the default media for template and empty-state cards. */
export function StudsMedia({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn("relative grid h-40 place-items-center bg-accent-blue text-white/60", className)}>
      <div aria-hidden className="studs absolute inset-x-6 inset-y-4" />
      {children && <div className="relative">{children}</div>}
    </div>
  )
}
