"use client"

import Link from "next/link"
import { Check, ChevronsUpDown, ExternalLink, Plus } from "lucide-react"
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gogetspace/baseplate"
import { ThemeToggle } from "@gogetspace/baseplate/theme"
import type { Member, Project } from "@gogetspace/modules"

/** where "Build another website" goes: the GoGetSpace app */
const GOGETSPACE_URL = process.env.NEXT_PUBLIC_GOGETSPACE_URL ?? "http://localhost:3000"

/** a project's initials, standing in for its site's favicon */
function ProjectMark({ name }: { name: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")
  return (
    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-sm bg-action-primary type-label-sm text-fg-on-action">
      {initials}
    </span>
  )
}

/**
 * Ariyes' top bar. The switcher lists the person's projects: one per website they published with GoGetSpace,
 * named after the site.
 */
export function TopBar({ project, projects, me }: { project: Project; projects: Project[]; me: Member }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line-default bg-surface/90 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-5">
        <Link href={`/${project.id}`} className="rounded-sm font-heading text-[22px] font-bold tracking-tight text-fg-primary focus-visible:outline-none focus-visible:focus-ring">
          ariyes
        </Link>
        <span aria-hidden className="text-line-strong">
          /
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 items-center gap-2 rounded-md py-1.5 pr-2 pl-1.5 transition-colors duration-150 hover:bg-action-ghost-hover focus-visible:outline-none focus-visible:focus-ring data-[state=open]:bg-action-ghost-hover">
            <ProjectMark name={project.name} />
            <span className="truncate type-label-md text-fg-primary">{project.name}</span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-fg-tertiary" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel>Your websites</DropdownMenuLabel>
            {projects.map((p) => (
              <DropdownMenuItem key={p.id} asChild>
                <Link href={`/${p.id}`} className="flex items-center gap-3">
                  <ProjectMark name={p.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{p.name}</span>
                    <span className="truncate type-body-sm text-fg-tertiary">{p.domain}</span>
                  </span>
                  {p.id === project.id && <Check aria-label="Current" className="size-4 text-fg-link" />}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={GOGETSPACE_URL} className="flex items-center gap-3">
                <Plus aria-hidden className="size-4" /> Build another website
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="flex-1" />
        <a
          href={`https://${project.domain}`}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-sm type-label-md text-fg-secondary transition-colors duration-150 hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring md:flex"
        >
          View website <ExternalLink aria-hidden className="size-4" />
        </a>
        <ThemeToggle className="max-sm:hidden" />
        <Avatar name={me.name} size="sm" />
      </div>
    </header>
  )
}
