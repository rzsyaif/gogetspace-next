"use client"

import { useSyncExternalStore } from "react"

/** a media query's current answer; `false` while rendering on the server */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

const noop = () => () => {}
/** true once running in the browser: for parts that depend on the viewer's clock or screen */
export const useMounted = () => useSyncExternalStore(noop, () => true, () => false)
