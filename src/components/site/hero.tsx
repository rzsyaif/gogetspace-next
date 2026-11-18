import { PixelBlocks } from "./pixel-blocks"
import { HeroBuilder } from "./hero-builder"

export function Hero() {
  return (
    <section
      id="start"
      aria-labelledby="hero-title"
      className="relative flex w-full flex-col items-center overflow-clip px-4 pt-8 pb-24 min-[810px]:px-6 min-[810px]:pt-16 min-[810px]:pb-30 min-[1440px]:pb-50"
    >
      <PixelBlocks className="absolute inset-0 z-0" />
      <div className="relative z-10 flex w-full max-w-[1180px] flex-col items-center gap-8 min-[1024px]:gap-14">
        <div className="flex max-w-[588px] flex-col items-center gap-4 text-center">
          <p className="type-label-sm text-blue-500">YOUR ALL-IN-ONE WEBSITE SOLUTION</p>
          <h1 id="hero-title" className="type-display text-neutral-900">
            Your business,
            <br />
            <span className="text-blue-500">online</span> today
          </h1>
          <p className="type-body-lg text-neutral-600">Fill in the blanks and watch your website take shape. Start for free.</p>
        </div>
        <HeroBuilder flowHref="/generate" />
      </div>
    </section>
  )
}
