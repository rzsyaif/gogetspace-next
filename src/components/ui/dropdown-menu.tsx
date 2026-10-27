"use client"

import type { ComponentProps } from "react"
import { DropdownMenu as DM } from "radix-ui"
import { cn } from "@/lib/cn"

export const menuPanelClass = cn(
  "z-50 min-w-[220px] overflow-hidden rounded-lg border border-line-default bg-surface-raised p-1 shadow-soft-md",
  "origin-(--radix-popper-transform-origin) data-[state=open]:animate-[bp-pop-in_140ms_ease-out]",
)

export const menuItemClass = cn(
  "relative flex h-10 cursor-pointer select-none items-center gap-2 rounded-sm px-3 type-body-md text-fg-primary outline-none",
  "data-highlighted:bg-subtle data-disabled:pointer-events-none data-disabled:text-fg-disabled",
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-secondary",
)

export const DropdownMenu = DM.Root
export const DropdownMenuTrigger = DM.Trigger

export function DropdownMenuContent({ className, sideOffset = 8, ...props }: ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content sideOffset={sideOffset} className={cn(menuPanelClass, className)} {...props} />
    </DM.Portal>
  )
}

export function DropdownMenuItem({ className, tone, ...props }: ComponentProps<typeof DM.Item> & { tone?: "default" | "danger" }) {
  return (
    <DM.Item
      className={cn(menuItemClass, tone === "danger" && "text-status-error-text [&_svg]:text-status-error-text data-highlighted:bg-status-error-bg", className)}
      {...props}
    />
  )
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn("px-3 pb-1 pt-2 type-label-sm text-fg-tertiary", className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DM.Separator>) {
  return <DM.Separator className={cn("mx-1 my-1 h-px bg-line-default", className)} {...props} />
}
