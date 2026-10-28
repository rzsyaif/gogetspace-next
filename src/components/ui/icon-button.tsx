import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

/**
 * Quiet icon-only button for toolbars, panel headers and inline row actions (close, reload, zoom, more).
 * No block shadow — use `Button size="icon-*"` when the action should look like a button.
 * Always pass `aria-label`.
 */
const iconButtonVariants = cva(
  [
    "inline-grid shrink-0 place-items-center transition-colors duration-150",
    "focus-visible:outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:text-fg-disabled",
  ],
  {
    variants: {
      size: {
        xs: "size-6 [&_svg]:size-4",
        sm: "size-7 [&_svg]:size-4",
        md: "size-8 [&_svg]:size-4",
        lg: "size-10 [&_svg]:size-5",
      },
      shape: { square: "rounded-sm", round: "rounded-full" },
      tone: {
        default: "text-fg-secondary hover:bg-subtle hover:text-fg-primary",
        muted: "text-fg-tertiary hover:bg-subtle hover:text-fg-primary",
        /** on a grey (subtle) surface */
        onSubtle: "text-fg-tertiary hover:bg-muted hover:text-fg-primary",
        /** filled grey circle, e.g. a close button at the top of a sheet */
        filled: "bg-subtle text-fg-primary hover:bg-muted",
        /** on a dark overlay */
        onDark: "text-white hover:bg-white/10",
      },
    },
    defaultVariants: { size: "md", shape: "square", tone: "default" },
  },
)

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
  "aria-label": string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ size, shape, tone, className, type, ...props }, ref) {
  return <button ref={ref} type={type ?? "button"} className={cn(iconButtonVariants({ size, shape, tone }), className)} {...props} />
})

export { iconButtonVariants }
