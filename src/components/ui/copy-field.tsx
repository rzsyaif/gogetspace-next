"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/cn"

/** Copy text, falling back to a hidden textarea where the Clipboard API isn't allowed. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    return ok
  }
}

/**
 * A value people need to paste somewhere else (DNS record, API key, link): monospace text with a copy button that
 * confirms with a check. `label` names it for screen readers ("Copy CNAME value").
 */
export function CopyField({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className={cn("flex min-w-0 items-center gap-1 rounded-sm border border-line-default bg-surface py-1 pr-1 pl-3", className)}>
      <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-fg-primary" title={value}>
        {value}
      </code>
      <button
        type="button"
        aria-label={copied ? `${label} copied` : label}
        onClick={async () => {
          if (await copyText(value)) {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          }
        }}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-sm transition-colors focus-visible:outline-none focus-visible:focus-ring [&_svg]:size-4",
          copied ? "text-status-success-text" : "text-fg-secondary hover:bg-subtle hover:text-fg-primary",
        )}
      >
        {copied ? <Check /> : <Copy />}
      </button>
    </span>
  )
}
