"use client"

import { useId, type ReactNode } from "react"
import { Checkbox as CB, Switch as SW } from "radix-ui"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/cn"

type CheckedState = boolean | "indeterminate"

export function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: {
  label: ReactNode
  description?: ReactNode
  checked?: CheckedState
  defaultChecked?: CheckedState
  onCheckedChange?: (checked: CheckedState) => void
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn("flex items-start gap-3", disabled && "opacity-60", className)}>
      <CB.Root
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "group mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border-2 border-line-strong bg-surface transition-colors",
          "hover:border-neutral-400 focus-visible:outline-none focus-visible:focus-ring",
          "data-[state=checked]:border-transparent data-[state=checked]:bg-action-primary data-[state=checked]:shadow-[0_2px_0_0_var(--color-action-primary-base)]",
          "data-[state=indeterminate]:border-transparent data-[state=indeterminate]:bg-action-primary",
        )}
      >
        <CB.Indicator className="text-fg-on-action">
          <Check aria-hidden strokeWidth={3} className="size-3.5 group-data-[state=indeterminate]:hidden" />
          <Minus aria-hidden strokeWidth={3} className="hidden size-3.5 group-data-[state=indeterminate]:block" />
        </CB.Indicator>
      </CB.Root>
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className="type-body-md text-fg-primary">{label}</span>
        {description && <span className="type-body-sm text-fg-secondary">{description}</span>}
      </label>
    </div>
  )
}

export function Switch({
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: {
  label?: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn("flex items-center gap-3", disabled && "opacity-60", className)}>
      <SW.Root
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={typeof label === "string" ? undefined : "Toggle"}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full bg-muted p-0.5 transition-colors duration-200",
          "focus-visible:outline-none focus-visible:focus-ring data-[state=checked]:bg-action-primary",
        )}
      >
        <SW.Thumb className="block size-5 rounded-full bg-surface shadow-soft-sm transition-transform duration-200 ease-out data-[state=checked]:translate-x-5" />
      </SW.Root>
      {label && (
        <label htmlFor={id} className="cursor-pointer type-body-md text-fg-primary">
          {label}
        </label>
      )}
    </div>
  )
}

/** The round radio marker on its own — for custom radio cards (e.g. style options) that handle selection themselves. */
export function RadioDot({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2 bg-surface transition-colors", checked ? "border-blue-500" : "border-line-strong", className)}>
      {checked && <span className="size-2.5 rounded-full bg-blue-500" />}
    </span>
  )
}

/** A bordered choice in a radio group: title, optional description, and extra content shown under it. */
export function RadioCard({
  name,
  checked,
  onChange,
  title,
  description,
  children,
  className,
}: {
  name: string
  checked: boolean
  onChange: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors has-focus-visible:focus-ring",
        checked ? "border-blue-500 bg-accent-blue-subtle/40" : "border-line-default hover:border-line-strong",
        className,
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <RadioDot checked={checked} className="mt-0.5" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-label-md text-fg-primary">{title}</span>
        {description && <span className="type-body-sm text-fg-secondary">{description}</span>}
        {children}
      </span>
    </label>
  )
}
