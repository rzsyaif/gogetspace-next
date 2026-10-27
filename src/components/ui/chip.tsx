import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { cn } from "@/lib/cn"

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  selected?: boolean
}

/** Suggestion chip — pill with a small block shadow; used for prompt suggestions and filters. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ icon, selected, className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-[38px] items-center gap-1 rounded-full border px-3 type-label-md transition-[background-color,box-shadow,translate] duration-150",
        "shadow-[0_2px_0_0_var(--color-line-default)] active:translate-y-0.5 active:shadow-none",
        "focus-visible:outline-none focus-visible:shadow-[var(--bp-effect-focus-ring)]",
        "disabled:pointer-events-none disabled:text-fg-disabled disabled:shadow-none",
        "[&_svg]:size-4 [&_svg]:text-fg-brand",
        selected
          ? "border-blue-300 bg-accent-blue-subtle text-fg-link"
          : "border-line-default bg-action-secondary text-fg-primary hover:bg-action-secondary-hover",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
})
