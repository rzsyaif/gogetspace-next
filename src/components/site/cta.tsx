import { PromptInput } from "./prompt-input"

export function Cta() {
  return (
    <section aria-labelledby="cta-title" className="flex w-full justify-center px-4 py-20 min-[810px]:py-30">
      <div className="flex w-full max-w-[588px] flex-col items-center gap-9">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="type-label-sm text-blue-500">YOUR ALL-IN-ONE WEBSITE SOLUTION</p>
          <h2 id="cta-title" className="type-display text-neutral-900">Ready to start building your space?</h2>
        </div>
        <PromptInput flowHref="/generate" />
      </div>
    </section>
  )
}
