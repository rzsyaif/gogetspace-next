import type { Metadata } from "next"
import tokens from "../../../tokens/baseplate.tokens.json"
import { StyleGuide } from "./style-guide"

export const metadata: Metadata = { title: "Baseplate style guide" }

export default function StyleGuidePage() {
  const palettes = Object.entries(tokens.primitives).filter(([k]) => k !== "base") as [string, Record<string, string>][]
  return <StyleGuide palettes={palettes} />
}
