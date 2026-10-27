"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/cn"

type Theme = "system" | "light" | "dark"
const STORAGE_KEY = "gogetspace-theme"

/** Runs before first paint so a saved theme never flashes. Without a saved choice, the OS setting applies via CSS. */
export function ThemeScript() {
  const js = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: js }}
    />
  )
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "system") delete root.dataset.theme
  else root.dataset.theme = theme
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* storage can be unavailable (private mode) — the in-page switch still works */
  }
}

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
]

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const saved = document.documentElement.dataset.theme
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with the value the inline script applied
    if (saved === "light" || saved === "dark") setTheme(saved)
  }, [])

  return (
    <div role="radiogroup" aria-label="Color theme" className={cn("inline-flex gap-1 rounded-full bg-subtle p-1", className)}>
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => {
            setTheme(value)
            applyTheme(value)
          }}
          className={cn(
            "grid size-8 place-items-center rounded-full text-fg-secondary transition-colors focus-visible:focus-ring",
            theme === value ? "bg-surface text-fg-primary shadow-block-sm" : "hover:text-fg-primary",
          )}
        >
          <Icon size={16} aria-hidden />
        </button>
      ))}
    </div>
  )
}
