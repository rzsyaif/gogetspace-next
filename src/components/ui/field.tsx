"use client"

import { createContext, forwardRef, useContext, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/cn"

interface FieldCtx {
  id: string
  describedBy?: string
  invalid: boolean
}
const FieldContext = createContext<FieldCtx | null>(null)
export const useField = () => useContext(FieldContext)

/** Label + control + helper/error text, wired up for accessibility. */
export function Field({
  label,
  helper,
  error,
  className,
  children,
}: {
  label?: ReactNode
  helper?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactNode
}) {
  const id = useId()
  const helpId = `${id}-help`
  const message = error ?? helper
  return (
    <FieldContext.Provider value={{ id, describedBy: message ? helpId : undefined, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-2", className)}>
        {label && (
          <label htmlFor={id} className="type-label-md text-fg-primary">
            {label}
          </label>
        )}
        {children}
        {message && (
          <p id={helpId} className={cn("flex items-center gap-1.5 type-body-sm", error ? "text-status-error-text" : "text-fg-secondary")}>
            {error && <AlertCircle aria-hidden className="size-4 shrink-0" />}
            {message}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  )
}

/** Shared look for text-like controls (input, textarea, select trigger). */
export const fieldControl = cn(
  "w-full rounded-md border border-line-strong bg-surface type-body-md text-fg-primary",
  "placeholder:text-fg-tertiary transition-[border-color,box-shadow] duration-150",
  "hover:border-neutral-400",
  "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:shadow-[0_0_0_4px_var(--color-line-focus)]",
  "aria-invalid:border-status-error-solid aria-invalid:focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-status-error-solid)_16%,transparent)]",
  "disabled:cursor-not-allowed disabled:border-line-default disabled:bg-subtle disabled:text-fg-disabled",
)

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, leadingIcon, trailing, id, ...props }, ref) {
  const field = useField()
  return (
    <div className="relative flex items-center">
      {leadingIcon && <span className="pointer-events-none absolute left-4 text-fg-tertiary [&_svg]:size-5">{leadingIcon}</span>}
      <input
        ref={ref}
        id={id ?? field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        className={cn(fieldControl, "h-[50px] px-4", leadingIcon && "pl-11", trailing && "pr-11", className)}
        {...props}
      />
      {trailing && <span className="absolute right-3 flex items-center text-fg-tertiary [&_svg]:size-5">{trailing}</span>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, id, rows = 4, ...props }, ref) {
  const field = useField()
  return (
    <textarea
      ref={ref}
      id={id ?? field?.id}
      rows={rows}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      className={cn(fieldControl, "min-h-24 resize-y px-4 py-3", className)}
      {...props}
    />
  )
})
