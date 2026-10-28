"use client"

import type { ReactNode } from "react"
import { Dialog as D } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/cn"

/** Dimmed, blurred backdrop shared by every modal surface (dialogs, drawers, the review sheet). */
export const overlayClass =
  "fixed inset-0 z-50 bg-overlay-scrim backdrop-blur-[6px] data-[state=open]:animate-[bp-fade-in_160ms_ease-out] data-[state=closed]:animate-[bp-fade-out_200ms_ease-in]"

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

/** Baseplate Modal: 480px, raised surface, block shadow, header / content / footer. */
export function DialogContent({
  title,
  description,
  footer,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlayClass} />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-auto",
          "rounded-xl bg-surface-raised shadow-block-md focus:outline-none data-[state=open]:animate-[bp-dialog-in_200ms_cubic-bezier(0.2,0.9,0.3,1.2)]",
          className,
        )}
      >
        <div className="flex items-start gap-3 px-6 pb-2 pt-6">
          <div className="flex flex-1 flex-col gap-2">
            <D.Title className="type-h4 text-fg-primary">{title}</D.Title>
            {description ? <D.Description className="type-body-md text-fg-secondary">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close aria-label="Close" className="-mr-1 grid size-8 place-items-center rounded-sm text-fg-secondary hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
            <X aria-hidden className="size-5" />
          </D.Close>
        </div>
        {children && <div className="flex flex-col gap-4 px-6 pb-2 pt-4">{children}</div>}
        {footer && <div className="flex justify-end gap-3 p-6">{footer}</div>}
      </D.Content>
    </D.Portal>
  )
}
