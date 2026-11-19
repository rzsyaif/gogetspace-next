import { HeroTiles } from "./hero-tiles"
import { PromptInput } from "./prompt-input"

/** The closing call-to-action: the hero's tile field again, so the page ends where it began. */
export function Cta() {
  return (
    <section aria-labelledby="cta-title" className="relative flex w-full justify-center overflow-clip px-4 py-20 min-[810px]:py-30">
      <HeroTiles className="absolute inset-0 z-0 [mask-image:linear-gradient(to_bottom,transparent,black_160px,black_calc(100%-160px),transparent)]" />
      <div className="relative z-10 flex w-full max-w-[588px] flex-col items-center gap-9">
        <h2 id="cta-title" data-hero-copy className="text-center type-display text-neutral-900">
          Ready to start building your space?
        </h2>
        <div data-hero-prompt className="w-full">
          <PromptInput flowHref="/generate" signals />
        </div>
      </div>
    </section>
  )
}
