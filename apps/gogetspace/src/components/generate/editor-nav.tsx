"use client"

import { createContext, useContext, useRef, type ReactNode } from "react"
import type { Tab } from "./workspace"

/** lets blocks in the chat move around the editor: open a tab, or open the publish dialog */
interface EditorNav {
  goTo: (t: Tab) => void
  publish: () => void
  /** the preview pane registers how it opens its publish dialog */
  onPublish: (fn: () => void) => void
}

const Ctx = createContext<EditorNav>({ goTo: () => {}, publish: () => {}, onPublish: () => {} })
export const useEditorNav = () => useContext(Ctx)

export function EditorNavProvider({ goTo, children }: { goTo: (t: Tab) => void; children: ReactNode }) {
  const publishFn = useRef<() => void>(() => {})
  return <Ctx.Provider value={{ goTo, publish: () => publishFn.current(), onPublish: (fn) => (publishFn.current = fn) }}>{children}</Ctx.Provider>
}
