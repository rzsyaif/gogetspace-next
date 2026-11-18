/** Window events the hero prompt fires so the hero background can follow it: focus, what's typed, and sending. */
export const PROMPT_EVENT = "gogetspace:prompt"
export const PROMPT_TEXT_EVENT = "gogetspace:prompt-text"
export const PROMPT_LAUNCH_EVENT = "gogetspace:prompt-launch"

export function emitPromptText(length: number) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PROMPT_TEXT_EVENT, { detail: { length } }))
}

export function emitPromptLaunch() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PROMPT_LAUNCH_EVENT))
}

export function emitPromptActive(active: boolean) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PROMPT_EVENT, { detail: { active } }))
}

/** Scroll back to the hero and put the cursor in its prompt (used by "Start building" buttons). */
export function focusHeroPrompt() {
  const ta = document.querySelector<HTMLTextAreaElement>("#start textarea")
  if (!ta) return
  ta.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" })
  ta.focus({ preventScroll: true })
}
