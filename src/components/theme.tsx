"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/cn"

type Theme = "system" | "light" | "dark"
const STORAGE_KEY = "gogetspace-theme"

/**
 * Runs before first paint so the theme never flashes. Light is the default; dark only when the person picked
 * "Dark", or picked "System" and their OS is dark (then it follows OS changes live).
 */
export function ThemeScript() {
  const js = `try{var r=document.documentElement,t=localStorage.getItem("${STORAGE_KEY}");if(t==="dark")r.dataset.theme="dark";else if(t==="system"){var m=matchMedia("(prefers-color-scheme: dark)"),f=function(){r.dataset.theme=m.matches?"dark":"light"};f();m.addEventListener("change",f)}}catch(e){}`
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: js }}
    />
  )
}

let systemListener: (() => void) | null = null

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  if (systemListener) mq.removeEventListener("change", systemListener)
  systemListener = null
  if (theme === "system") {
    systemListener = () => (root.dataset.theme = mq.matches ? "dark" : "light")
    systemListener()
    mq.addEventListener("change", systemListener)
  } else if (theme === "dark") root.dataset.theme = "dark"
  else delete root.dataset.theme
  try {
    if (theme === "light") localStorage.removeItem(STORAGE_KEY)
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
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with the choice the inline script applied
    if (saved === "system" || saved === "dark") setTheme(saved)
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
