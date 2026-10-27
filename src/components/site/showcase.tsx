"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { Globe } from "lucide-react"
import { AVATARS, GALLERY_IMAGES } from "./assets"
import { CurvedGallery } from "./curved-gallery"
import { HowItWorks } from "./how-it-works"
import { Features } from "./features"

/**
 * The stacked middle of the homepage: "Everyone can build" sticks while How it works slides over it
 * (and shrinks to 95%), then the How it works panel shrinks while Features slides over it.
 */
export function Showcase() {
  const howRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: howEnter } = useScroll({ target: howRef, offset: ["start end", "start start"] })
  const introScale = useTransform(howEnter, [0, 1], [1, reduce ? 1 : 0.95])

  return (
    <div className="flex w-full flex-col items-center gap-4 p-4">
      <motion.section
        aria-labelledby="everyone-title"
        style={{ scale: introScale }}
        className="sticky top-4 z-0 flex w-full max-w-[1400px] flex-col items-center justify-center gap-9 overflow-clip rounded-[32px] bg-neutral-900 px-5 py-16 min-[810px]:rounded-[40px] min-[810px]:px-8 min-[810px]:py-20 min-[1440px]:h-[calc(100svh-32px)] min-[1440px]:min-h-[720px] min-[1440px]:rounded-[48px] min-[1440px]:px-0 min-[1440px]:py-24"
      >
        <CurvedGallery images={GALLERY_IMAGES} className="-mx-5 w-[calc(100%+40px)] min-[810px]:mx-0 min-[810px]:w-full" />
        <div className="flex w-full max-w-[588px] flex-col items-center gap-4 text-center">
          <div className="relative h-12 w-48" aria-hidden>
            {AVATARS.map((src, i) => (
              <span
                key={src}
                className="absolute top-0 size-12 overflow-hidden rounded-full border-4 border-neutral-950 bg-neutral-700"
                style={{ left: i * 36, zIndex: i }}
              >
                <Image src={src} alt="" fill sizes="48px" className="object-cover" />
              </span>
            ))}
            <span className="absolute top-0 left-36 z-10 grid size-12 place-items-center rounded-full border-4 border-neutral-950 bg-blue-500 text-white">
              <Globe className="size-6" strokeWidth={2} />
            </span>
          </div>
          <h2 id="everyone-title" className="type-h2 text-neutral-50">
            Now everyone can build, literally
          </h2>
          <p className="type-body-lg text-neutral-300">
            You focus on managing businesses and serving clients in the best way. Everything that usually needs a developer,
            consider it done.
          </p>
        </div>
      </motion.section>

      <HowItWorks ref={howRef} />
      <Features />
    </div>
  )
}
