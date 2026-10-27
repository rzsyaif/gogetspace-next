/** Window event the AI prompt input fires so the hero Pixel Blocks can clear while the visitor types. */
export const PROMPT_EVENT = "gogetspace:prompt"

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
