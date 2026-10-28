"use client"

import { ShaderEffect } from "@/lib/shader-runtime"
import {
  setup as setupPixelate,
  render as renderPixelate,
  manifest as manifestPixelate,
} from "@/lib/custom-effects/CodeComponentId_33d4bf82a8f949caa6b12336d86f0b723ee8209e_7038"

// Figma "Footer" (91:2272): the colour wash (91:2273) with the Pixelate shader on top, params as authored.
const SHADERS = [
  {
    setup: setupPixelate,
    render: renderPixelate,
    manifest: manifestPixelate,
    params: {
      size: 50,
      pixelShape: 2,
      dissolveMode: 0,
      averageColor: 50,
      knockout: true,
      colorTrim: 4,
      region: { x: 50, y: 50, radius: 100.85826110839844, angle: 45 },
      stretchSize: 0,
      falloff: 0,
      dissolve: 0,
      gap: 0,
    },
  },
]

/**
 * Background behind the closing call-to-action and the footer: the 1920×1340 wash from Figma, pixelated by the
 * Figma shader (WebGPU + HTML-in-Canvas). Browsers without those APIs get the same wash, unpixelated.
 */
export function FooterBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* top-anchored like the Figma frame; at least 1920×1340, growing (and cropping the sides) on taller layouts */}
      <div className="absolute top-0 left-1/2 ml-[calc(-1*max(960px,50%))] h-full min-h-[1340px] w-[max(1920px,100%)]">
        <ShaderEffect className="absolute top-0 left-0 h-full w-full" shaders={SHADERS}>
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG drawn into the shader canvas */}
            <img alt="" src="/images/footer-bg.svg" width={1920} height={1340} className="absolute inset-0 block size-full max-w-none object-cover object-top" />
          </div>
        </ShaderEffect>
      </div>
    </div>
  )
}
