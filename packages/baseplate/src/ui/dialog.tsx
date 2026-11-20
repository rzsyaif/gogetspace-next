"use client"

import type { ReactNode } from "react"
import { Dialog as D } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "../cn"

/** Dimmed, blurred backdrop shared by every modal surface (dialogs, drawers, the review sheet). */
export const overlayClass =
  "fixed inset-0 z-50 bg-overlay-scrim backdrop-blur-[6px] data-[state=open]:animate-[bp-fade-in_160ms_ease-out] data-[state=closed]:animate-[bp-fade-out_150ms_var(--ease-out)]"

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

/**
 * Baseplate Modal: 480px, raised surface, block shadow. The header and footer stay put and only the content
 * scrolls. On phones every modal is a bottom sheet: full width from the bottom edge, same fixed header and footer.
 * `scroll={false}` hands scrolling to the content itself (for layouts with their own fixed parts).
 */
export function DialogContent({
  title,
  description,
  footer,
  children,
  className,
  scroll = true,
}: {
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string
  scroll?: boolean
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlayClass} />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
          "rounded-xl bg-surface-raised shadow-block-md focus:outline-none data-[state=open]:animate-[bp-dialog-in_200ms_cubic-bezier(0.2,0.9,0.3,1.2)]",
          // phones: a bottom sheet
          "max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[calc(100dvh-40px)] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)] max-sm:data-[state=open]:animate-[bp-sheet-up_320ms_var(--ease-drawer)] max-sm:data-[state=closed]:animate-[bp-sheet-down_200ms_var(--ease-out)]",
          className,
        )}
      >
        <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
        <div className="flex shrink-0 items-start gap-3 px-6 pb-2 pt-6 max-sm:px-4 max-sm:pt-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <D.Title className="type-h4 text-fg-primary">{title}</D.Title>
            {description ? <D.Description className="type-body-md text-fg-secondary">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close aria-label="Close" className="-mr-1 grid size-8 shrink-0 place-items-center rounded-sm text-fg-secondary hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
            <X aria-hidden className="size-5" />
          </D.Close>
        </div>
        {children && (
          <div className={cn("flex min-h-0 flex-1 flex-col gap-4 px-6 pb-2 pt-4 max-sm:px-4", scroll ? "overflow-y-auto overscroll-contain" : "overflow-hidden")}>{children}</div>
        )}
        {footer && <div className="flex shrink-0 justify-end gap-3 border-t border-line-default bg-surface-raised p-6 max-sm:px-4 max-sm:py-4">{footer}</div>}
      </D.Content>
    </D.Portal>
  )
}
