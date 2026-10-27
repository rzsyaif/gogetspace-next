"use client"

import type { ComponentProps } from "react"
import { Tabs as T } from "radix-ui"
import { cn } from "@/lib/cn"

export const Tabs = T.Root

export function TabsList({ className, ...props }: ComponentProps<typeof T.List>) {
  return <T.List className={cn("inline-flex w-fit items-center gap-1 rounded-full bg-subtle p-1", className)} {...props} />
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-4 type-label-md text-fg-secondary transition-[background-color,color,box-shadow] duration-150",
        "hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring",
        "data-[state=active]:bg-surface data-[state=active]:text-fg-primary data-[state=active]:shadow-block-sm",
        "disabled:pointer-events-none disabled:text-fg-disabled [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("focus-visible:outline-none", className)} {...props} />
}
