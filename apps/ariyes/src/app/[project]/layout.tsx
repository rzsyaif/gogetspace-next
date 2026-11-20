import { getMe, getProject, listProjects } from "@gogetspace/modules/mock"
import { TopBar } from "@/components/top-bar"

export async function generateStaticParams() {
  return (await listProjects()).map((p) => ({ project: p.id }))
}

export default async function ProjectLayout({ children, params }: LayoutProps<"/[project]">) {
  const { project: id } = await params
  const [all, me, project] = await Promise.all([listProjects(), getMe(), getProject(id)])
  // a site published in this session isn't listed yet: show it in the switcher too
  const projects = all.some((p) => p.id === project.id) ? all : [project, ...all]
  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <TopBar project={project} projects={projects} me={me} />
      {children}
    </div>
  )
}
