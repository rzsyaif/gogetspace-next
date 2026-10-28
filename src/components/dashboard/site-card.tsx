"use client"

import Link from "next/link"
import { ExternalLink, NotebookPen } from "lucide-react"
import { Badge, Button, Card, Tooltip } from "@/components/ui"
import { HeroPreview } from "@/components/bakti-site/hero-preview"
import { getTheme } from "@/lib/bakti/themes"
import { planInfo } from "@/lib/plans"
import { dailyStats, siteUrl, type Site } from "@/lib/account/data"
import { StatusBadge } from "./shell"

/** Website card on the dashboard (Figma "Home/Pricing card"): thumbnail with plan + status, name, address, actions. */
export function SiteCard({ site, newEnquiries }: { site: Site; newEnquiries: number }) {
  const week = dailyStats(site.id).slice(-7).reduce((n, d) => n + d.visitors, 0)
  const live = site.status === "live"
  return (
    <Card className="flex flex-col gap-1 rounded-xl p-1">
      <div className="relative aspect-[1440/900] overflow-hidden rounded-[20px] bg-subtle">
        {site.built && site.themeId ? (
          <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
            <HeroPreview theme={getTheme(site.themeId)} viewport={1280} />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <NotebookPen className="size-7 text-fg-tertiary" strokeWidth={1.5} />
            <p className="type-label-md text-fg-secondary">Still planning</p>
            <p className="type-caption text-fg-tertiary">The brief and page plan are waiting for your review.</p>
          </div>
        )}
        <div className="absolute top-2.5 right-4 flex gap-2.5">
          <Badge tone="brand" dot={false}>
            {planInfo(site.plan).name} Plan
          </Badge>
          <StatusBadge site={site} />
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-1 type-h6 text-fg-primary">{site.name}</h3>
          {live ? (
            <Button asChild variant="link" size="sm" className="self-start type-body-sm">
              <a href={`https://${siteUrl(site)}`} target="_blank" rel="noreferrer">
                {siteUrl(site)}
              </a>
            </Button>
          ) : (
            <p className="type-body-sm text-fg-tertiary">{site.freeDomain} · not published</p>
          )}
          <p className="type-body-sm text-fg-secondary">
            Last edited {site.lastEdited}
            {live && ` · ${week.toLocaleString("en")} visitors this week`}
          </p>
          {newEnquiries > 0 && (
            <Button asChild variant="link" size="sm" className="self-start type-body-sm">
              <Link href={`/sites/${site.id}?tab=enquiries`}>
                {newEnquiries} new {newEnquiries === 1 ? "enquiry" : "enquiries"}
              </Link>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Tooltip content={live ? "Open the live site" : "Not published yet"}>
            {live ? (
              <Button asChild size="icon-md" variant="secondary" aria-label={`Open ${site.name}`}>
                <a href={`/preview/${site.themeId}`} target="_blank" rel="noreferrer">
                  <ExternalLink />
                </a>
              </Button>
            ) : (
              <span tabIndex={0} className="rounded-md focus-visible:outline-none focus-visible:focus-ring">
                <Button size="icon-md" variant="secondary" aria-label="Not published yet" disabled>
                  <ExternalLink />
                </Button>
              </span>
            )}
          </Tooltip>
          <Button asChild variant="secondary" className="flex-1">
            <Link href={`/sites/${site.id}`}>{site.built ? "Edit Website" : "Continue setup"}</Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
