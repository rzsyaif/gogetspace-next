import { Check } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/cn"
import { PLANS } from "@/lib/plans"


export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="flex w-full scroll-mt-24 flex-col items-center gap-12 px-4 py-20 min-[810px]:py-30"
    >
      <div className="flex w-full max-w-[720px] flex-col items-center gap-3 text-center">
        <p className="type-label-sm text-blue-500">PRICING</p>
        <h2 id="pricing-title" className="type-h2 text-neutral-900">Simple plans, everything included</h2>
        <p className="max-w-[640px] type-body-lg text-neutral-600">
          Domain connection, hosting, and support come with every plan. Start for free and pay when you are ready to publish.
        </p>
      </div>
      <ul className="grid w-full max-w-[480px] items-start gap-6 min-[1100px]:max-w-[1200px] min-[1100px]:grid-cols-3">
        {PLANS.map((p) => (
          <li
            key={p.name}
            className={cn(
              "flex flex-col gap-6 rounded-xl bg-white p-8",
              p.featured ? "border-2 border-blue-500" : "border border-neutral-200",
            )}
          >
            <div className="flex items-center gap-2">
              <h3 className="flex-1 type-h5 text-neutral-900">{p.name}</h3>
              {p.featured && <span className="rounded-full bg-blue-500 px-2 py-0.5 type-label-sm text-white">Most popular</span>}
            </div>
            <p className="-mt-3 type-body-md text-neutral-600">{p.desc}</p>
            <p className="flex items-end gap-2">
              <span className="type-h2 text-neutral-900">{p.priceLabel}</span>
              <span className="pb-1.5 type-body-md text-neutral-600">{p.period}</span>
            </p>
            <Button variant={p.featured ? "primary" : "secondary"} className="w-full">
              {p.cta}
            </Button>
            <hr className="border-neutral-200" />
            <ul className="flex flex-col gap-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-3 type-body-md text-neutral-900">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                    <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="text-center type-body-md text-neutral-600">
        *Custom domain not included. You need to purchase separately in the platform.
      </p>
    </section>
  )
}
