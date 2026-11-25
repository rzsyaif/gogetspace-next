"use client"

import { useState } from "react"
import { AlarmClock, Check, Mail, Phone } from "lucide-react"
import { Avatar, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, IconButton, Tooltip, iconButtonVariants } from "@gogetspace/baseplate"
import { followUps, type FollowUpReason } from "@gogetspace/modules"
import { cn } from "@gogetspace/baseplate/cn"
import { useCrm } from "./crm-store"
import { Value } from "./bits"

const REASON: Record<FollowUpReason, { label: string; tone: string }> = {
  overdue: { label: "Overdue", tone: "text-status-error-text" },
  due: { label: "Today", tone: "text-status-warning-text" },
  new: { label: "New", tone: "text-fg-link" },
  quiet: { label: "Quiet", tone: "text-fg-secondary" },
}

/**
 * Who to follow up, most urgent first (see `followUps`): overdue next steps, then today's, then new enquiries nobody
 * has answered, then the ones that went quiet. Each row has the quickest ways to act on it.
 */
export function FollowUps({ limit = 6 }: { limit?: number }) {
  const { data, now, markDone, snooze, setOpenClient } = useCrm()
  const [all, setAll] = useState(false)
  if (!data) return <div className="h-40 animate-pulse rounded-lg bg-subtle" />
  const list = followUps(data, now)
  if (!list.length)
    return (
      <p className="flex items-center gap-2 rounded-lg border border-line-default bg-surface px-4 py-3 type-body-md text-fg-secondary">
        <Check aria-hidden className="size-4 text-status-success-text" /> You&apos;re up to date. Nobody is waiting on you.
      </p>
    )
  const shown = all ? list : list.slice(0, limit)
  return (
    <div className="flex flex-col">
      <ul className="divide-y divide-line-default overflow-hidden rounded-lg border border-line-default bg-surface">
        {shown.map((f) => {
          const r = REASON[f.reason]
          return (
            <li key={f.enquiry.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setOpenClient(f.client.id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:focus-ring"
              >
                <Avatar name={f.client.name} size="sm" />
                <span className="flex min-w-0 flex-col">
                  <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="truncate type-label-md text-fg-primary">{f.client.name}</span>
                    <span className="truncate type-body-sm text-fg-tertiary">
                      {f.enquiry.title} · <Value e={f.enquiry} className="text-fg-tertiary" />
                    </span>
                  </span>
                  <span className="type-body-sm text-fg-secondary sm:truncate">
                    <span className={cn("font-medium", r.tone)}>{r.label}</span> · {f.why}
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-1 max-sm:w-full max-sm:justify-end">
                {f.client.phone && (
                  <Tooltip content={`Call ${f.client.phone}`}>
                    <a aria-label={`Call ${f.client.name}`} href={`tel:${f.client.phone.replace(/[^+\d]/g, "")}`} className={iconButtonVariants()}>
                      <Phone />
                    </a>
                  </Tooltip>
                )}
                {f.client.email && (
                  <Tooltip content={`Email ${f.client.email}`}>
                    <a aria-label={`Email ${f.client.name}`} href={`mailto:${f.client.email}`} className={iconButtonVariants()}>
                      <Mail />
                    </a>
                  </Tooltip>
                )}
                <DropdownMenu>
                  <Tooltip content="Snooze">
                    <DropdownMenuTrigger asChild>
                      <IconButton aria-label={`Snooze ${f.client.name}`}>
                        <AlarmClock />
                      </IconButton>
                    </DropdownMenuTrigger>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => snooze(f.enquiry.id, 1)}>Until tomorrow</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => snooze(f.enquiry.id, 3)}>For 3 days</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => snooze(f.enquiry.id, 7)}>For a week</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="secondary" leadingIcon={<Check />} onClick={() => markDone(f.enquiry.id)} className="ml-1">
                  Done
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      {list.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-2 w-fit rounded-sm px-1 py-1 type-label-md text-fg-link hover:bg-subtle focus-visible:outline-none focus-visible:focus-ring">
          {all ? "Show fewer" : `Show all ${list.length}`}
        </button>
      )}
    </div>
  )
}
