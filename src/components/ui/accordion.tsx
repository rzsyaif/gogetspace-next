"use client"

import type { ComponentProps, ReactNode } from "react"
import { Accordion as A } from "radix-ui"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/cn"

/**
 * Collapsible sections. `type="single"` (with `collapsible`) keeps one open at a time, `type="multiple"` lets several
 * open. Leave out `defaultValue` to start collapsed.
 */
export const Accordion = A.Root

/** One bordered section; stack them in an Accordion with `flex flex-col gap-3`. */
export function AccordionItem({ className, ...props }: ComponentProps<typeof A.Item>) {
  return <A.Item className={cn("min-w-0 overflow-hidden rounded-xl border border-line-default bg-surface", className)} {...props} />
}

/** Header row that opens and closes the item; `meta` sits on the right before the chevron. */
export function AccordionTrigger({ children, meta, className, ...props }: ComponentProps<typeof A.Trigger> & { meta?: ReactNode }) {
  return (
    <A.Header className="flex">
      <A.Trigger
        className={cn(
          "group flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left type-label-md text-fg-primary transition-colors hover:bg-subtle",
          "focus-visible:outline-none focus-visible:focus-ring",
          className,
        )}
        {...props}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-tertiary">{children}</span>
        {meta && <span className="hidden min-w-0 truncate type-caption text-fg-tertiary sm:block">{meta}</span>}
        <ChevronDown aria-hidden className="size-5 shrink-0 text-fg-secondary transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </A.Trigger>
    </A.Header>
  )
}

export function AccordionContent({ className, children, ...props }: ComponentProps<typeof A.Content>) {
  return (
    <A.Content className="overflow-hidden data-[state=closed]:animate-[bp-accordion-up_200ms_ease-out] data-[state=open]:animate-[bp-accordion-down_250ms_ease-out]" {...props}>
      <div className={cn("border-t border-line-default p-3 sm:p-4", className)}>{children}</div>
    </A.Content>
  )
}
