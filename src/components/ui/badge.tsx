import type { HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 type-label-sm whitespace-nowrap", {
  variants: {
    tone: { neutral: "", brand: "", success: "", warning: "", error: "" },
    look: { subtle: "", solid: "text-fg-on-action" },
  },
  compoundVariants: [
    { tone: "neutral", look: "subtle", className: "bg-subtle text-fg-secondary" },
    { tone: "brand", look: "subtle", className: "bg-accent-blue-subtle text-fg-link" },
    { tone: "success", look: "subtle", className: "bg-status-success-bg text-status-success-text" },
    { tone: "warning", look: "subtle", className: "bg-status-warning-bg text-status-warning-text" },
    { tone: "error", look: "subtle", className: "bg-status-error-bg text-status-error-text" },
    { tone: "neutral", look: "solid", className: "bg-inverse text-fg-inverse" },
    { tone: "brand", look: "solid", className: "bg-action-primary" },
    { tone: "success", look: "solid", className: "bg-status-success-solid" },
    { tone: "warning", look: "solid", className: "bg-status-warning-solid text-neutral-900" },
    { tone: "error", look: "solid", className: "bg-status-error-solid" },
  ],
  defaultVariants: { tone: "neutral", look: "subtle" },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Show the status dot (subtle badges only) */
  dot?: boolean
}

export function Badge({ className, tone, look, dot = true, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, look }), className)} {...props}>
      {dot && look !== "solid" && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
