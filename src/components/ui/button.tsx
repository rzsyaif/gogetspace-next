import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

/**
 * Baseplate Button — Small / Medium / Large × Primary / Secondary / Ghost / Link / Destructive.
 * The "lego" block shadow sits under the button; pressing drops the button onto it.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md",
    "transition-[background-color,box-shadow,translate,color] duration-150 ease-out",
    "shadow-[0_var(--block)_0_0_var(--block-color)]",
    "focus-visible:outline-none focus-visible:shadow-[var(--bp-effect-focus-ring),0_var(--block)_0_0_var(--block-color)]",
    "active:translate-y-(--block) active:shadow-none",
    "disabled:pointer-events-none disabled:bg-action-disabled disabled:text-fg-disabled disabled:shadow-none disabled:border-transparent",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-action-primary text-fg-on-action [--block-color:var(--color-action-primary-base)] hover:bg-action-primary-hover active:bg-action-primary-pressed",
        secondary:
          "border border-line-strong bg-action-secondary text-fg-primary [--block-color:var(--color-action-secondary-base)] hover:bg-action-secondary-hover active:bg-action-secondary-pressed",
        ghost:
          "bg-transparent text-fg-brand [--block:0px] [--block-color:transparent] hover:bg-action-ghost-hover active:bg-action-ghost-pressed",
        /** inline text action, e.g. "Forgot password?" or a link inside a card */
        link: "bg-transparent text-fg-link underline-offset-4 [--block:0px] [--block-color:transparent] hover:underline",
        destructive:
          "bg-action-destructive text-fg-on-action [--block-color:var(--color-action-destructive-base)] hover:bg-action-destructive-hover active:bg-action-destructive-pressed",
      },
      size: {
        sm: "h-9 gap-1 px-3 type-label-md [--block:2px] [&_svg]:size-4",
        md: "h-11 gap-2 px-5 type-label-md [--block:4px] [&_svg]:size-5",
        lg: "h-14 gap-2 px-6 type-label-lg [--block:4px] [&_svg]:size-5",
        "icon-sm": "size-9 [--block:2px] [&_svg]:size-4",
        "icon-md": "size-11 [--block:4px] [&_svg]:size-5",
      },
    },
    compoundVariants: [
      { variant: "ghost", className: "[--block:0px]" },
      // links sit in running text: no box, just the label
      { variant: "link", className: "h-auto px-0 py-0 active:translate-y-0" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the child element (e.g. a Next.js Link) with button styling */
  asChild?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, leadingIcon, trailingIcon, children, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp ref={ref} type={asChild ? undefined : (type ?? "button")} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </Comp>
  )
})

export { buttonVariants }
