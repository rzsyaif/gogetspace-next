"use client"

import { Accordion } from "radix-ui"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    q: "Do I need any technical skills?",
    a: "No. If you can describe your business in a few sentences, you can build your site. We take care of the design, hosting and setup.",
  },
  {
    q: "Can I use a domain I already own?",
    a: "Yes. Connect the domain you have, or pick a new one while you build. We walk you through it step by step.",
  },
  {
    q: "Can I change my site after it goes live?",
    a: "Anytime. Click any text or photo to edit it, or ask the assistant to add a new page or section.",
  },
  { q: "Do I own my website and content?", a: "Yes. Your text, photos and domain are yours." },
  {
    q: "What happens if I cancel?",
    a: "You can cancel from your account at any time. We will help you move your domain if you need to.",
  },
]

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="flex w-full justify-center px-4 py-20 min-[810px]:py-30">
      <div className="flex w-full max-w-[1200px] flex-col gap-8 min-[810px]:flex-row min-[810px]:gap-6">
        <div className="flex flex-col gap-3 min-[810px]:w-[384px] min-[810px]:shrink-0">
          <p className="type-label-sm text-blue-500">QUESTIONS</p>
          <h2 id="faq-title" className="type-h2 text-neutral-900">Frequently asked questions</h2>
          <p className="type-body-lg text-neutral-600">Good to know before you start</p>
        </div>
        <Accordion.Root type="single" collapsible defaultValue="item-0" className="flex-1">
          {FAQS.map(({ q, a }, i) => (
            <Accordion.Item key={q} value={`item-${i}`} className="border-b border-neutral-200 first:border-t">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center gap-4 rounded-sm py-6 text-left focus-visible:outline-none focus-visible:focus-ring">
                  <span className="flex-1 type-h6 text-neutral-900">{q}</span>
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 text-neutral-600 transition-[rotate,color] duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-blue-500"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[bp-accordion-up_250ms_ease-out] data-[state=open]:animate-[bp-accordion-down_300ms_ease-out]">
                <p className="pb-6 type-body-md text-neutral-600">{a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}
