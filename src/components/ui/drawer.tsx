"use client"

import type { ReactNode } from "react"
import { Dialog as D } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/cn"
import { IconButton } from "./icon-button"

export const Drawer = D.Root
export const DrawerTrigger = D.Trigger
export const DrawerClose = D.Close

/** Panel that slides in from the side of the screen — e.g. the editor's navigation menu on phones. */
export function DrawerContent({
  title,
  side = "right",
  header,
  footer,
  children,
  className,
}: {
  /** accessible name; shown as the header unless `header` replaces it */
  title: string
  side?: "left" | "right"
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-overlay-scrim data-[state=closed]:animate-[bp-fade-out_200ms_ease-in] data-[state=open]:animate-[bp-fade-in_160ms_ease-out]" />
      <D.Content
        aria-describedby={undefined}
        style={{ "--drawer-from": side === "right" ? "100%" : "-100%" } as React.CSSProperties}
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(320px,calc(100vw-48px))] flex-col bg-surface-raised shadow-soft-lg focus:outline-none",
          "data-[state=open]:animate-[bp-drawer-in_260ms_cubic-bezier(0.2,0.9,0.3,1)] data-[state=closed]:animate-[bp-drawer-out_200ms_ease-in]",
          side === "right" ? "right-0 rounded-l-xl" : "left-0 rounded-r-xl",
          className,
        )}
      >
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="min-w-0 flex-1">{header ?? <D.Title className="type-h5 text-fg-primary">{title}</D.Title>}</div>
          {header && <D.Title className="sr-only">{title}</D.Title>}
          <D.Close asChild>
            <IconButton aria-label="Close menu" size="lg" shape="round">
              <X />
            </IconButton>
          </D.Close>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2">{children}</div>
        {footer && <div className="border-t border-line-default p-4">{footer}</div>}
      </D.Content>
    </D.Portal>
  )
}
