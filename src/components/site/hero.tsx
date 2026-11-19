import { HeroTiles } from "./hero-tiles"
import { PromptInput } from "./prompt-input"

export function Hero() {
  return (
    // pulled up under the transparent nav, so the grid and its ripples reach the top of the screen
    <section
      id="start"
      aria-labelledby="hero-title"
      className="relative -mt-[88px] flex w-full flex-col items-center overflow-clip px-4 pt-[152px] pb-24 min-[810px]:px-6 min-[810px]:pt-[208px] min-[810px]:pb-30 min-[1440px]:pb-50"
    >
      <HeroTiles className="absolute inset-0 z-0" />
      <div className="relative z-10 flex w-full max-w-[588px] flex-col items-center gap-9">
        <div data-hero-copy className="flex flex-col items-center gap-4 text-center">
          <p className="type-label-sm text-blue-500">YOUR ALL-IN-ONE WEBSITE SOLUTION</p>
          <h1 id="hero-title" className="type-display text-neutral-900">
            Your business,
            <br />
            <span className="text-blue-500">online</span> today
          </h1>
          <p className="type-body-lg text-neutral-600">A website for your clinic or practice, built from one sentence. Free to start.</p>
        </div>
        <div data-hero-prompt className="w-full">
          <PromptInput flowHref="/generate" signals builder />
        </div>
      </div>
    </section>
  )
}
