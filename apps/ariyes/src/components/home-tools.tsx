"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Plus } from "lucide-react"
import { Badge, Button, Card } from "@gogetspace/baseplate"
import { DEFAULT_TOOLS, TOOLS, toolById, type Peeks, type Project, type ToolId } from "@gogetspace/modules"
import { Peek } from "./peek"
import { ToolIcon } from "./tool-icon"

/** the home screen's order: what a practice checks first, settings last */
const HOME_ORDER: ToolId[] = [
  "appointments", "inbox", "payments", "crm", "contacts", "campaigns", "reviews", "estimates",
  "locations", "sequences", "broadcasts", "helpdesk", "todo", "drive", "settings",
]

/**
 * The project's tools as tiles, each with a sneak peek of its latest numbers, then the add-ons it doesn't have
 * yet. Adding one here is local to the prototype (a real install goes through billing).
 */
export function HomeTools({ project, peeks }: { project: Project; peeks: Peeks }) {
  const [installed, setInstalled] = useState<ToolId[]>(project.installed)
  const [justAdded, setJustAdded] = useState<ToolId[]>([])
  const have = new Set<ToolId>([...DEFAULT_TOOLS, ...installed])
  const tiles = HOME_ORDER.filter((id) => have.has(id)).map(toolById)
  const available = TOOLS.filter((t) => t.kind === "addon" && !have.has(t.id))

  const add = (id: ToolId) => {
    setInstalled((x) => [...x, id])
    setJustAdded((x) => [...x, id])
  }

  return (
    <div className="flex flex-col gap-14">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tiles.map((tool) => (
          <li key={tool.id} className="flex">
            <Link
              href={`/${project.id}/${tool.id}`}
              className="group flex w-full rounded-lg focus-visible:outline-none focus-visible:focus-ring"
            >
              <Card interactive className="flex w-full flex-col gap-5 p-5 sm:min-h-[212px]">
                <span className="flex items-center gap-3">
                  <ToolIcon tool={tool} />
                  <span className="type-label-lg text-fg-primary">{tool.name}</span>
                  {justAdded.includes(tool.id) && (
                    <Badge tone="brand" className="ml-1">
                      New
                    </Badge>
                  )}
                  <ArrowUpRight
                    aria-hidden
                    className="ml-auto size-4 text-fg-tertiary opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                </span>
                <Peek tool={tool.id} data={peeks[tool.id]} project={project} />
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {available.length > 0 && (
        <section aria-labelledby="add-title" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="add-title" className="type-h5 text-fg-primary">
              Add to {project.name}
            </h2>
            <p className="type-body-sm text-fg-secondary">Each tool is added to this website only. It’s ready as soon as you add it.</p>
          </div>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {available.map((tool) => (
              <li key={tool.id} className="flex items-center gap-4 rounded-lg border border-line-default bg-surface p-4">
                <ToolIcon tool={tool} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-label-md text-fg-primary">{tool.name}</span>
                  <span className="type-body-sm text-fg-secondary">{tool.description}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  {tool.price != null && <span className="type-label-sm text-fg-secondary tabular-nums">${tool.price}/mo</span>}
                  <Button size="sm" variant="secondary" leadingIcon={<Plus />} onClick={() => add(tool.id)} aria-label={`Add ${tool.name}`}>
                    Add
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
