"use client"

import { Logo, Select } from "@/components/ui"

const COLUMNS = [
  // only links with somewhere to go; Company and Legal come back when their pages exist
  { title: "PRODUCT", links: [["AI Website Builder", "#start"], ["Managed Hosting", "#features-grid"], ["Domains", "/dashboard/domains"]] },
  { title: "GET STARTED", links: [["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["Questions", "#faq"]] },
]

const LANGUAGES = [
  { value: "en", label: "EN" },
  { value: "ms", label: "BM" },
  { value: "id", label: "ID" },
]

export function SiteFooter() {
  return (
    <footer className="flex w-full justify-center px-4 pb-4">
      <div className="flex w-full max-w-[1680px] justify-center rounded-[32px] border border-neutral-200 bg-white px-6 shadow-block-lg py-12 min-[810px]:rounded-[40px] min-[810px]:px-12 min-[810px]:py-16 min-[1440px]:rounded-[48px] min-[1440px]:px-16 min-[1440px]:py-24">
        <div className="flex w-full max-w-[1200px] flex-col gap-10 min-[810px]:gap-12 min-[1440px]:flex-row min-[1440px]:gap-6">
          <div className="flex flex-col items-start gap-6 min-[1440px]:w-[384px]">
            <Logo />
            <div className="w-28">
              <Select options={LANGUAGES} defaultValue="en" ariaLabel="Language" />
            </div>
          </div>
          <nav aria-label="Footer" className="grid flex-1 grid-cols-2 gap-x-6 gap-y-8 min-[810px]:grid-cols-3 min-[810px]:gap-12">
            {COLUMNS.map((c) => (
              <div key={c.title} className="flex flex-col items-start gap-4">
                <p className="type-label-sm text-blue-500">{c.title}</p>
                {c.links.map(([label, href]) => (
                  <a key={label} href={href} className="rounded-sm type-body-md text-neutral-900 hover:text-blue-600 focus-visible:outline-none focus-visible:focus-ring">
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
