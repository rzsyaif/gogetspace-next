"use client"

import { ShaderEffect } from "@/lib/shader-runtime"
import {
  setup as setupPixelate,
  render as renderPixelate,
  manifest as manifestPixelate,
} from "@/lib/custom-effects/CodeComponentId_33d4bf82a8f949caa6b12336d86f0b723ee8209e_7038"

// Figma's Pixelate shader with the params used on the colour washes (footer 91:2273, dashboard 95:2508)
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
 * A Figma colour wash (an SVG) under the Pixelate shader (WebGPU + HTML-in-Canvas). Browsers without those APIs
 * show the wash without the pixel pattern. Top-anchored and centred; at least `width`×`height`, growing (and
 * cropping the sides) when its container is taller or wider.
 */
export function PixelBackground({ src, width, height, className }: { src: string; width: number; height: number; className?: string }) {
  return (
    <div aria-hidden className={className ?? "pointer-events-none absolute inset-0 -z-10 overflow-hidden"}>
      <div
        className="absolute top-0 left-1/2 h-full"
        style={{ width: `max(${width}px, 100%)`, minHeight: height, marginLeft: `calc(-1 * max(${width / 2}px, 50%))` }}
      >
        <ShaderEffect className="absolute top-0 left-0 h-full w-full" shaders={SHADERS}>
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG drawn into the shader canvas */}
            <img alt="" src={src} width={width} height={height} className="absolute inset-0 block size-full max-w-none object-cover object-top" />
          </div>
        </ShaderEffect>
      </div>
    </div>
  )
}
