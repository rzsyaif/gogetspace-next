import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { cn } from "../cn"

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  selected?: boolean
  /** an empty slot to fill in: dashed outline, no block shadow, compact */
  variant?: "suggestion" | "add"
}

/** Suggestion chip — pill with a small block shadow; used for prompt suggestions and filters. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ icon, selected, variant = "suggestion", className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={variant === "add" ? undefined : selected}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 focus-visible:outline-none focus-visible:shadow-[var(--bp-effect-focus-ring)] disabled:pointer-events-none disabled:text-fg-disabled disabled:shadow-none",
        variant === "add"
          ? cn(
              "h-8 border-dashed type-label-sm transition-[color,border-color,background-color,scale] duration-150 ease-out active:scale-[0.97] [&_svg]:size-3.5",
              selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900",
            )
          : cn(
              "h-[38px] type-label-md transition-[background-color,box-shadow,translate] duration-150",
              "shadow-[0_2px_0_0_var(--color-line-default)] active:translate-y-0.5 active:shadow-none",
              "[&_svg]:size-4 [&_svg]:text-fg-brand",
              selected
                ? "border-blue-300 bg-accent-blue-subtle text-fg-link"
                : "border-line-default bg-action-secondary text-fg-primary hover:bg-action-secondary-hover",
            ),
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
})
