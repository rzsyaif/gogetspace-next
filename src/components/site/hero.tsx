import { PixelBlocks } from "./pixel-blocks"
import { PromptInput } from "./prompt-input"

export function Hero() {
  return (
    <section
      id="start"
      aria-labelledby="hero-title"
      className="relative flex w-full flex-col items-center overflow-clip px-4 pt-16 pb-24 min-[810px]:px-6 min-[810px]:pt-30 min-[810px]:pb-30 min-[1440px]:pb-50"
    >
      <PixelBlocks className="absolute inset-0 z-0" />
      <div className="relative z-10 flex w-full max-w-[588px] flex-col items-center gap-9">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="type-label-sm text-blue-500">YOUR ALL-IN-ONE WEBSITE SOLUTION</p>
          <h1 id="hero-title" className="type-display text-neutral-900">
            Your business,
            <br />
            <span className="text-blue-500">online</span> today
          </h1>
          <p className="type-body-lg text-neutral-600">Build a dream space for your business. Start for free.</p>
        </div>
        <PromptInput />
      </div>
    </section>
  )
}
