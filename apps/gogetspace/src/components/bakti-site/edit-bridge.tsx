"use client"

import { useEffect } from "react"

/**
 * Builder side of the generated site, active only inside the editor's preview iframe.
 * In Edit Mode it outlines what's under the pointer, swallows clicks (no navigation, no dialogs) and tells the
 * editor what was picked — a section/container, a piece of text or an image — with its position, so the editor
 * can show its menu. It also applies the editor's changes: inline text editing, replaced or regenerated images.
 *
 * Messages in:  bakti:mode {mode} · bakti:edit-text {id} · bakti:replace-text {id,text} · bakti:replace-image {id,src}
 *               bakti:regen-image {id,src} · bakti:flash {id} · bakti:select-parent {id} · bakti:deselect
 * Messages out: bakti:select {id,kind,label,rect,hasParent,text?} · bakti:rect {id,rect} · bakti:deselect
 *               bakti:text-saved {id,label,text}
 */

export type EditKind = "block" | "text" | "image"
export interface EditRect { x: number; y: number; w: number; h: number }

const TEXT_TAGS = "h1,h2,h3,h4,h5,h6,p,li,a,button,span,dt,dd,blockquote,figcaption,label,th,td,strong,em"
const BLOCK_TAGS = new Set(["DIV", "SECTION", "ARTICLE", "FIGURE", "FORM", "UL", "OL", "HEADER", "FOOTER", "LI", "NAV", "MAIN", "TABLE"])
const KIND_LABEL: Record<EditKind, string> = { block: "Section", text: "Text", image: "Image" }

export function EditBridge() {
  useEffect(() => {
    if (window.parent === window) return
    const origin = window.location.origin
    const post = (msg: object) => window.parent.postMessage(msg, origin)
    let mode: "preview" | "edit" = "preview"
    let selected: HTMLElement | null = null
    let selectedKind: EditKind = "block"
    let editing: HTMLElement | null = null
    let editingOriginal = ""
    let seq = 0

    const style = document.createElement("style")
    style.textContent = `
      html[data-edit-mode] body, html[data-edit-mode] body * { cursor: default !important; }
      html[data-edit-mode] [contenteditable="true"] { cursor: text !important; outline: 2px solid #2F5BFF !important; outline-offset: 3px; border-radius: 2px; }
      @keyframes bakti-flash { 0% { box-shadow: 0 0 0 0 rgba(47,91,255,.55); } 100% { box-shadow: 0 0 0 18px rgba(47,91,255,0); } }
      @keyframes bakti-regen { 0%,100% { opacity: .35; filter: blur(6px) saturate(.4); } 50% { opacity: .6; filter: blur(3px) saturate(.6); } }
      .bakti-flash { animation: bakti-flash .9s ease-out 2; }
      .bakti-regen { animation: bakti-regen 1.1s ease-in-out infinite; }
    `
    document.head.appendChild(style)

    const box = (dashed: boolean) => {
      const el = document.createElement("div")
      el.setAttribute("data-edit-ui", "")
      el.style.cssText = `position:fixed;pointer-events:none;z-index:2147483000;border:2px ${dashed ? "dashed" : "solid"} #2F5BFF;border-radius:4px;display:none;transition:top .08s,left .08s,width .08s,height .08s;${dashed ? "background:rgba(47,91,255,.04)" : "box-shadow:0 0 0 4px rgba(47,91,255,.18)"}`
      const tag = document.createElement("span")
      tag.style.cssText = "position:absolute;left:-2px;top:-22px;background:#2F5BFF;color:#fff;font:600 11px/16px system-ui,sans-serif;padding:2px 6px;border-radius:4px 4px 4px 0;white-space:nowrap"
      el.appendChild(tag)
      document.body.appendChild(el)
      return el
    }
    const hoverBox = box(true)
    const selBox = box(false)

    const place = (b: HTMLElement, el: HTMLElement | null, kind?: EditKind) => {
      if (!el || mode !== "edit") {
        b.style.display = "none"
        return
      }
      const r = el.getBoundingClientRect()
      b.style.display = "block"
      b.style.left = `${r.left - 3}px`
      b.style.top = `${r.top - 3}px`
      b.style.width = `${r.width + 6}px`
      b.style.height = `${r.height + 6}px`
      const tag = b.firstChild as HTMLElement
      tag.textContent = kind ? KIND_LABEL[kind] : ""
      tag.style.top = r.top < 26 ? "2px" : "-22px"
      tag.style.left = r.top < 26 ? "2px" : "-2px"
    }

    const ownText = (el: Element) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim())
    const isBlock = (el: Element) => BLOCK_TAGS.has(el.tagName) && el.getBoundingClientRect().height >= 40

    function classify(target: EventTarget | null): { el: HTMLElement; kind: EditKind } | null {
      if (!(target instanceof Element) || target.closest("[data-edit-ui]")) return null
      const img = target.closest("img")
      if (img) return { el: img as HTMLElement, kind: "image" }
      // an image under a decorative overlay (gradient, caption card) still counts as the image
      const media = target.closest("div")
      const innerImg = media && media.children.length <= 3 ? media.querySelector(":scope > img") : null
      if (innerImg && !ownText(target)) return { el: innerImg as HTMLElement, kind: "image" }
      const text = target.closest(TEXT_TAGS)
      if (text && text !== document.body && (ownText(text) || (text.textContent?.trim() && text.children.length <= 2 && !text.querySelector("div,p,ul")))) {
        // inside a button or link, edit the whole label
        const wrap = text.closest("a,button")
        return { el: (wrap && wrap.textContent?.trim() ? wrap : text) as HTMLElement, kind: "text" }
      }
      let el: Element | null = target
      while (el && el !== document.body && !isBlock(el)) el = el.parentElement
      return el && el !== document.body ? { el: el as HTMLElement, kind: "block" } : null
    }

    function label(el: HTMLElement, kind: EditKind) {
      const clip = (t: string, n = 42) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t)
      if (kind === "image") return (el as HTMLImageElement).alt || "Image"
      if (kind === "text") return clip(el.innerText.replace(/\s+/g, " ").trim() || "Text")
      const heading = el.querySelector("h1,h2,h3,h4")
      const name = el.tagName === "HEADER" ? "Header" : el.tagName === "FOOTER" ? "Footer" : el.tagName === "SECTION" ? "Section" : el.tagName === "FORM" ? "Form" : "Block"
      return heading?.textContent?.trim() ? `${name} · ${clip(heading.textContent.trim(), 36)}` : name
    }

    const rectOf = (el: HTMLElement): EditRect => {
      const r = el.getBoundingClientRect()
      return { x: r.left, y: r.top, w: r.width, h: r.height }
    }
    const idOf = (el: HTMLElement) => (el.dataset.editId ||= String(++seq))
    const byId = (id: string) => document.querySelector<HTMLElement>(`[data-edit-id="${CSS.escape(id)}"]`)

    function select(el: HTMLElement, kind: EditKind) {
      selected = el
      selectedKind = kind
      place(selBox, el, kind)
      let parent = el.parentElement
      while (parent && parent !== document.body && !isBlock(parent)) parent = parent.parentElement
      post({
        type: "bakti:select",
        id: idOf(el),
        kind,
        label: label(el, kind),
        rect: rectOf(el),
        hasParent: !!parent && parent !== document.body && parent.tagName !== "MAIN",
        text: kind === "text" ? el.innerText : undefined,
      })
    }
    function deselect(notify = true) {
      selected = null
      place(selBox, null)
      if (notify) post({ type: "bakti:deselect" })
    }

    function finishEdit(cancel = false) {
      if (!editing) return
      const el = editing
      editing = null
      if (cancel) el.innerText = editingOriginal
      el.contentEditable = "false"
      el.removeAttribute("contenteditable")
      if (!cancel && el.innerText !== editingOriginal) post({ type: "bakti:text-saved", id: idOf(el), label: label(el, "text"), text: el.innerText })
      place(selBox, selected, selectedKind)
    }

    const flash = (el: HTMLElement) => {
      el.classList.remove("bakti-flash")
      void el.offsetWidth
      el.classList.add("bakti-flash")
      window.setTimeout(() => el.classList.remove("bakti-flash"), 1900)
    }

    const onMove = (e: PointerEvent) => {
      if (mode !== "edit" || editing) return place(hoverBox, null)
      const c = classify(e.target)
      place(hoverBox, c && c.el !== selected ? c.el : null, c?.kind)
    }
    const swallow = (e: Event) => {
      if (mode !== "edit") return
      if (editing && e.target instanceof Node && editing.contains(e.target)) return
      e.preventDefault()
      e.stopPropagation()
    }
    const onClick = (e: MouseEvent) => {
      if (mode !== "edit") return
      if (editing && e.target instanceof Node && editing.contains(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      if (editing) finishEdit()
      const c = classify(e.target)
      if (!c) return deselect()
      if (c.el === selected) return
      place(hoverBox, null)
      select(c.el, c.kind)
    }
    const onKey = (e: KeyboardEvent) => {
      if (editing) {
        if (e.key === "Escape") finishEdit(true)
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          finishEdit()
        }
        return
      }
      if (mode === "edit" && e.key === "Escape") deselect()
    }
    const onScroll = () => {
      place(hoverBox, null)
      if (!selected) return
      place(selBox, selected, selectedKind)
      post({ type: "bakti:rect", id: idOf(selected), rect: rectOf(selected) })
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== window.parent) return
      const d = e.data as { type?: string; id?: string; mode?: "preview" | "edit"; text?: string; src?: string }
      const el = d.id ? byId(d.id) : null
      switch (d.type) {
        case "bakti:mode":
          mode = d.mode === "edit" ? "edit" : "preview"
          if (mode === "edit") document.documentElement.setAttribute("data-edit-mode", "")
          else {
            document.documentElement.removeAttribute("data-edit-mode")
            finishEdit()
            deselect(false)
            place(hoverBox, null)
          }
          break
        case "bakti:edit-text":
          if (!el) break
          editing = el
          editingOriginal = el.innerText
          el.contentEditable = "true"
          el.focus()
          {
            const range = document.createRange()
            range.selectNodeContents(el)
            range.collapse(false)
            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(range)
          }
          el.addEventListener("blur", () => finishEdit(), { once: true })
          place(selBox, null)
          break
        case "bakti:replace-text":
          if (el && d.text) {
            el.innerText = d.text
            flash(el)
            place(selBox, selected, selectedKind)
          }
          break
        case "bakti:replace-image":
        case "bakti:regen-image": {
          if (!(el instanceof HTMLImageElement) || !d.src) break
          const apply = () => {
            el.removeAttribute("srcset")
            el.removeAttribute("sizes")
            el.src = d.src!
            el.classList.remove("bakti-regen")
            flash(el)
          }
          if (d.type === "bakti:replace-image") apply()
          else {
            el.classList.add("bakti-regen")
            window.setTimeout(apply, 1600)
          }
          break
        }
        case "bakti:flash":
          if (el) flash(el)
          break
        case "bakti:select-parent": {
          let p = el?.parentElement ?? null
          while (p && p !== document.body && !(isBlock(p) && (p.getBoundingClientRect().height > el!.getBoundingClientRect().height + 4 || p.getBoundingClientRect().width > el!.getBoundingClientRect().width + 4))) p = p.parentElement
          if (p && p !== document.body) select(p, "block")
          break
        }
        case "bakti:deselect":
          deselect(false)
          break
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("click", onClick, true)
    window.addEventListener("mousedown", swallow, true)
    window.addEventListener("submit", swallow, true)
    window.addEventListener("keydown", onKey, true)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    window.addEventListener("message", onMessage)
    post({ type: "bakti:ready" })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("click", onClick, true)
      window.removeEventListener("mousedown", swallow, true)
      window.removeEventListener("submit", swallow, true)
      window.removeEventListener("keydown", onKey, true)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("message", onMessage)
      hoverBox.remove()
      selBox.remove()
      style.remove()
    }
  }, [])
  return null
}
