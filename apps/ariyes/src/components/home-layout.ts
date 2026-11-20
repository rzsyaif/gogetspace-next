"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"
import type { HomeLayout, ToolId, WidgetSize } from "@gogetspace/modules"

/**
 * The home-screen layout a person makes (widget sizes and order), kept in this browser for the prototype (a real
 * app saves it to the account). Falls back to memory when storage is unavailable, so Customize still works in a
 * private window.
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

export function useHomeLayout(projectId: string, initial: HomeLayout) {
  const key = keyFor(projectId)
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null)
  const layout = useMemo<HomeLayout>(() => {
    if (!raw) return initial
    try {
      const saved = JSON.parse(raw)
      // the first version saved only the sizes, as a plain object
      return "sizes" in saved ? { ...initial, ...saved, sizes: { ...initial.sizes, ...saved.sizes } } : { ...initial, sizes: { ...initial.sizes, ...saved } }
    } catch {
      return initial
    }
  }, [raw, initial])

  const save = useCallback(
    (next: HomeLayout) => {
      const value = JSON.stringify(next)
      memory.set(key, value)
      try {
        window.localStorage.setItem(key, value)
      } catch {}
      window.dispatchEvent(new Event(EVENT))
    },
    [key],
  )
  const setSize = useCallback((tool: ToolId, size: WidgetSize) => save({ ...layout, sizes: { ...layout.sizes, [tool]: size } }), [layout, save])
  const setOrder = useCallback((order: ToolId[]) => save({ ...layout, order }), [layout, save])
  return { layout, setSize, setOrder }
}
