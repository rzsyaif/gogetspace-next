"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * PROTOTYPE GLUE. State the Ariyes apps share inside one browser tab, so a booking made from the CRM shows in
 * Appointments and a confirmed booking shows in the CRM's history, across page changes and reloads. Kept in memory
 * and mirrored to sessionStorage. In the real product this is the server: every write here is an API call, and
 * every read a fetch.
 */
const mem = new Map<string, unknown>()
const subs = new Set<() => void>()
const STORAGE = "ariyes:shared:"

function load<T>(key: string, init: () => T): T {
  if (mem.has(key)) return mem.get(key) as T
  let value: T | undefined
  try {
    const raw = sessionStorage.getItem(STORAGE + key)
    if (raw) value = JSON.parse(raw) as T
  } catch {}
  value ??= init()
  mem.set(key, value)
  return value
}

/** read a shared value (making it with `init` the first time); outside React, e.g. from another app's action */
export function readShared<T>(key: string, init: () => T): T {
  return load(key, init)
}

/** replace a shared value and tell every screen using it */
export function writeShared<T>(key: string, value: T) {
  mem.set(key, value)
  try {
    sessionStorage.setItem(STORAGE + key, JSON.stringify(value))
  } catch {}
  subs.forEach((f) => f())
}

const subscribe = (f: () => void) => {
  subs.add(f)
  return () => subs.delete(f)
}

/**
 * A shared value as React state. `init` runs in the browser only (it may use the viewer's clock); on the server
 * and during hydration the value is `undefined`.
 */
export function useShared<T>(key: string, init: () => T): [T | undefined, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => load(key, init),
    () => undefined,
  )
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = load(key, init)
      writeShared(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next)
    },
    // init is only used the first time
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, set]
}

export const keys = {
  crm: (projectId: string) => `${projectId}:crm`,
  bookings: (projectId: string) => `${projectId}:booking-edits`,
  apptSettings: (projectId: string) => `${projectId}:appointment-settings`,
}
