import { forwardRef, type ButtonHTMLAttributes, type FormHTMLAttributes, type ReactNode } from "react"
import { ArrowUp, Plus, X } from "lucide-react"
import { cn } from "@/lib/cn"

/**
 * The app's message box (chat input, "create your own style"): a form with the block shadow and a blue focus ring.
 * Compose it from `PromptAttachButton`, an input, and `PromptSendButton`; attached files show as `AttachmentChip`s.
 */
export const PromptBox = forwardRef<HTMLFormElement, FormHTMLAttributes<HTMLFormElement> & { size?: "sm" | "md" }>(function PromptBox(
  { size = "md", className, ...props },
  ref,
) {
  return (
    <form
      ref={ref}
      className={cn(
        "relative flex flex-col rounded-xl border border-line-strong bg-surface shadow-[0_4px_0_0_var(--color-shadow-block)]",
        "focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_var(--color-blue-100),0_4px_0_0_var(--color-blue-800)]",
        size === "sm" ? "gap-3 px-4 py-3 sm:px-5 sm:py-4" : "gap-4 px-5 py-4",
        className,
      )}
      {...props}
    />
  )
})

export const PromptAttachButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function PromptAttachButton(
  { className, "aria-label": label = "Attach files", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-md bg-subtle text-fg-secondary transition-colors hover:bg-muted",
        "focus-visible:outline-none focus-visible:focus-ring disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Plus className="size-5" />
    </button>
  )
})

/** Blue send button; greyed out until there's something to send. */
export const PromptSendButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }>(function PromptSendButton(
  { className, icon, "aria-label": label = "Send", type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "submit"}
      aria-label={label}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-md bg-blue-500 text-white shadow-[0_2px_0_0_var(--color-blue-800)] transition-colors",
        "active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:focus-ring",
        "disabled:bg-action-disabled disabled:text-fg-disabled disabled:shadow-none",
        className,
      )}
      {...props}
    >
      {icon ?? <ArrowUp className="size-5" />}
    </button>
  )
})

/** A file attached to a message, with a remove button. */
export function AttachmentChip({ icon, name, onRemove, className }: { icon?: ReactNode; name: string; onRemove?: () => void; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 rounded-md border border-line-default bg-subtle py-1 pr-1 pl-2 type-body-sm text-fg-primary [&>svg]:size-4 [&>svg]:text-fg-tertiary", !onRemove && "pr-2", className)}>
      {icon}
      <span className="truncate">{name}</span>
      {onRemove && (
        <button type="button" aria-label={`Remove ${name}`} onClick={onRemove} className="grid size-6 shrink-0 place-items-center rounded-sm hover:bg-muted focus-visible:outline-none focus-visible:focus-ring">
          <X className="size-3.5" />
        </button>
      )}
    </span>
  )
}
