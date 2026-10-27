"use client"

import type { ReactNode } from "react"
import { Tooltip as T } from "radix-ui"

export const TooltipProvider = T.Provider

export function Tooltip({
  content,
  side = "top",
  children,
}: {
  content: ReactNode
  side?: "top" | "bottom" | "left" | "right"
  children: ReactNode
}) {
  return (
    <T.Root delayDuration={300}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-64 rounded-sm bg-inverse px-3 py-2 type-body-sm text-fg-inverse shadow-soft-sm data-[state=delayed-open]:animate-[bp-fade-in_120ms_ease-out]"
        >
          {content}
          <T.Arrow width={12} height={6} className="fill-inverse" />
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}
