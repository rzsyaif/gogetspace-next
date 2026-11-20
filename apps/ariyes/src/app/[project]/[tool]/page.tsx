import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { StudsMedia } from "@gogetspace/baseplate"
import { TOOLS, type ToolId } from "@gogetspace/modules"
import { getProject, listProjects } from "@gogetspace/modules/mock"
import { ToolIcon } from "@/components/tool-icon"

export async function generateStaticParams() {
  const projects = await listProjects()
  return projects.flatMap((p) => TOOLS.map((t) => ({ project: p.id, tool: t.id })))
}

export async function generateMetadata({ params }: PageProps<"/[project]/[tool]">): Promise<Metadata> {
  const { tool: id } = await params
  const tool = TOOLS.find((t) => t.id === id)
  return { title: tool?.name }
}

/** placeholder until each tool's own screens are designed */
export default async function ToolPage({ params }: PageProps<"/[project]/[tool]">) {
  const { project: projectId, tool: toolId } = await params
  const tool = TOOLS.find((t) => t.id === (toolId as ToolId))
  if (!tool) notFound()
  const project = await getProject(projectId)
  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/${project.id}`}
        className="flex w-fit items-center gap-2 rounded-sm type-label-md text-fg-secondary hover:text-fg-primary focus-visible:outline-none focus-visible:focus-ring"
      >
        <ArrowLeft aria-hidden className="size-4" /> All tools
      </Link>
      <div className="flex items-center gap-4">
        <ToolIcon tool={tool} />
        <div className="flex flex-col">
          <h1 className="type-h3 text-fg-primary">{tool.name}</h1>
          <p className="type-body-md text-fg-secondary">{tool.description}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-line-default bg-surface">
        <StudsMedia className="h-48" />
        <p className="p-6 type-body-md text-fg-secondary">The {tool.name} screens for {project.name} come next.</p>
      </div>
    </div>
  )
}
