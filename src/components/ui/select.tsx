"use client"

import type { ReactNode } from "react"
import { Select as S } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/cn"
import { fieldControl, useField } from "./field"
import { menuItemClass, menuPanelClass } from "./dropdown-menu"

export interface SelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export function Select({
  options,
  placeholder = "Choose one",
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: {
  options: SelectOption[]
  placeholder?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
}) {
  const field = useField()
  return (
    <S.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
      <S.Trigger
        id={field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        className={cn(fieldControl, "flex h-[50px] items-center justify-between gap-2 px-4 text-left data-placeholder:text-fg-tertiary", className)}
      >
        <S.Value placeholder={placeholder} />
        <S.Icon asChild>
          <ChevronDown aria-hidden className="size-5 shrink-0 text-fg-secondary" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={8} className={cn(menuPanelClass, "w-(--radix-select-trigger-width) max-h-(--radix-select-content-available-height)")}>
          <S.Viewport>
            {options.map((o) => (
              <S.Item key={o.value} value={o.value} disabled={o.disabled} className={cn(menuItemClass, "data-[state=checked]:bg-accent-blue-subtle data-[state=checked]:text-fg-link")}>
                <S.ItemText>{o.label}</S.ItemText>
                <S.ItemIndicator className="ml-auto">
                  <Check aria-hidden className="size-4" />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  )
}
