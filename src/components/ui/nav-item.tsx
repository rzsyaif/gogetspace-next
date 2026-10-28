import { forwardRef, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/cn"

/**
 * Row in a navigation list (dashboard sidebar, the editor's phone menu): icon + label, optional trailing slot.
 * `raised` is the primary entry ("New Website"); `collapsed` shows the icon only (pass `aria-label`).
 * Renders a Link with `href`, otherwise a button.
 */
export const NavItem = forwardRef<
  HTMLAnchorElement & HTMLButtonElement,
  {
    icon?: ReactNode
    label: ReactNode
    href?: string
    onClick?: () => void
    active?: boolean
    raised?: boolean
    collapsed?: boolean
    trailing?: ReactNode
    "aria-label"?: string
    className?: string
  }
>(function NavItem({ icon, label, href, onClick, active, raised, collapsed, trailing, className, ...rest }, ref) {
  const cls = cn(
    "flex w-full items-center gap-3 rounded-sm p-2 text-left type-body-sm text-fg-primary transition-colors focus-visible:outline-none focus-visible:focus-ring [&_svg]:size-6 [&_svg]:shrink-0",
    collapsed && "justify-center",
    raised ? "border border-line-default bg-surface shadow-block-sm hover:bg-subtle" : active ? "bg-muted" : "hover:bg-subtle",
    className,
  )
  const body = (
    <>
      {icon}
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && trailing}
    </>
  )
  return href ? (
    <Link ref={ref} href={href} onClick={onClick} aria-current={active ? "page" : undefined} className={cls} {...rest}>
      {body}
    </Link>
  ) : (
    <button ref={ref} type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={cls} {...rest}>
      {body}
    </button>
  )
})
