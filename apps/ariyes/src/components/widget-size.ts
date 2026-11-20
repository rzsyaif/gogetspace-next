"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"
import type { HomeLayout, ToolId, WidgetSize } from "@gogetspace/modules"

/**
 * Widget sizes a person picks, kept in this browser for the prototype (a real app saves them to the account).
 * Falls back to memory when storage is unavailable, so the picker still works in a private window.
 */
const EVENT = "ariyes-home-layout"
const memory = new Map<string, string>()
const keyFor = (projectId: string) => `ariyes-home-${projectId}`

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(EVENT, cb)
  }
}

export function useWidgetSizes(projectId: string, initial: HomeLayout["sizes"]) {
  const key = keyFor(projectId)
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null)
  const sizes = useMemo<HomeLayout["sizes"]>(() => {
    if (!raw) return initial
    try {
      return { ...initial, ...JSON.parse(raw) }
    } catch {
      return initial
    }
  }, [raw, initial])

  const setSize = useCallback(
    (tool: ToolId, size: WidgetSize) => {
      const next = JSON.stringify({ ...sizes, [tool]: size })
      memory.set(key, next)
      try {
        window.localStorage.setItem(key, next)
      } catch {}
      window.dispatchEvent(new Event(EVENT))
    },
    [key, sizes],
  )
  return [sizes, setSize] as const
}
