import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { StudsMedia } from "@gogetspace/baseplate"
import { TOOLS, decodeTypes, decodeWeek, type ToolId } from "@gogetspace/modules"
import { getAppointmentSettings, getProject, listProjects } from "@gogetspace/modules/mock"
import { AppShell } from "@/components/app-shell"
import { AppointmentsApp } from "@/components/appointments/appointments-app"
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

/**
 * One app inside a project, in the shared three-column layout. Appointments is designed; the others are placeholders
 * until their screens are.
 */
export default async function ToolPage({ params, searchParams }: PageProps<"/[project]/[tool]">) {
  const { project: projectId, tool: toolId } = await params
  const tool = TOOLS.find((t) => t.id === (toolId as ToolId))
  if (!tool) notFound()
  const project = await getProject(projectId)

  if (tool.id === "appointments") {
    // availability and booking types answered in the GoGetSpace chat arrive in the link (?hours=…&types=…); a real app reads them from the account
    const q = await searchParams
    const hours = typeof q.hours === "string" ? decodeWeek(q.hours) : null
    const types = typeof q.types === "string" ? decodeTypes(q.types) : null
    const settings = await getAppointmentSettings(project.id, hours, types)
    return <AppointmentsApp project={project} initial={settings} />
  }

  return (
    <AppShell
      project={project}
      title={tool.name}
      main={
        <div className="h-full overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto flex max-w-[720px] flex-col gap-6">
            <div className="flex items-center gap-4">
              <ToolIcon tool={tool} />
              <p className="type-body-md text-fg-secondary">{tool.description}</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-line-default bg-surface">
              <StudsMedia className="h-48" />
              <p className="p-6 type-body-md text-fg-secondary">The {tool.name} screens for {project.name} come next.</p>
            </div>
          </div>
        </div>
      }
      settings={tool.id === "settings" ? undefined : <p className="p-5 type-body-md text-fg-secondary">{tool.name} settings come with its screens.</p>}
    />
  )
}
