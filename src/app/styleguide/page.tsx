import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { Metadata } from "next"
import tokens from "../../../tokens/baseplate.tokens.json"
import { SETUP, SNIPPETS } from "./snippets"
import { StyleGuide } from "./style-guide"

export const metadata: Metadata = { title: "Baseplate style guide" }

/** the component and setup files, read at build time so the Source tabs always match the code */
function readSources() {
  const files = new Set([...Object.values(SNIPPETS).flatMap((list) => list.map((s) => s.file)), ...SETUP.map((s) => s.file)])
  return Object.fromEntries([...files].map((f) => [f, readFileSync(join(process.cwd(), f), "utf8")]))
}

export default function StyleGuidePage() {
  const palettes = Object.entries(tokens.primitives).filter(([k]) => k !== "base") as [string, Record<string, string>][]
  return <StyleGuide palettes={palettes} sources={readSources()} />
}
