"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, Users } from "lucide-react"
import { Input, SegmentedControl } from "@/components/ui"
import { PixelBackground } from "@/components/pixel-background"
import { PromptInput } from "@/components/site/prompt-input"
import { ACCOUNT, ENQUIRIES } from "@/lib/account/data"
import { useAccountState } from "@/lib/account/store"
import { PanelEmpty } from "@/components/account/panel"
import { SiteCard } from "./site-card"

/** Dashboard home (Figma 94:2350): greeting with the prompt to start a new site, then the account's websites. */
export function DashboardHome() {
  const { sites, enquiryStatus } = useAccountState()
  const [tab, setTab] = useState<"mine" | "shared">("mine")
  const [query, setQuery] = useState("")
  const prompt = useRef<HTMLDivElement>(null)
  const wantsNew = useSearchParams().get("new") === "1"

  // "New Website" from the sidebar or the editor lands here with the prompt focused
  useEffect(() => {
    if (!wantsNew) return
    prompt.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    prompt.current?.querySelector("textarea")?.focus()
  }, [wantsNew])

  const q = query.trim().toLowerCase()
  const shown = tab === "mine" ? sites.filter((s) => !q || s.name.toLowerCase().includes(q) || s.freeDomain.includes(q) || s.domain?.name.includes(q)) : []

  return (
    <div className="relative isolate flex min-h-full flex-col items-center">
      <PixelBackground src="/images/dashboard-bg.svg" width={1666} height={2189} />

      <section aria-labelledby="dash-title" className="flex w-full max-w-[628px] flex-col gap-9 px-5 pt-16 pb-16 sm:pt-[clamp(64px,16vh,240px)] lg:pb-30">
        <h1 id="dash-title" className="text-center type-h1 text-fg-primary">
          What space do you want to build today, {ACCOUNT.firstName}?
        </h1>
        <div ref={prompt}>
          <PromptInput flowHref="/generate" />
        </div>
      </section>

      <section aria-label="Your websites" className="mx-2 mb-2 w-[calc(100%-16px)] rounded-[28px] bg-surface px-4 py-8 sm:px-8 lg:mx-auto lg:mb-30 lg:w-[calc(100%-80px)] lg:max-w-[1390px] lg:rounded-[36px] lg:py-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 lg:gap-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              as="tablist"
              label="Websites"
              value={tab}
              onChange={setTab}
              options={[
                { value: "mine", label: "My websites" },
                { value: "shared", label: "Built by others" },
              ]}
              className="self-start"
            />
            <div className="w-full sm:w-[320px]">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search websites" aria-label="Search websites" leadingIcon={<Search />} type="search" />
            </div>
          </div>

          {tab === "shared" ? (
            <PanelEmpty icon={<Users />} title="Nothing shared with you yet" text="Websites other people build and share with you will show up here." />
          ) : shown.length === 0 ? (
            <PanelEmpty icon={<Search />} title="No websites match" text={`Nothing called “${query}”. Try another name or address.`} />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((site) => (
                <li key={site.id}>
                  <SiteCard site={site} newEnquiries={ENQUIRIES.filter((e) => e.siteId === site.id && enquiryStatus[e.id] === "new").length} />
                </li>
              ))}
              {!q && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      prompt.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                      prompt.current?.querySelector("textarea")?.focus({ preventScroll: true })
                    }}
                    className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-6 text-center text-fg-secondary transition-colors hover:border-blue-500 hover:text-fg-link focus-visible:outline-none focus-visible:focus-ring"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-subtle">
                      <Plus className="size-6" />
                    </span>
                    <span className="type-label-lg">Start a new website</span>
                    <span className="type-body-sm text-fg-tertiary">Each website gets its own plan.</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
